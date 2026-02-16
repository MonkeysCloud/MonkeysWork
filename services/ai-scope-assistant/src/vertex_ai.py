"""
Vertex AI integration for ai-scope-assistant.

Provides two AI capabilities:
  1. Job scope analysis — decompose jobs into milestones using Gemini
  2. Job content moderation — evaluate job quality, legitimacy, policy compliance

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
    """Check if Vertex AI should be used (production only)."""
    return ENVIRONMENT != "dev"


# ── Scope Analysis ───────────────────────────────────────────────────

SCOPE_PROMPT = """You are a project scope analyst for MonkeysWork, a freelance marketplace.
Analyze this job posting and decompose it into structured milestones with time/cost estimates.

JOB DETAILS:
- Title: {title}
- Description: {description}
- Category: {category}
- Required Skills: {skills}
- Budget Range: ${budget_min} – ${budget_max}

DECOMPOSE into milestones. Each milestone should have:
- title: concise milestone name
- description: what is delivered
- tasks: list of individual tasks with hour estimates
- estimated_hours: total hours for this milestone
- estimated_cost: cost based on a reasonable hourly rate for the skill set

Also determine:
- complexity_tier: one of "simple", "moderate", "complex", "enterprise"
- confidence_score: how confident you are in this estimate (0.0-1.0)

Respond in STRICT JSON only, no markdown fences:
{{
  "milestones": [
    {{
      "title": "<string>",
      "description": "<string>",
      "estimated_hours": <float>,
      "estimated_cost": <float>,
      "tasks": [
        {{"title": "<string>", "estimated_hours": <float>}}
      ]
    }}
  ],
  "total_estimated_hours": <float>,
  "total_estimated_cost": <float>,
  "complexity_tier": "<simple|moderate|complex|enterprise>",
  "confidence_score": <float 0.0-1.0>
}}"""


async def analyze_scope_with_vertex(
    title: str,
    description: str,
    category: str = "",
    skills: list = None,
    budget_min: float = None,
    budget_max: float = None,
) -> Optional[dict]:
    """Use Vertex AI Gemini to analyze job scope."""
    if not is_vertex_enabled():
        return None

    prompt = SCOPE_PROMPT.format(
        title=title,
        description=description,
        category=category or "General",
        skills=", ".join(skills or []),
        budget_min=budget_min or "N/A",
        budget_max=budget_max or "N/A",
    )

    try:
        start = time.monotonic()
        model = _get_model()
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "max_output_tokens": 4096,
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
            "vertex_scope_complete",
            complexity=result.get("complexity_tier"),
            milestones=len(result.get("milestones", [])),
            model=VERTEX_MODEL,
        )
        return result

    except Exception as e:
        logger.exception("vertex_scope_failed", error=str(e))
        return None


# ── Content Moderation ───────────────────────────────────────────────

MODERATION_PROMPT = """You are an AI content moderator for MonkeysWork, a freelance marketplace.
Evaluate this job posting for quality, legitimacy, and policy compliance.

JOB POSTING:
- Title: {title}
- Description: {description}
- Budget Range: ${budget_min} – ${budget_max}
- Experience Level: {experience_level}
- Category: {category}
- Skills Required: {skills}

EVALUATE for:
1. Content quality (clear title, detailed description, reasonable budget)
2. Policy compliance (no spam, scam, discrimination, illegal content, personal info sharing)
3. Legitimacy (real job, not misleading, reasonable expectations)
4. Professional standards (appropriate language, realistic timelines)

FLAGS to check:
- spam: mass-posted or generic content
- scam: requests personal info, upfront payment, or too-good-to-be-true offers
- discrimination: discriminatory language or requirements
- illegal: requests for illegal activities
- misleading: title doesn't match description, hidden requirements
- low_quality: vague description, no clear deliverables
- contact_info: email, phone, or external links in description
- unrealistic_budget: budget is absurdly low for the scope of work

Respond in STRICT JSON only, no markdown fences:
{{
  "confidence": <float 0.0-1.0, overall confidence the job is legitimate and high-quality>,
  "quality": <float 0.0-1.0, content quality score>,
  "flags": [<list of flag strings that apply, empty if clean>],
  "reasoning": "<brief explanation of the assessment>"
}}"""


async def moderate_job_with_vertex(
    title: str,
    description: str,
    budget_min: float = None,
    budget_max: float = None,
    experience_level: str = "",
    category: str = "",
    skills: list = None,
) -> Optional[dict]:
    """Use Vertex AI Gemini to moderate a job posting."""
    if not is_vertex_enabled():
        return None

    prompt = MODERATION_PROMPT.format(
        title=title,
        description=description,
        budget_min=budget_min or "N/A",
        budget_max=budget_max or "N/A",
        experience_level=experience_level or "Not specified",
        category=category or "General",
        skills=", ".join(skills or []),
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
            "vertex_moderation_complete",
            confidence=result.get("confidence"),
            flags=result.get("flags"),
            model=VERTEX_MODEL,
        )
        return result

    except Exception as e:
        logger.exception("vertex_moderation_failed", error=str(e))
        return None
