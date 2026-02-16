"""
Pub/Sub event handlers for ai-scope-assistant.

Handles:
  - job-published → auto-analyze scope for new jobs
  - job-published → content moderation for new jobs
"""

import time
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
        from src.vertex_ai import analyze_scope_with_vertex, is_vertex_enabled

        if is_vertex_enabled():
            # Production: use Vertex AI for scope analysis
            result = await analyze_scope_with_vertex(
                title=title,
                description=description,
                category=category,
                skills=skills,
                budget_min=budget_min,
                budget_max=budget_max,
            )
            if result:
                from shared.callback import api_callback

                await api_callback.patch(f"/jobs/{job_id}/scope", {
                    "ai_scope": {
                        "milestones": result.get("milestones", []),
                        "total_estimated_hours": result.get("total_estimated_hours", 0),
                        "total_estimated_cost": result.get("total_estimated_cost", 0),
                        "complexity_tier": result.get("complexity_tier", "moderate"),
                    },
                    "model_version": f"vertex-ai/{result.get('model', 'gemini-3-flash-preview')}",
                    "confidence": result.get("confidence_score", 0.7),
                })
                logger.info("scope_analysis_complete_vertex", job_id=job_id)
                return

        # Fallback: rule-based scope analysis
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


async def handle_job_moderation(data: dict) -> None:
    """
    When a job is published, run content moderation with Vertex AI.
    Calls back to PHP API with moderation result.
    """
    job_id = data.get("job_id")
    if not job_id:
        logger.warning("missing_job_id_moderation", data=data)
        return

    title = data.get("title", "")
    description = data.get("description", "")
    skills = data.get("skills_required", [])
    budget_min = data.get("budget_min")
    budget_max = data.get("budget_max")
    experience_level = data.get("experience_level", "")
    category = data.get("category", "")

    logger.info("job_moderation_start", job_id=job_id)
    start = time.monotonic()

    try:
        from src.vertex_ai import moderate_job_with_vertex, is_vertex_enabled

        if is_vertex_enabled():
            result = await moderate_job_with_vertex(
                title=title,
                description=description,
                budget_min=budget_min,
                budget_max=budget_max,
                experience_level=experience_level,
                category=category,
                skills=skills,
            )
            if result:
                from shared.callback import api_callback

                await api_callback.patch(f"/jobs/{job_id}/moderation", {
                    "confidence": result.get("confidence", 0.5),
                    "quality": result.get("quality", 0.5),
                    "flags": result.get("flags", []),
                    "reasoning": result.get("reasoning", ""),
                    "model_version": f"vertex-ai/{result.get('model', 'gemini-3-flash-preview')}",
                    "latency_ms": result.get("latency_ms", 0),
                })

                logger.info(
                    "job_moderation_complete_vertex",
                    job_id=job_id,
                    confidence=result.get("confidence"),
                    flags=result.get("flags"),
                    latency_ms=int((time.monotonic() - start) * 1000),
                )
                return

        # Fallback: rule-based moderation
        confidence, flags, quality = _rule_based_moderation(
            title, description, budget_min, budget_max
        )

        from shared.callback import api_callback

        await api_callback.patch(f"/jobs/{job_id}/moderation", {
            "confidence": confidence,
            "quality": quality,
            "flags": flags,
            "reasoning": "Rule-based assessment (Vertex AI unavailable)",
            "model_version": "rule-v1.0.0",
            "latency_ms": int((time.monotonic() - start) * 1000),
        })

        logger.info(
            "job_moderation_complete_rules",
            job_id=job_id,
            confidence=confidence,
            flags=flags,
        )

    except Exception:
        logger.exception("job_moderation_failed", job_id=job_id)


def _rule_based_moderation(
    title: str, description: str,
    budget_min: float = None, budget_max: float = None,
) -> tuple[float, list, float]:
    """
    Simple rule-based moderation fallback.
    Returns (confidence, flags, quality).
    """
    flags = []
    quality = 0.5

    # Title checks
    if len(title) < 10:
        flags.append("low_quality")
        quality -= 0.1
    elif len(title) > 15:
        quality += 0.1

    # Description checks
    desc_len = len(description.strip())
    if desc_len < 50:
        flags.append("low_quality")
        quality -= 0.2
    elif desc_len > 200:
        quality += 0.15
    elif desc_len > 500:
        quality += 0.25

    # Contact info patterns
    import re
    if re.search(r'[\w.-]+@[\w.-]+\.\w+', description):
        flags.append("contact_info")
    if re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', description):
        flags.append("contact_info")

    # Budget sanity
    if budget_min and budget_max:
        if budget_max < 5:
            flags.append("unrealistic_budget")
        elif budget_min > 0:
            quality += 0.1

    quality = max(0.0, min(1.0, quality))
    confidence = quality if not flags else max(0.2, quality - 0.2 * len(flags))
    confidence = max(0.0, min(1.0, confidence))

    return round(confidence, 4), flags, round(quality, 4)
