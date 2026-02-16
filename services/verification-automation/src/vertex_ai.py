"""
Vertex AI integration for verification analysis.

In production: calls Vertex AI Gemini for document/evidence analysis.
In dev: falls back to rule-based scoring.

Env vars:
  ENVIRONMENT: "dev" or "production" — controls whether to use Vertex AI
  GCP_PROJECT_ID: GCP project for Vertex AI
  REGION: GCP region (default: us-central1)
  VERTEX_MODEL: Model name (default: gemini-2.0-flash)
"""

import os
import json
import structlog
from typing import Optional

logger = structlog.get_logger()

ENVIRONMENT = os.getenv("ENVIRONMENT", "dev")
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "monkeyswork")
REGION = os.getenv("REGION", "us-central1")
VERTEX_MODEL = os.getenv("VERTEX_MODEL", "gemini-3-flash-preview")

# Lazy-loaded client
_model = None


def _get_model():
    """Lazy-load the Vertex AI generative model."""
    global _model
    if _model is None:
        import vertexai
        from vertexai.generative_models import GenerativeModel

        vertexai.init(project=GCP_PROJECT_ID, location=REGION)
        _model = GenerativeModel(VERTEX_MODEL)
        logger.info("vertex_model_loaded", model=VERTEX_MODEL, project=GCP_PROJECT_ID)
    return _model


# ── Prompts per verification type ────────────────────────────────────

VERIFICATION_PROMPTS = {
    "identity": """You are an identity verification AI. Analyze the following identity evidence and determine a confidence score (0.0 to 1.0) for whether this identity is legitimate.

Evidence provided:
{evidence}

Evaluate based on:
- Document completeness (government ID, selfie, etc.)
- Data consistency (name, DOB, address match)
- Document quality indicators

Respond in JSON only:
{{"confidence": <float 0.0-1.0>, "checks": [{{"check": "<name>", "passed": <bool>, "notes": "<detail>"}}], "summary": "<brief assessment>"}}""",

    "portfolio": """You are a portfolio verification AI. Analyze the following portfolio evidence and determine a confidence score (0.0 to 1.0) for the quality and authenticity of this freelancer's portfolio.

Evidence provided:
{evidence}

Evaluate based on:
- Number and variety of portfolio items
- Quality descriptions and context
- Evidence of original work
- Client references if provided

Respond in JSON only:
{{"confidence": <float 0.0-1.0>, "checks": [{{"check": "<name>", "passed": <bool>, "notes": "<detail>"}}], "summary": "<brief assessment>"}}""",

    "skill_assessment": """You are a skill assessment verification AI. Analyze the following skill evidence and determine a confidence score (0.0 to 1.0) for this freelancer's claimed skill proficiency.

Evidence provided:
{evidence}

Evaluate based on:
- Test scores or assessment results
- Certifications provided
- Years of experience
- Consistency of claims

Respond in JSON only:
{{"confidence": <float 0.0-1.0>, "checks": [{{"check": "<name>", "passed": <bool>, "notes": "<detail>"}}], "summary": "<brief assessment>"}}""",

    "work_history": """You are a work history verification AI. Analyze the following employment evidence and determine a confidence score (0.0 to 1.0) for the authenticity of this freelancer's work history.

Evidence provided:
{evidence}

Evaluate based on:
- Number of previous positions
- LinkedIn or professional profile links
- References provided
- Consistency and timeline gaps

Respond in JSON only:
{{"confidence": <float 0.0-1.0>, "checks": [{{"check": "<name>", "passed": <bool>, "notes": "<detail>"}}], "summary": "<brief assessment>"}}""",

    "payment_method": """You are a payment verification AI. Analyze the following payment method evidence and determine a confidence score (0.0 to 1.0) for whether the payment setup is complete and legitimate.

Evidence provided:
{evidence}

Evaluate based on:
- Bank account or payment provider connected
- Tax identification provided
- Billing address verified

Respond in JSON only:
{{"confidence": <float 0.0-1.0>, "checks": [{{"check": "<name>", "passed": <bool>, "notes": "<detail>"}}], "summary": "<brief assessment>"}}""",
}


async def analyze_with_vertex(
    verification_type: str,
    evidence: dict,
) -> dict:
    """
    Analyze verification evidence using Vertex AI Gemini.

    Returns:
        {"confidence": float, "checks": list, "summary": str, "model": str}
    """
    if ENVIRONMENT == "dev":
        logger.info("vertex_skipped_dev_mode", type=verification_type)
        return None  # Caller should fall back to rules

    prompt_template = VERIFICATION_PROMPTS.get(verification_type)
    if not prompt_template:
        logger.warning("no_prompt_for_type", type=verification_type)
        return None

    prompt = prompt_template.format(evidence=json.dumps(evidence, indent=2))

    try:
        model = _get_model()
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 1024,
                "response_mime_type": "application/json",
            },
        )

        # Parse response
        text = response.text.strip()
        # Strip markdown fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0].strip()

        result = json.loads(text)
        result["model"] = VERTEX_MODEL

        logger.info(
            "vertex_analysis_complete",
            type=verification_type,
            confidence=result.get("confidence"),
            model=VERTEX_MODEL,
        )

        return result

    except Exception as e:
        logger.exception(
            "vertex_analysis_failed",
            type=verification_type,
            error=str(e),
        )
        return None  # Caller should fall back to rules


def is_vertex_enabled() -> bool:
    """Check if Vertex AI should be used (production only)."""
    return ENVIRONMENT != "dev"
""", "Complexity": 7, "Description": "New Vertex AI integration module for verification-automation. Uses Gemini 2.0 Flash with type-specific prompts. Falls back to rule-based scoring in dev mode.", "EmptyFile": false, "IsArtifact": false, "Overwrite": false, "TargetFile": "/Volumes/Yorch/Dev/MonkeysWork/monkeyswork-repo/services/verification-automation/src/vertex_ai.py"}
