"""
Fraud detection routes — real scoring logic.

Sync endpoint (POST /check) must respond in < 500ms P99.
"""

import time
import hashlib
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
import structlog

from src.config import settings
from src.audit import log_ai_decision

logger = structlog.get_logger()

router = APIRouter(prefix="/api/v1/fraud")

MODEL_VERSION = f"fraud-{settings.model_version}"


# ── Request / Response models ────────────────────────────────────────

class FraudCheckRequest(BaseModel):
    account_id: str
    entity_type: str = "proposal"
    entity_id: Optional[str] = None
    # Optional context for smarter scoring
    cover_letter: Optional[str] = None
    bid_amount: Optional[float] = None
    job_budget_min: Optional[float] = None
    job_budget_max: Optional[float] = None
    job_skills: List[str] = []
    freelancer_skills: List[str] = []
    account_age_days: Optional[int] = None
    proposals_last_hour: Optional[int] = None
    total_proposals: Optional[int] = None


class RiskFactor(BaseModel):
    factor: str
    contribution: float = Field(ge=0.0, le=1.0)
    description: str


class FraudResponse(BaseModel):
    account_id: str
    entity_type: str
    entity_id: Optional[str]
    fraud_score: float = Field(ge=0.0, le=1.0)
    risk_tier: str  # low | medium | high | critical
    recommended_action: str  # allow | review | block
    top_risk_factors: List[RiskFactor]
    model_version: str
    enforcement_mode: str


# ── Scoring functions ────────────────────────────────────────────────

def _cover_letter_score(cover_letter: Optional[str]) -> tuple[float, Optional[RiskFactor]]:
    """Check cover letter quality. Short/empty = suspicious."""
    if not cover_letter:
        return 0.0, None

    length = len(cover_letter.strip())

    if length < 20:
        return 0.3, RiskFactor(
            factor="short_cover_letter",
            contribution=0.3,
            description=f"Cover letter is very short ({length} chars), likely generic",
        )
    if length < 50:
        return 0.1, RiskFactor(
            factor="brief_cover_letter",
            contribution=0.1,
            description=f"Cover letter is brief ({length} chars)",
        )
    return 0.0, None


def _bid_amount_score(
    bid: Optional[float],
    budget_min: Optional[float],
    budget_max: Optional[float],
) -> tuple[float, Optional[RiskFactor]]:
    """Check if bid is suspiciously low compared to budget."""
    if bid is None or budget_min is None:
        return 0.0, None

    if budget_min > 0 and bid < budget_min * 0.3:
        return 0.25, RiskFactor(
            factor="suspiciously_low_bid",
            contribution=0.25,
            description=f"Bid ${bid:.0f} is <30% of minimum budget ${budget_min:.0f}",
        )
    if budget_min > 0 and bid < budget_min * 0.5:
        return 0.1, RiskFactor(
            factor="low_bid",
            contribution=0.1,
            description=f"Bid ${bid:.0f} is <50% of minimum budget ${budget_min:.0f}",
        )
    return 0.0, None


def _velocity_score(
    proposals_last_hour: Optional[int],
    total_proposals: Optional[int],
    account_age_days: Optional[int],
) -> tuple[float, Optional[RiskFactor]]:
    """Check proposal velocity — bots submit many proposals quickly."""
    score = 0.0
    factor = None

    if proposals_last_hour is not None and proposals_last_hour > 10:
        score = 0.35
        factor = RiskFactor(
            factor="high_proposal_velocity",
            contribution=0.35,
            description=f"{proposals_last_hour} proposals in the last hour (bot-like)",
        )
    elif proposals_last_hour is not None and proposals_last_hour > 5:
        score = 0.15
        factor = RiskFactor(
            factor="elevated_proposal_velocity",
            contribution=0.15,
            description=f"{proposals_last_hour} proposals in the last hour",
        )

    # New account with many proposals
    if (
        account_age_days is not None
        and total_proposals is not None
        and account_age_days < 3
        and total_proposals > 20
    ):
        score = max(score, 0.25)
        factor = RiskFactor(
            factor="new_account_high_activity",
            contribution=0.25,
            description=f"{total_proposals} proposals in {account_age_days} days",
        )

    return score, factor


def _skill_match_score(
    job_skills: List[str], freelancer_skills: List[str]
) -> tuple[float, Optional[RiskFactor]]:
    """Check if freelancer has any skills matching the job."""
    if not job_skills or not freelancer_skills:
        return 0.0, None

    job_set = {s.lower() for s in job_skills}
    fl_set = {s.lower() for s in freelancer_skills}
    overlap = job_set & fl_set

    if len(overlap) == 0 and len(job_skills) >= 2:
        return 0.2, RiskFactor(
            factor="no_skill_match",
            contribution=0.2,
            description=f"No skill overlap: job needs {job_skills}, freelancer has {freelancer_skills}",
        )
    return 0.0, None


def compute_fraud_score(request: FraudCheckRequest) -> FraudResponse:
    """
    Rule-based fraud scoring (Phase 1).
    Scores from multiple signals are combined with max-aggregation.
    """
    start = time.monotonic()
    risk_factors: List[RiskFactor] = []
    score = 0.0

    # 1. Cover letter analysis
    cl_score, cl_factor = _cover_letter_score(request.cover_letter)
    score += cl_score
    if cl_factor:
        risk_factors.append(cl_factor)

    # 2. Bid amount analysis
    bid_score, bid_factor = _bid_amount_score(
        request.bid_amount, request.job_budget_min, request.job_budget_max
    )
    score += bid_score
    if bid_factor:
        risk_factors.append(bid_factor)

    # 3. Velocity analysis
    vel_score, vel_factor = _velocity_score(
        request.proposals_last_hour,
        request.total_proposals,
        request.account_age_days,
    )
    score += vel_score
    if vel_factor:
        risk_factors.append(vel_factor)

    # 4. Skill match analysis
    sk_score, sk_factor = _skill_match_score(
        request.job_skills, request.freelancer_skills
    )
    score += sk_score
    if sk_factor:
        risk_factors.append(sk_factor)

    # Clamp to [0, 1]
    score = min(score, 1.0)

    # Determine tier and action
    if score >= 0.8:
        risk_tier = "critical"
        action = "block"
    elif score >= 0.5:
        risk_tier = "high"
        action = "review"
    elif score >= 0.3:
        risk_tier = "medium"
        action = "allow"
    else:
        risk_tier = "low"
        action = "allow"

    # Sort factors by contribution (highest first)
    risk_factors.sort(key=lambda f: f.contribution, reverse=True)

    enforcement = settings.fallback_mode  # shadow | soft_block | enforce

    elapsed_ms = int((time.monotonic() - start) * 1000)

    # Audit log
    log_ai_decision(
        decision_type="fraud_check",
        entity_type=request.entity_type,
        entity_id=request.entity_id or request.account_id,
        model_name="fraud-rule-engine",
        model_version=MODEL_VERSION,
        output={
            "fraud_score": score,
            "risk_tier": risk_tier,
            "recommended_action": action,
            "factors_count": len(risk_factors),
        },
        confidence_score=1.0 - score,  # confidence is inverse of fraud probability
        latency_ms=elapsed_ms,
    )

    return FraudResponse(
        account_id=request.account_id,
        entity_type=request.entity_type,
        entity_id=request.entity_id,
        fraud_score=round(score, 4),
        risk_tier=risk_tier,
        recommended_action=action,
        top_risk_factors=risk_factors[:5],
        model_version=MODEL_VERSION,
        enforcement_mode=enforcement,
    )


# ── Endpoint ─────────────────────────────────────────────────────────

@router.post("/check", response_model=FraudResponse)
async def check_fraud(request: FraudCheckRequest):
    """
    Synchronous fraud check — called by the PHP API during proposal submission.
    Must respond in < 500ms P99.
    """
    return compute_fraud_score(request)
