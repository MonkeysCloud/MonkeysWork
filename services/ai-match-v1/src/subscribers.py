"""
Pub/Sub event handlers for ai-match-v1.

Handles:
  - job-published → compute and store top freelancer matches
  - profile-ready → generate and store profile embedding
"""

import time
import structlog

logger = structlog.get_logger()


async def handle_job_published(data: dict) -> None:
    """
    When a job is published, find and rank matching freelancers.
    In production: uses Vertex AI for intelligent ranking.
    Fallback: rule-based scoring.
    """
    job_id = data.get("job_id")
    if not job_id:
        logger.warning("missing_job_id", data=data)
        return

    logger.info("job_match_start", job_id=job_id)
    start = time.monotonic()

    try:
        from src.vertex_ai import rank_with_vertex, is_vertex_enabled

        # Fetch candidate freelancers from the PHP API
        from shared.callback import api_callback
        candidates_resp = await api_callback.get(f"/jobs/{job_id}/candidates")
        candidates = candidates_resp.get("candidates", []) if candidates_resp else []

        if not candidates:
            logger.info("no_candidates_found", job_id=job_id)
            return

        if is_vertex_enabled():
            # Production: Vertex AI ranking
            result = await rank_with_vertex(
                job_title=data.get("title", ""),
                job_description=data.get("description", ""),
                job_skills=data.get("skills_required", []),
                budget_min=data.get("budget_min"),
                budget_max=data.get("budget_max"),
                experience_level=data.get("experience_level", ""),
                candidates=candidates,
            )
            if result:
                await api_callback.post(f"/jobs/{job_id}/matches", {
                    "results": result.get("rankings", []),
                    "model_version": f"vertex-ai/{result.get('model', 'gemini-3-flash-preview')}",
                    "latency_ms": result.get("latency_ms", 0),
                })
                logger.info(
                    "job_match_complete_vertex",
                    job_id=job_id,
                    candidates=len(result.get("rankings", [])),
                    latency_ms=int((time.monotonic() - start) * 1000),
                )
                return

        # Fallback: rule-based ranking
        from src.routes import rank_candidates, MatchRequest, FreelancerCandidate

        request = MatchRequest(
            job_id=job_id,
            job_skills=data.get("skills_required", []),
            job_budget_min=data.get("budget_min"),
            job_budget_max=data.get("budget_max"),
            experience_level=data.get("experience_level"),
            candidates=[
                FreelancerCandidate(**c) for c in candidates
            ],
        )
        result = rank_candidates(request)

        await api_callback.post(f"/jobs/{job_id}/matches", {
            "results": [r.model_dump() for r in result.results],
            "model_version": result.model_version,
            "latency_ms": result.latency_ms,
        })
        logger.info(
            "job_match_complete_rules",
            job_id=job_id,
            candidates=len(result.results),
        )
    except Exception:
        logger.exception("job_match_failed", job_id=job_id)


async def handle_profile_ready(data: dict) -> None:
    """
    When a freelancer profile is ready, generate and store their
    semantic profile for future matching.
    In production: uses Vertex AI for intelligent embedding.
    """
    user_id = data.get("user_id")
    if not user_id:
        logger.warning("missing_user_id", data=data)
        return

    logger.info("profile_embedding_start", user_id=user_id)
    start = time.monotonic()

    try:
        from src.vertex_ai import generate_profile_embedding, is_vertex_enabled

        if is_vertex_enabled():
            result = await generate_profile_embedding(
                skills=data.get("skills", []),
                bio=data.get("bio", ""),
                experience_years=data.get("experience_years", 0),
                hourly_rate=data.get("hourly_rate", 0),
                completed_jobs=data.get("completed_jobs", 0),
                avg_rating=data.get("avg_rating", 0),
                specializations=data.get("specializations", []),
                education=data.get("education", ""),
                certifications=data.get("certifications", []),
            )
            if result:
                from shared.callback import api_callback

                await api_callback.patch(f"/freelancers/{user_id}/embedding", {
                    "profile_embedding": result,
                    "model_version": f"vertex-ai/{result.get('model', 'gemini-3-flash-preview')}",
                })
                logger.info(
                    "profile_embedding_complete_vertex",
                    user_id=user_id,
                    primary_domain=result.get("primary_domain"),
                    latency_ms=int((time.monotonic() - start) * 1000),
                )
                return

        # Fallback: basic profile data
        from shared.callback import api_callback

        await api_callback.patch(f"/freelancers/{user_id}/embedding", {
            "profile_embedding": {
                "skills": data.get("skills", []),
                "experience_years": data.get("experience_years", 0),
            },
            "model_version": "rule-v1.0.0",
        })
        logger.info("profile_embedding_stored_basic", user_id=user_id)
    except Exception:
        logger.exception("profile_embedding_failed", user_id=user_id)
