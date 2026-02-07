from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from enum import Enum

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


@router.post("/submit", response_model=VerificationResponse)
async def submit_verification(request: VerificationRequest):
    """Submit verification request — auto-approve if high confidence, else queue for human review."""
    # TODO: Run verification model
    # TODO: If confidence < HUMAN_REVIEW_THRESHOLD → queue for human
    # TODO: Publish verification_status_changed event
    # TODO: Log audit decision
    return VerificationResponse(
        verification_id="placeholder",
        user_id=request.user_id,
        verification_type=request.verification_type.value,
        status="pending",
        confidence_score=0.0,
        model_version="v0.0.0-placeholder",
        requires_human_review=True,
    )


@router.get("/queue")
async def get_review_queue(status: str = "human_review", limit: int = 20):
    """Get pending human review queue for ops team."""
    # TODO: Query verifications table WHERE status = 'human_review'
    return {"queue": [], "total": 0}


@router.post("/{verification_id}/approve")
async def approve_verification(verification_id: str, reviewer_id: str = "system"):
    """Approve a verification (human reviewer action)."""
    # TODO: Update status, publish event, log audit
    return {"status": "approved", "verification_id": verification_id}


@router.post("/{verification_id}/reject")
async def reject_verification(verification_id: str, reason: str = "", reviewer_id: str = "system"):
    """Reject a verification (human reviewer action)."""
    # TODO: Update status, publish event, log audit
    return {"status": "rejected", "verification_id": verification_id, "reason": reason}
