"""
Vertex AI integration for ai-fraud-v1.

Provides AI-powered fraud detection using Gemini:
  1. Account fraud baseline — evaluate new accounts for fraud indicators
  2. Proposal fraud analysis — detect fraudulent proposals
  3. Behavioral anomaly detection — identify suspicious patterns

Env vars:
  ENVIRONMENT: "dev" or "production"
  GCP_PROJECT_ID: GCP project for Vertex AI
  REGION: GCP region (default: us-central1)
  VERTEX_MODEL: Model name (default: gemini-3-flash-preview)
"""

import os
import json
import time
import structlog
from typing import Optional

logger = structlog.get_logger()

ENVIRONMENT = os.getenv("ENVIRONMENT", "dev")
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "monkeyswork")
REGION = os.getenv("REGION", "us-central1")
VERTEX_MODEL = os.getenv("VERTEX_MODEL", "gemini-3-flash-preview")

_model = None


def _get_model():
    """Lazy-load Vertex AI generative model."""
    global _model
    if _model is None:
        import vertexai
        from vertexai.generative_models import GenerativeModel

        vertexai.init(project=GCP_PROJECT_ID, location=REGION)
        _model = GenerativeModel(VERTEX_MODEL)
        logger.info("vertex_model_loaded", model=VERTEX_MODEL, project=GCP_PROJECT_ID)
    return _model


def is_vertex_enabled() -> bool:
    return ENVIRONMENT != "dev"


# ── Account Fraud Baseline ───────────────────────────────────────────

ACCOUNT_BASELINE_PROMPT = """You are an AI fraud analyst for MonkeysWork, a freelance marketplace.
Analyze this new account registration for fraud risk indicators.

ACCOUNT DATA:
- Email: {email}
- Role: {role}
- Registration IP: {ip}
- User Agent: {user_agent}
- Display Name: {display_name}
- Account Created: {created_at}

EVALUATE for fraud signals:
1. Email quality (disposable/temp domain, numeric-heavy, suspicious patterns)
2. Registration patterns (known VPN/proxy, suspicious user agent, automation indicators)
3. Name quality (random strings, known fake name patterns, keyboard mashing)
4. Overall risk assessment

Respond in STRICT JSON only:
{{
  "fraud_score": <float 0.0-1.0, 0=clean 1=definitely fraudulent>,
  "risk_tier": "<low|medium|high|critical>",
  "risk_factors": [
    {{
      "factor": "<factor_name>",
      "contribution": <float 0.0-1.0>,
      "description": "<detailed explanation>"
    }}
  ],
  "recommended_action": "<allow|monitor|review|block>",
  "reasoning": "<brief overall assessment>"
}}"""


async def analyze_account_fraud(
    email: str,
    role: str = "unknown",
    ip: str = "",
    user_agent: str = "",
    display_name: str = "",
    created_at: str = "",
) -> Optional[dict]:
    """Use Vertex AI Gemini to analyze account fraud risk."""
    if not is_vertex_enabled():
        return None

    prompt = ACCOUNT_BASELINE_PROMPT.format(
        email=email,
        role=role,
        ip=ip or "Not available",
        user_agent=user_agent or "Not available",
        display_name=display_name or "Not provided",
        created_at=created_at or "Unknown",
    )

    try:
        start = time.monotonic()
        model = _get_model()
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 1024,
                "response_mime_type": "application/json",
            },
        )

        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0].strip()

        result = json.loads(text)
        result["model"] = VERTEX_MODEL
        result["latency_ms"] = int((time.monotonic() - start) * 1000)

        logger.info(
            "vertex_account_fraud_complete",
            email=email[:3] + "***",
            fraud_score=result.get("fraud_score"),
            risk_tier=result.get("risk_tier"),
            model=VERTEX_MODEL,
        )
        return result

    except Exception as e:
        logger.exception("vertex_account_fraud_failed", error=str(e))
        return None


# ── Proposal Fraud Analysis ──────────────────────────────────────────

PROPOSAL_FRAUD_PROMPT = """You are an AI fraud analyst for MonkeysWork, a freelance marketplace.
Analyze this proposal submission for fraud and spam indicators.

PROPOSAL DATA:
- Cover Letter: {cover_letter}
- Bid Amount: ${bid_amount}
- Job Budget: ${budget_min} – ${budget_max}
- Job Required Skills: {job_skills}
- Freelancer Skills: {freelancer_skills}
- Account Age: {account_age_days} days
- Proposals Submitted (last hour): {proposals_last_hour}
- Total Proposals (lifetime): {total_proposals}

EVALUATE for:
1. Cover letter quality (generic/templated, copy-paste, AI-generated spam, relevance to job)
2. Bid analysis (suspiciously low/high bid relative to budget, underpricing strategy)
3. Skill alignment (does freelancer have relevant skills for this job)
4. Behavioral signals (proposal velocity, new account mass-bidding)
5. Content red flags (requests for off-platform communication, personal info requests)

Respond in STRICT JSON only:
{{
  "fraud_score": <float 0.0-1.0, 0=clean 1=definitely fraudulent>,
  "risk_tier": "<low|medium|high|critical>",
  "risk_factors": [
    {{
      "factor": "<factor_name>",
      "contribution": <float 0.0-1.0>,
      "description": "<detailed explanation>"
    }}
  ],
  "recommended_action": "<allow|review|block>",
  "reasoning": "<brief overall assessment>"
}}"""


async def analyze_proposal_fraud(
    cover_letter: str = "",
    bid_amount: float = None,
    budget_min: float = None,
    budget_max: float = None,
    job_skills: list = None,
    freelancer_skills: list = None,
    account_age_days: int = None,
    proposals_last_hour: int = None,
    total_proposals: int = None,
) -> Optional[dict]:
    """Use Vertex AI Gemini to analyze proposal fraud risk."""
    if not is_vertex_enabled():
        return None

    prompt = PROPOSAL_FRAUD_PROMPT.format(
        cover_letter=cover_letter or "Not provided",
        bid_amount=bid_amount or "N/A",
        budget_min=budget_min or "N/A",
        budget_max=budget_max or "N/A",
        job_skills=", ".join(job_skills or []),
        freelancer_skills=", ".join(freelancer_skills or []),
        account_age_days=account_age_days if account_age_days is not None else "Unknown",
        proposals_last_hour=proposals_last_hour if proposals_last_hour is not None else "Unknown",
        total_proposals=total_proposals if total_proposals is not None else "Unknown",
    )

    try:
        start = time.monotonic()
        model = _get_model()
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 1024,
                "response_mime_type": "application/json",
            },
        )

        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0].strip()

        result = json.loads(text)
        result["model"] = VERTEX_MODEL
        result["latency_ms"] = int((time.monotonic() - start) * 1000)

        logger.info(
            "vertex_proposal_fraud_complete",
            fraud_score=result.get("fraud_score"),
            risk_tier=result.get("risk_tier"),
            model=VERTEX_MODEL,
        )
        return result

    except Exception as e:
        logger.exception("vertex_proposal_fraud_failed", error=str(e))
        return None


# ── Behavioral Anomaly Detection ─────────────────────────────────────

ANOMALY_PROMPT = """You are an AI behavioral analyst for MonkeysWork, a freelance marketplace.
Analyze this user's activity pattern for signs of fraudulent or abusive behavior.

USER ACTIVITY:
- Account Age: {account_age_days} days
- Role: {role}
- Total Proposals Sent: {total_proposals}
- Proposals Last 24h: {proposals_24h}
- Average Bid Amount: ${avg_bid}
- Jobs Completed: {jobs_completed}
- Average Rating: {avg_rating}
- Disputes Filed: {disputes}
- Messages Sent (24h): {messages_24h}
- Login Locations: {login_locations}
- Payment Method Changes: {payment_changes}

EVALUATE for behavioral anomalies:
1. Volume anomalies (sudden spikes in activity)
2. Rate manipulation (artificially low bids, fee avoidance)
3. Account takeover signals (location changes, payment method changes)
4. Abuse patterns (dispute manipulation, rating manipulation)

Respond in STRICT JSON only:
{{
  "anomaly_score": <float 0.0-1.0>,
  "anomaly_type": "<none|volume_spike|account_takeover|rate_manipulation|abuse|mixed>",
  "risk_factors": [
    {{
      "factor": "<factor_name>",
      "contribution": <float 0.0-1.0>,
      "description": "<explanation>"
    }}
  ],
  "recommended_action": "<none|monitor|flag|suspend>",
  "reasoning": "<brief assessment>"
}}"""


async def detect_behavioral_anomaly(
    account_age_days: int = 0,
    role: str = "unknown",
    total_proposals: int = 0,
    proposals_24h: int = 0,
    avg_bid: float = 0,
    jobs_completed: int = 0,
    avg_rating: float = 0,
    disputes: int = 0,
    messages_24h: int = 0,
    login_locations: list = None,
    payment_changes: int = 0,
) -> Optional[dict]:
    """Use Vertex AI Gemini to detect behavioral anomalies."""
    if not is_vertex_enabled():
        return None

    prompt = ANOMALY_PROMPT.format(
        account_age_days=account_age_days,
        role=role,
        total_proposals=total_proposals,
        proposals_24h=proposals_24h,
        avg_bid=avg_bid,
        jobs_completed=jobs_completed,
        avg_rating=avg_rating,
        disputes=disputes,
        messages_24h=messages_24h,
        login_locations=", ".join(login_locations or ["Unknown"]),
        payment_changes=payment_changes,
    )

    try:
        start = time.monotonic()
        model = _get_model()
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 1024,
                "response_mime_type": "application/json",
            },
        )

        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0].strip()

        result = json.loads(text)
        result["model"] = VERTEX_MODEL
        result["latency_ms"] = int((time.monotonic() - start) * 1000)

        logger.info(
            "vertex_anomaly_complete",
            anomaly_score=result.get("anomaly_score"),
            anomaly_type=result.get("anomaly_type"),
            model=VERTEX_MODEL,
        )
        return result

    except Exception as e:
        logger.exception("vertex_anomaly_failed", error=str(e))
        return None
