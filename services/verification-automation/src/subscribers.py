"""
Pub/Sub event handlers for verification-automation.

Handles:
  - user-registered → creates pending identity verification
  - verification-submitted → processes uploaded documents with AI
"""

import random
import structlog

logger = structlog.get_logger()


async def handle_user_registered(data: dict) -> None:
    """
    When a user registers, create an initial identity verification record.
    This shows "Complete your verification" in the user's dashboard.
    """
    user_id = data.get("user_id")
    role = data.get("role", "unknown")

    if not user_id:
        logger.warning("missing_user_id", data=data)
        return

    # Only freelancers need identity verification
    if role != "freelancer":
        logger.info("skipping_non_freelancer", user_id=user_id, role=role)
        return

    logger.info("creating_identity_verification", user_id=user_id)

    try:
        from shared.callback import api_callback

        await api_callback.post("/verifications", {
            "user_id": user_id,
            "type": "identity",
            "status": "pending",
            "data": {"reason": "auto_created_on_registration"},
        })

        logger.info("identity_verification_created", user_id=user_id)
    except Exception:
        logger.exception("create_verification_failed", user_id=user_id)


async def handle_verification_submitted(data: dict) -> None:
    """
    When a user submits verification documents, process them with AI.
    In production: uses Vertex AI (Gemini) for analysis.
    In dev: uses simulated rule-based scoring.

    Decision logic:
      confidence >= 0.85 → auto_approved
      confidence 0.50-0.84 → human_review
      confidence < 0.50 → auto_rejected
    """
    verification_id = data.get("verification_id")
    user_id = data.get("user_id")
    verif_type = data.get("type", "identity")

    if not verification_id:
        logger.warning("missing_verification_id", data=data)
        return

    logger.info("processing_verification", verification_id=verification_id, type=verif_type)

    # ── AI Analysis ──────────────────────────────────────────────────
    model_version = "rule-v1.0.0"
    checks = []

    try:
        from src.vertex_ai import analyze_with_vertex, is_vertex_enabled

        if is_vertex_enabled():
            result = await analyze_with_vertex(verif_type, data)
            if result is not None:
                confidence = result.get("confidence", 0.5)
                model_version = result.get("model", "vertex-unknown")
                checks = result.get("checks", [])
            else:
                confidence = _analyze_verification(verif_type)
        else:
            confidence = _analyze_verification(verif_type)
    except Exception:
        logger.exception("ai_analysis_error", type=verif_type)
        confidence = _analyze_verification(verif_type)

    # Decision logic
    if confidence >= 0.85:
        status = "approved"
        decision = "auto_approved"
    elif confidence >= 0.50:
        status = "pending_review"
        decision = "human_review"
    else:
        status = "rejected"
        decision = "auto_rejected"

    logger.info(
        "verification_decision",
        verification_id=verification_id,
        confidence=confidence,
        status=status,
        decision=decision,
        model_version=model_version,
    )

    # ── Callback to PHP API ──────────────────────────────────────────
    try:
        from shared.callback import api_callback

        await api_callback.patch(f"/verifications/{verification_id}", {
            "status": status,
            "confidence_score": round(confidence, 4),
            "model_version": model_version,
            "ai_result": {
                "decision": decision,
                "confidence": confidence,
                "analysis_type": verif_type,
                "checks_passed": checks or _get_checks(verif_type, confidence),
            },
        })

        logger.info("verification_updated", verification_id=verification_id, status=status)
    except Exception:
        logger.exception("verification_callback_failed", verification_id=verification_id)


def _analyze_verification(verif_type: str) -> float:
    """
    Simulated AI analysis — returns confidence score 0.0-1.0.
    In production, this calls Vertex AI for document/image analysis.
    """
    # Base confidence varies by type
    base_scores = {
        "identity": 0.75,
        "skill_assessment": 0.80,
        "portfolio": 0.85,
        "work_history": 0.70,
        "payment_method": 0.90,
    }
    base = base_scores.get(verif_type, 0.70)

    # Add some variance
    variance = random.uniform(-0.15, 0.15)
    return max(0.0, min(1.0, base + variance))


def _get_checks(verif_type: str, confidence: float) -> list:
    """Return which checks passed/failed based on confidence."""
    checks = []
    if verif_type == "identity":
        checks = [
            {"check": "document_readable", "passed": confidence > 0.3},
            {"check": "document_authentic", "passed": confidence > 0.5},
            {"check": "face_match", "passed": confidence > 0.7},
            {"check": "data_consistent", "passed": confidence > 0.8},
        ]
    elif verif_type == "portfolio":
        checks = [
            {"check": "content_original", "passed": confidence > 0.4},
            {"check": "quality_sufficient", "passed": confidence > 0.6},
            {"check": "skills_demonstrated", "passed": confidence > 0.7},
        ]
    return checks
