"""
Pub/Sub event handlers for ai-match-v1.

Handles:
  - job-published → compute and store top freelancer matches
  - profile-ready → re-rank matching jobs for the freelancer
"""

import structlog

logger = structlog.get_logger()


async def handle_job_published(data: dict) -> None:
    """
    When a job is published, find and rank matching freelancers.
    Stores results via PHP API callback.
    """
    job_id = data.get("job_id")
    if not job_id:
        logger.warning("missing_job_id", data=data)
        return

    logger.info("job_match_start", job_id=job_id)

    # In production: query DB for freelancer candidates,
    # compute embeddings, run vector similarity search.
    # For Phase 1: log and callback with empty results placeholder.
    try:
        from shared.callback import api_callback

        await api_callback.post(f"/jobs/{job_id}/matches", {
            "results": [],  # Will be populated when we integrate vector search
            "model_version": "match-v1.0.0",
            "latency_ms": 0,
        })
        logger.info("job_match_complete", job_id=job_id, candidates=0)
    except Exception:
        logger.exception("job_match_callback_failed", job_id=job_id)


async def handle_profile_ready(data: dict) -> None:
    """
    When a freelancer profile is ready (completeness >= 60%),
    store their profile embedding for future matching.
    """
    user_id = data.get("user_id")
    if not user_id:
        logger.warning("missing_user_id", data=data)
        return

    logger.info("profile_embedding_start", user_id=user_id)

    # In production: compute profile embedding via Vertex AI
    # For Phase 1: store a placeholder
    try:
        from shared.callback import api_callback

        await api_callback.patch(f"/freelancers/{user_id}/embedding", {
            "profile_embedding": [],  # Will be populated with real embeddings
        })
        logger.info("profile_embedding_stored", user_id=user_id)
    except Exception:
        logger.exception("profile_embedding_callback_failed", user_id=user_id)
