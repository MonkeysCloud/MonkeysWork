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


# ── Job Enhancement ──────────────────────────────────────────────────

JOB_ENHANCE_PROMPT = """You are a hiring expert for MonkeysWork, a freelance marketplace.
Improve this job posting to attract better freelancers.

CURRENT JOB POSTING:
- Title: {title}
- Description: {description}
- Category: {category}
- Skills Listed: {skills}
- Budget Range: ${budget_min} – ${budget_max}

PROVIDE:
1. An improved, SEO-friendly title
2. An enhanced, well-structured description (use paragraph text, not HTML/markdown)
3. Up to 5 additional suggested skills that would be relevant
4. Suggested milestone breakdown (3-5 milestones with titles and estimated amounts)
5. Tips to improve the posting

Respond in STRICT JSON only, no markdown fences:
{{
  "improved_title": "<string>",
  "improved_description": "<string, multi-paragraph, plain text with line breaks>",
  "suggested_skills": ["<skill1>", "<skill2>", ...],
  "suggested_milestones": [
    {{"title": "<string>", "description": "<string>", "estimated_amount": <float>}}
  ],
  "tips": ["<tip1>", "<tip2>", ...],
  "estimated_budget_range": {{"min": <float>, "max": <float>}}
}}"""


async def enhance_job_with_vertex(
    title: str,
    description: str,
    category: str = "",
    skills: list = None,
    budget_min: float = None,
    budget_max: float = None,
) -> Optional[dict]:
    """Use Vertex AI Gemini to enhance a job posting."""
    if not is_vertex_enabled():
        return None

    prompt = JOB_ENHANCE_PROMPT.format(
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
                "temperature": 0.4,
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
            "vertex_job_enhance_complete",
            milestones=len(result.get("suggested_milestones", [])),
            model=VERTEX_MODEL,
        )
        return result

    except Exception as e:
        logger.exception("vertex_job_enhance_failed", error=str(e))
        return None


# ── Proposal Generation ──────────────────────────────────────────────

PROPOSAL_PROMPT = """You are a freelance career coach helping a freelancer write a winning proposal on MonkeysWork.

JOB DETAILS:
- Title: {job_title}
- Description: {job_description}
- Category: {category}
- Required Skills: {required_skills}
- Budget: ${budget_min} – ${budget_max}
- Experience Level: {experience_level}

FREELANCER PROFILE:
- Name: {freelancer_name}
- Skills: {freelancer_skills}
- Bio: {freelancer_bio}
- Additional highlights: {highlights}

TONE: {tone}

WRITE a compelling proposal cover letter (300-500 words) that:
1. Acknowledges the client's specific needs
2. Highlights relevant experience and skills
3. Proposes a clear approach/methodology
4. Expresses enthusiasm and professionalism
5. Ends with a strong call-to-action

Also suggest:
- A competitive bid amount within the budget range
- 3-5 milestones with titles, descriptions, and amounts
- Estimated duration in weeks

Respond in STRICT JSON only, no markdown fences:
{{
  "cover_letter": "<string, multi-paragraph, plain text>",
  "suggested_bid": <float>,
  "suggested_milestones": [
    {{"title": "<string>", "description": "<string>", "amount": <float>}}
  ],
  "suggested_duration_weeks": <int>,
  "key_talking_points": ["<point1>", "<point2>", ...]
}}"""


async def generate_proposal_with_vertex(
    job_title: str,
    job_description: str,
    category: str = "",
    required_skills: list = None,
    budget_min: float = None,
    budget_max: float = None,
    experience_level: str = "",
    freelancer_name: str = "",
    freelancer_skills: list = None,
    freelancer_bio: str = "",
    highlights: str = "",
    tone: str = "professional",
) -> Optional[dict]:
    """Use Vertex AI Gemini to generate a proposal draft."""
    if not is_vertex_enabled():
        return None

    prompt = PROPOSAL_PROMPT.format(
        job_title=job_title,
        job_description=job_description,
        category=category or "General",
        required_skills=", ".join(required_skills or []),
        budget_min=budget_min or "N/A",
        budget_max=budget_max or "N/A",
        experience_level=experience_level or "Not specified",
        freelancer_name=freelancer_name or "Freelancer",
        freelancer_skills=", ".join(freelancer_skills or []),
        freelancer_bio=freelancer_bio or "Not provided",
        highlights=highlights or "Not provided",
        tone=tone,
    )

    try:
        start = time.monotonic()
        model = _get_model()
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.5,
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
            "vertex_proposal_generate_complete",
            milestones=len(result.get("suggested_milestones", [])),
            model=VERTEX_MODEL,
        )
        return result

    except Exception as e:
        logger.exception("vertex_proposal_generate_failed", error=str(e))
        return None
