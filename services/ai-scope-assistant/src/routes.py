from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/v1/scope")


class ScopeRequest(BaseModel):
    job_id: str
    title: str
    description: str
    category: str
    skills_required: List[str] = []
    budget_type: str = "fixed"
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None


class MilestoneOutput(BaseModel):
    title: str
    description: str
    estimated_hours: float
    estimated_cost: float
    tasks: List[str]


class ScopeResponse(BaseModel):
    job_id: str
    milestones: List[MilestoneOutput]
    total_estimated_hours: float
    confidence_score: float
    complexity_tier: str
    model_version: str


@router.post("/analyze", response_model=ScopeResponse)
async def analyze_scope(request: ScopeRequest):
    # TODO: Call Vertex AI endpoint / Gemini Pro
    # TODO: Log audit decision
    # TODO: Check feature flag, fallback if disabled
    return ScopeResponse(
        job_id=request.job_id,
        milestones=[],
        total_estimated_hours=0,
        confidence_score=0,
        complexity_tier="unknown",
        model_version="v0.0.0-placeholder",
    )
