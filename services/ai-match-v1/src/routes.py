from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/v1/match")


class MatchRequest(BaseModel):
    job_id: str
    limit: int = 20


class MatchResult(BaseModel):
    freelancer_id: str
    match_score: float
    score_breakdown: dict
    explanation: str


class MatchResponse(BaseModel):
    job_id: str
    results: List[MatchResult]
    model_version: str
    ab_group: str
    latency_ms: int


@router.post("/rank", response_model=MatchResponse)
async def rank_candidates(request: MatchRequest):
    # TODO: Embedding retrieval + ranking model
    # TODO: A/B test logic
    # TODO: Log audit decision
    return MatchResponse(
        job_id=request.job_id,
        results=[],
        model_version="v0.0.0-placeholder",
        ab_group="control",
        latency_ms=0,
    )
