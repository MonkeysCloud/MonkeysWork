"""
Shared audit logger — logs AI decisions and optionally persists via PHP API callback.
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import structlog

logger = structlog.get_logger()


async def log_ai_decision(
    decision_type: str,
    entity_type: str,
    entity_id: str,
    model_name: str,
    model_version: str,
    output: Dict[str, Any],
    confidence_score: float,
    latency_ms: int,
    prompt_version: Optional[str] = None,
    explanation: Optional[Dict] = None,
    persist: bool = True,
) -> Dict[str, Any]:
    """Log an AI decision for audit trail and persist to DB via callback."""
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "shared"))

    record = {
        "id": str(uuid.uuid4()),
        "decision_type": decision_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "model_name": model_name,
        "model_version": model_version,
        "prompt_version": prompt_version,
        "output": output,
        "confidence_score": confidence_score,
        "latency_ms": latency_ms,
        "explanation": explanation,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    logger.info("ai_decision", **record)

    # Persist to PHP API via callback
    if persist:
        try:
            from callback import post_internal
            await post_internal("/api/v1/internal/decisions", record)
        except Exception as e:
            logger.warning("audit_persist_failed", error=str(e), decision_id=record["id"])

    return record
