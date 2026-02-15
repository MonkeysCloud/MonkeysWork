"""
Pub/Sub event handler for ai-scope-assistant.

Handles:
  - job-published → auto-analyze scope for new jobs
"""

import structlog

logger = structlog.get_logger()


async def handle_job_published(data: dict) -> None:
    """
    When a job is published, automatically analyze its scope
    and store the results via PHP API callback.
    """
    job_id = data.get("job_id")
    if not job_id:
        logger.warning("missing_job_id", data=data)
        return

    title = data.get("title", "")
    description = data.get("description", "")
    skills = data.get("skills_required", [])
    budget_min = data.get("budget_min")
    budget_max = data.get("budget_max")
    category = data.get("category", "")

    if not description:
        logger.info("skipping_empty_description", job_id=job_id)
        return

    logger.info("scope_analysis_start", job_id=job_id)

    try:
        from src.routes import analyze_scope, ScopeRequest

        request = ScopeRequest(
            job_id=job_id,
            title=title,
            description=description,
            category=category,
            skills_required=skills,
            budget_min=budget_min,
            budget_max=budget_max,
        )

        result = analyze_scope(request)

        # Callback to PHP API
        from shared.callback import api_callback

        await api_callback.patch(f"/jobs/{job_id}/scope", {
            "ai_scope": {
                "milestones": [m.model_dump() for m in result.milestones],
                "total_estimated_hours": result.total_estimated_hours,
                "total_estimated_cost": result.total_estimated_cost,
                "complexity_tier": result.complexity_tier,
            },
            "model_version": result.model_version,
            "confidence": result.confidence_score,
        })

        logger.info(
            "scope_analysis_complete",
            job_id=job_id,
            complexity=result.complexity_tier,
            milestones=len(result.milestones),
        )
    except Exception:
        logger.exception("scope_analysis_failed", job_id=job_id)
