"""
Vertex AI integration for ai-match-v1.

Provides AI-powered matching and ranking using Gemini:
  1. Job-freelancer matching — rank candidates using AI analysis
  2. Profile embedding generation — create semantic profile vectors
  3. Match explanation — generate human-readable match reasons

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


# ── Job-Freelancer Match Ranking ─────────────────────────────────────

MATCH_RANKING_PROMPT = """You are an AI talent matcher for MonkeysWork, a freelance marketplace.
Rank these freelancer candidates for the given job based on overall fit.

JOB DETAILS:
- Title: {job_title}
- Description: {job_description}
- Required Skills: {job_skills}
- Budget: ${budget_min} – ${budget_max}
- Experience Level: {experience_level}

CANDIDATES:
{candidates_json}

For EACH candidate, evaluate:
1. Skill relevance (direct match and transferable skills)
2. Rate compatibility (within budget range)
3. Experience appropriateness (matches required level)
4. Profile quality (completeness, verification status)
5. Track record (ratings, completed jobs)

Rank ALL candidates from best to worst fit.

Respond in STRICT JSON only:
{{
  "rankings": [
    {{
      "freelancer_id": "<string>",
      "score": <float 0.0-1.0>,
      "breakdown": {{
        "skill_match": <float 0.0-1.0>,
        "rate_fit": <float 0.0-1.0>,
        "experience_fit": <float 0.0-1.0>,
        "profile_quality": <float 0.0-1.0>,
        "reputation": <float 0.0-1.0>
      }},
      "explanation": "<short human-readable reason for this ranking>"
    }}
  ]
}}"""


async def rank_with_vertex(
    job_title: str,
    job_description: str,
    job_skills: list = None,
    budget_min: float = None,
    budget_max: float = None,
    experience_level: str = "",
    candidates: list = None,
) -> Optional[dict]:
    """Use Vertex AI Gemini to rank freelancer candidates for a job."""
    if not is_vertex_enabled():
        return None

    if not candidates:
        return None

    prompt = MATCH_RANKING_PROMPT.format(
        job_title=job_title,
        job_description=job_description[:2000],  # Truncate for token limits
        job_skills=", ".join(job_skills or []),
        budget_min=budget_min or "N/A",
        budget_max=budget_max or "N/A",
        experience_level=experience_level or "Any",
        candidates_json=json.dumps(candidates[:50], indent=2),  # Max 50 candidates
    )

    try:
        start = time.monotonic()
        model = _get_model()
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.1,
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
            "vertex_match_ranking_complete",
            candidates_ranked=len(result.get("rankings", [])),
            model=VERTEX_MODEL,
        )
        return result

    except Exception as e:
        logger.exception("vertex_match_ranking_failed", error=str(e))
        return None


# ── Profile Embedding ────────────────────────────────────────────────

EMBEDDING_PROMPT = """You are an AI profile analyst for MonkeysWork, a freelance marketplace.
Analyze this freelancer profile and generate a structured summary for matching.

PROFILE DATA:
- Skills: {skills}
- Bio: {bio}
- Experience Years: {experience_years}
- Hourly Rate: ${hourly_rate}
- Completed Jobs: {completed_jobs}
- Average Rating: {avg_rating}
- Specializations: {specializations}
- Education: {education}
- Certifications: {certifications}

Generate a semantic profile analysis for use in future job matching.

Respond in STRICT JSON only:
{{
  "primary_domain": "<main expertise area>",
  "skill_clusters": [
    {{
      "cluster": "<cluster name>",
      "skills": ["<skill1>", "<skill2>"],
      "proficiency": "<beginner|intermediate|advanced|expert>"
    }}
  ],
  "ideal_job_types": ["<job type 1>", "<job type 2>"],
  "hourly_rate_tier": "<budget|mid|premium|expert>",
  "experience_tier": "<entry|mid|senior|expert>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "match_keywords": ["<keyword1>", "<keyword2>", "..."]
}}"""


async def generate_profile_embedding(
    skills: list = None,
    bio: str = "",
    experience_years: int = 0,
    hourly_rate: float = 0,
    completed_jobs: int = 0,
    avg_rating: float = 0,
    specializations: list = None,
    education: str = "",
    certifications: list = None,
) -> Optional[dict]:
    """Use Vertex AI to generate a semantic profile analysis for matching."""
    if not is_vertex_enabled():
        return None

    prompt = EMBEDDING_PROMPT.format(
        skills=", ".join(skills or []),
        bio=bio[:1000] or "Not provided",
        experience_years=experience_years,
        hourly_rate=hourly_rate,
        completed_jobs=completed_jobs,
        avg_rating=avg_rating,
        specializations=", ".join(specializations or []),
        education=education or "Not provided",
        certifications=", ".join(certifications or []),
    )

    try:
        start = time.monotonic()
        model = _get_model()
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 2048,
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
            "vertex_profile_embedding_complete",
            primary_domain=result.get("primary_domain"),
            model=VERTEX_MODEL,
        )
        return result

    except Exception as e:
        logger.exception("vertex_profile_embedding_failed", error=str(e))
        return None
