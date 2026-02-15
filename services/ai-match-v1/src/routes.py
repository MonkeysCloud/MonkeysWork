"""
Match ranking routes — real scoring logic.

Ranks freelancers for a given job based on:
  - Skill overlap (weighted highest)
  - Rate compatibility
  - Experience level
  - Profile completeness
  - Verification status
"""

import time
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
import structlog

from src.config import settings
from src.audit import log_ai_decision

logger = structlog.get_logger()

router = APIRouter(prefix="/api/v1/match")

MODEL_VERSION = f"match-{settings.model_version}"


# ── Request / Response models ────────────────────────────────────────

class FreelancerCandidate(BaseModel):
    freelancer_id: str
    skills: List[str] = []
    hourly_rate: Optional[float] = None
    experience_years: Optional[int] = None
    profile_completeness: Optional[float] = None
    verification_level: Optional[str] = None
    avg_rating: Optional[float] = None
    total_jobs_completed: Optional[int] = None


class MatchRequest(BaseModel):
    job_id: str
    job_skills: List[str] = []
    job_budget_min: Optional[float] = None
    job_budget_max: Optional[float] = None
    experience_level: Optional[str] = None  # entry | mid | senior | expert
    candidates: List[FreelancerCandidate] = []
    limit: int = 20


class ScoreBreakdown(BaseModel):
    skill_match: float = 0.0
    rate_fit: float = 0.0
    experience_fit: float = 0.0
    profile_quality: float = 0.0
    reputation: float = 0.0


class MatchResult(BaseModel):
    freelancer_id: str
    score: float = Field(ge=0.0, le=1.0)
    breakdown: ScoreBreakdown
    explanation: str


class MatchResponse(BaseModel):
    job_id: str
    results: List[MatchResult]
    model_version: str
    total_candidates: int
    latency_ms: int


# ── Scoring functions ────────────────────────────────────────────────

def _skill_match_score(job_skills: List[str], candidate_skills: List[str]) -> float:
    """Jaccard-like skill overlap score."""
    if not job_skills or not candidate_skills:
        return 0.0
    job_set = {s.lower() for s in job_skills}
    cand_set = {s.lower() for s in candidate_skills}
    overlap = job_set & cand_set
    union = job_set | cand_set
    return len(overlap) / len(union) if union else 0.0


def _rate_fit_score(
    rate: Optional[float], budget_min: Optional[float], budget_max: Optional[float]
) -> float:
    """How well does the freelancer's rate fit the budget?"""
    if rate is None or (budget_min is None and budget_max is None):
        return 0.5  # neutral if we don't know

    if budget_min and budget_max:
        if budget_min <= rate <= budget_max:
            return 1.0  # perfect fit
        elif rate < budget_min:
            return max(0.3, 1.0 - (budget_min - rate) / budget_min)
        else:
            return max(0.1, 1.0 - (rate - budget_max) / budget_max)
    elif budget_max:
        return 1.0 if rate <= budget_max else max(0.2, 1.0 - (rate - budget_max) / budget_max)
    elif budget_min:
        return 1.0 if rate >= budget_min else max(0.3, rate / budget_min)

    return 0.5


def _experience_fit_score(years: Optional[int], level: Optional[str]) -> float:
    """Match experience years to required level."""
    if years is None or level is None:
        return 0.5

    level_map = {"entry": (0, 2), "mid": (2, 5), "senior": (5, 10), "expert": (10, 99)}
    min_y, max_y = level_map.get(level, (0, 99))

    if min_y <= years <= max_y:
        return 1.0
    elif years < min_y:
        return max(0.2, years / max(min_y, 1))
    else:
        return 0.8  # overqualified is still decent


def _profile_quality_score(
    completeness: Optional[float], verification: Optional[str]
) -> float:
    """Profile completeness + verification bonus."""
    score = (completeness or 0.0) / 100.0
    if verification == "verified":
        score = min(1.0, score + 0.2)
    return score


def _reputation_score(rating: Optional[float], jobs: Optional[int]) -> float:
    """Rating + job volume score."""
    if rating is None:
        return 0.3
    base = rating / 5.0
    # Bonus for volume
    if jobs and jobs > 10:
        base = min(1.0, base + 0.1)
    return base


def rank_candidates(request: MatchRequest) -> MatchResponse:
    """Rank freelancer candidates for a job."""
    start = time.monotonic()
    results = []

    # Weights for score components
    weights = {
        "skill_match": 0.35,
        "rate_fit": 0.20,
        "experience_fit": 0.15,
        "profile_quality": 0.15,
        "reputation": 0.15,
    }

    for candidate in request.candidates:
        breakdown = ScoreBreakdown(
            skill_match=_skill_match_score(request.job_skills, candidate.skills),
            rate_fit=_rate_fit_score(
                candidate.hourly_rate, request.job_budget_min, request.job_budget_max
            ),
            experience_fit=_experience_fit_score(
                candidate.experience_years, request.experience_level
            ),
            profile_quality=_profile_quality_score(
                candidate.profile_completeness, candidate.verification_level
            ),
            reputation=_reputation_score(
                candidate.avg_rating, candidate.total_jobs_completed
            ),
        )

        # Weighted sum
        total = sum(
            getattr(breakdown, k) * w for k, w in weights.items()
        )
        total = round(min(1.0, total), 4)

        # Generate explanation
        top_signal = max(weights.keys(), key=lambda k: getattr(breakdown, k) * weights[k])
        explanation = _explain(candidate, breakdown, top_signal, total)

        results.append(MatchResult(
            freelancer_id=candidate.freelancer_id,
            score=total,
            breakdown=breakdown,
            explanation=explanation,
        ))

    # Sort by score descending, take top N
    results.sort(key=lambda r: r.score, reverse=True)
    results = results[: request.limit]

    elapsed_ms = int((time.monotonic() - start) * 1000)

    # Audit
    log_ai_decision(
        decision_type="match_rank",
        entity_type="job",
        entity_id=request.job_id,
        model_name="match-rule-engine",
        model_version=MODEL_VERSION,
        output={"results_count": len(results), "top_score": results[0].score if results else 0},
        confidence_score=results[0].score if results else 0,
        latency_ms=elapsed_ms,
    )

    return MatchResponse(
        job_id=request.job_id,
        results=results,
        model_version=MODEL_VERSION,
        total_candidates=len(request.candidates),
        latency_ms=elapsed_ms,
    )


def _explain(candidate, breakdown, top_signal: str, total: float) -> str:
    """Generate human-readable match explanation."""
    explanations = {
        "skill_match": f"Strong skill alignment ({breakdown.skill_match:.0%} overlap)",
        "rate_fit": f"Rate fits budget well ({breakdown.rate_fit:.0%})",
        "experience_fit": f"Experience level matches ({breakdown.experience_fit:.0%})",
        "profile_quality": f"Well-maintained profile ({breakdown.profile_quality:.0%})",
        "reputation": f"Good reputation ({breakdown.reputation:.0%})",
    }
    return f"Score {total:.2f}: {explanations.get(top_signal, 'Good overall fit')}"


# ── Endpoint ─────────────────────────────────────────────────────────

@router.post("/rank", response_model=MatchResponse)
async def rank(request: MatchRequest):
    """Rank freelancer candidates for a job."""
    return rank_candidates(request)
