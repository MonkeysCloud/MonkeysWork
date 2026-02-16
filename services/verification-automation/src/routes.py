import sys, os
import httpx

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict, Optional
from enum import Enum
import structlog

# ── Inline callback helper (shared/callback.py isn't in Docker image) ──
_API_BASE = os.getenv("INTERNAL_API_URL", "http://monkeyswork-api:8080/api/v1/internal")
_INTERNAL_TOKEN = os.getenv("INTERNAL_API_TOKEN", "dev-internal-token")

async def post_internal(path: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """POST to an internal PHP API endpoint."""
    async with httpx.AsyncClient(
        base_url=_API_BASE,
        headers={"Content-Type": "application/json", "X-Internal-Token": _INTERNAL_TOKEN},
        timeout=10.0,
    ) as client:
        resp = await client.post(path, json=data)
        resp.raise_for_status()
        return resp.json()

logger = structlog.get_logger()

router = APIRouter(prefix="/api/v1/verification")


class VerificationType(str, Enum):
    identity = "identity"
    skill_assessment = "skill_assessment"
    portfolio = "portfolio"
    work_history = "work_history"
    payment_method = "payment_method"


class VerificationRequest(BaseModel):
    user_id: str
    verification_type: VerificationType
    evidence: dict = {}


class VerificationResponse(BaseModel):
    verification_id: str
    user_id: str
    verification_type: str
    status: str
    confidence_score: float
    model_version: str
    requires_human_review: bool


# ── Confidence thresholds ──────────────────────────
AUTO_APPROVE_THRESHOLD = 0.85
HUMAN_REVIEW_THRESHOLD = 0.50
MODEL_VERSION_RULES = "rule-v1.0.0"


async def _analyze_evidence_with_ai(verification_type: str, evidence: dict) -> tuple[float, str, list]:
    """
    Try Vertex AI first (production), fall back to rules.
    Returns (confidence, model_version, checks).
    """
    from src.vertex_ai import analyze_with_vertex, is_vertex_enabled

    if is_vertex_enabled():
        result = await analyze_with_vertex(verification_type, evidence)
        if result is not None:
            return (
                result.get("confidence", 0.5),
                result.get("model", "vertex-unknown"),
                result.get("checks", []),
            )
        logger.warning("vertex_fallback_to_rules", type=verification_type)

    # Fallback: rule-based scoring
    confidence = _analyze_evidence_rules(verification_type, evidence)
    return confidence, MODEL_VERSION_RULES, []


def _analyze_evidence_rules(verification_type: str, evidence: dict) -> float:
    """Rule-based confidence scoring — used as fallback when Vertex AI is unavailable."""
    score = 0.0
    fields = evidence

    if verification_type == "identity":
        if fields.get("government_id_url"):
            score += 0.35
        if fields.get("selfie_url"):
            score += 0.25
        if fields.get("full_name") and fields.get("date_of_birth"):
            score += 0.20
        if fields.get("address"):
            score += 0.10
        if fields.get("id_number"):
            score += 0.10

    elif verification_type == "portfolio":
        urls = fields.get("urls", [])
        if len(urls) >= 3:
            score += 0.50
        elif len(urls) >= 1:
            score += 0.30
        if fields.get("description") and len(fields.get("description", "")) > 50:
            score += 0.30
        if fields.get("client_references"):
            score += 0.20

    elif verification_type == "skill_assessment":
        if fields.get("test_score") is not None:
            test_score = float(fields["test_score"])
            if test_score >= 80:
                score += 0.60
            elif test_score >= 60:
                score += 0.40
            else:
                score += 0.20
        if fields.get("certification_url"):
            score += 0.30
        if fields.get("years_experience") and int(fields["years_experience"]) >= 3:
            score += 0.10

    elif verification_type == "work_history":
        jobs = fields.get("previous_jobs", [])
        if len(jobs) >= 3:
            score += 0.40
        elif len(jobs) >= 1:
            score += 0.20
        if fields.get("linkedin_url"):
            score += 0.30
        if fields.get("references"):
            score += 0.30

    elif verification_type == "payment_method":
        if fields.get("bank_account") or fields.get("stripe_connected"):
            score += 0.60
        if fields.get("tax_id"):
            score += 0.25
        if fields.get("billing_address"):
            score += 0.15

    else:
        score = 0.50

    return min(1.0, max(0.0, score))


def _determine_status(confidence: float) -> tuple[str, bool]:
    """Return (status, requires_human_review)."""
    if confidence >= AUTO_APPROVE_THRESHOLD:
        return "approved", False
    elif confidence >= HUMAN_REVIEW_THRESHOLD:
        return "human_review", True
    else:
        return "rejected", False


@router.post("/submit", response_model=VerificationResponse)
async def submit_verification(request: VerificationRequest):
    """Submit verification request — uses Vertex AI in production, rules in dev."""
    import uuid

    confidence, model_version, ai_checks = await _analyze_evidence_with_ai(
        request.verification_type.value, request.evidence
    )
    status, requires_review = _determine_status(confidence)
    verification_id = str(uuid.uuid4())

    logger.info(
        "verification_analyzed",
        verification_id=verification_id,
        user_id=request.user_id,
        type=request.verification_type.value,
        confidence=confidence,
        status=status,
        model_version=model_version,
    )

    # Callback to PHP API
    try:
        await post_internal("/api/v1/internal/verifications", {
            "user_id": request.user_id,
            "type": request.verification_type.value,
            "status": status,
            "confidence_score": confidence,
            "model_version": model_version,
        })
    except Exception as e:
        logger.warning("verification_callback_failed", error=str(e))

    # Log AI decision
    try:
        await post_internal("/api/v1/internal/decisions", {
            "decision_type": "verification",
            "entity_type": "verification",
            "entity_id": verification_id,
            "model_name": "verification-ai",
            "model_version": model_version,
            "confidence_score": confidence,
            "output": {"status": status, "requires_review": requires_review, "checks": ai_checks},
        })
    except Exception as e:
        logger.warning("audit_callback_failed", error=str(e))

    return VerificationResponse(
        verification_id=verification_id,
        user_id=request.user_id,
        verification_type=request.verification_type.value,
        status=status,
        confidence_score=confidence,
        model_version=model_version,
        requires_human_review=requires_review,
    )


@router.get("/queue")
async def get_review_queue(status: str = "human_review", limit: int = 20):
    """Get pending human review queue for ops team.

    In production this would query the verifications table.
    For now, return an empty queue since we rely on the PHP API
    for persistence via callbacks.
    """
    return {"queue": [], "total": 0, "status_filter": status}


@router.post("/{verification_id}/approve")
async def approve_verification(verification_id: str, reviewer_id: str = "system"):
    """Approve a verification (human reviewer action)."""
    try:
        await post_internal(f"/api/v1/internal/verifications/{verification_id}", {
            "status": "approved",
            "reviewer_id": reviewer_id,
            "confidence_score": 1.0,
            "model_version": MODEL_VERSION_RULES,
        })
    except Exception as e:
        logger.warning("approve_callback_failed", error=str(e))

    return {"status": "approved", "verification_id": verification_id, "approved_by": reviewer_id}


@router.post("/{verification_id}/reject")
async def reject_verification(verification_id: str, reason: str = "", reviewer_id: str = "system"):
    """Reject a verification (human reviewer action)."""
    try:
        await post_internal(f"/api/v1/internal/verifications/{verification_id}", {
            "status": "rejected",
            "reviewer_id": reviewer_id,
            "confidence_score": 0.0,
            "model_version": MODEL_VERSION_RULES,
            "reason": reason,
        })
    except Exception as e:
        logger.warning("reject_callback_failed", error=str(e))

    return {"status": "rejected", "verification_id": verification_id, "reason": reason}
