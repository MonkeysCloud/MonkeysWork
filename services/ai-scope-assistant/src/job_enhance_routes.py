"""
Job Enhancement routes — AI-powered job post improvement.
"""

import time
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import structlog

from src.config import settings
from src.audit import log_ai_decision

logger = structlog.get_logger()

router = APIRouter(prefix="/api/v1/job")

MODEL_VERSION = f"job-enhance-{settings.model_version}"


# ── Request / Response models ────────────────────────────────────────

class JobEnhanceRequest(BaseModel):
    title: str
    description: str
    category: str = ""
    skills: List[str] = []
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None


class SuggestedMilestone(BaseModel):
    title: str
    description: str
    estimated_amount: float


class BudgetRange(BaseModel):
    min: float
    max: float


class JobEnhanceResponse(BaseModel):
    improved_title: str
    improved_description: str
    suggested_skills: List[str]
    suggested_milestones: List[SuggestedMilestone]
    tips: List[str]
    estimated_budget_range: Optional[BudgetRange] = None
    model_version: str
    latency_ms: int


# ── Dev fallback ─────────────────────────────────────────────────────

def _dev_enhance(req: JobEnhanceRequest) -> JobEnhanceResponse:
    """Rule-based enhancement for dev mode (no Gemini needed)."""
    start = time.monotonic()

    # Improve title
    improved_title = req.title
    if len(req.title) < 40:
        improved_title = f"{req.title} — Expert Needed"

    # Enhance description
    paragraphs = [req.description] if req.description else []
    if len(req.description) < 200:
        paragraphs.append(
            "\n\nIdeal Candidate:\n"
            "We're looking for someone with strong experience in the required skills, "
            "excellent communication, and a track record of delivering quality work on time."
        )
        paragraphs.append(
            "\n\nDeliverables:\n"
            "- Clean, well-documented code/assets\n"
            "- Regular progress updates\n"
            "- Final deliverable with documentation"
        )

    # Suggest additional skills
    suggested_skills = []
    if "react" in " ".join(req.skills).lower() or "frontend" in req.category.lower():
        suggested_skills = ["TypeScript", "CSS3", "Responsive Design", "REST API", "Git"]
    elif "python" in " ".join(req.skills).lower() or "backend" in req.category.lower():
        suggested_skills = ["PostgreSQL", "Docker", "REST API", "Unit Testing", "Git"]
    elif "design" in req.category.lower():
        suggested_skills = ["Figma", "Adobe XD", "Prototyping", "UI/UX", "Design Systems"]
    else:
        suggested_skills = ["Communication", "Problem Solving", "Documentation", "Git", "Agile"]

    # Filter out skills already in the list
    existing_lower = {s.lower() for s in req.skills}
    suggested_skills = [s for s in suggested_skills if s.lower() not in existing_lower][:5]

    # Milestones
    budget_mid = 0
    if req.budget_min and req.budget_max:
        budget_mid = (req.budget_min + req.budget_max) / 2
    elif req.budget_max:
        budget_mid = req.budget_max * 0.7

    milestones = [
        SuggestedMilestone(
            title="Planning & Setup",
            description="Requirements review, environment setup, and initial architecture",
            estimated_amount=round(budget_mid * 0.15, 2),
        ),
        SuggestedMilestone(
            title="Core Development",
            description="Implement primary features and functionality",
            estimated_amount=round(budget_mid * 0.45, 2),
        ),
        SuggestedMilestone(
            title="Testing & Refinement",
            description="QA testing, bug fixes, and performance optimization",
            estimated_amount=round(budget_mid * 0.25, 2),
        ),
        SuggestedMilestone(
            title="Final Delivery",
            description="Documentation, deployment, and handoff",
            estimated_amount=round(budget_mid * 0.15, 2),
        ),
    ]

    tips = [
        "Add specific deliverables to help freelancers understand the scope",
        "Include examples or references of similar work you like",
        "Mention your preferred communication style and availability",
        "Be clear about timeline expectations and deadlines",
        "Consider adding a budget range — posts with budgets get 3x more proposals",
    ]

    elapsed = int((time.monotonic() - start) * 1000)

    return JobEnhanceResponse(
        improved_title=improved_title,
        improved_description="".join(paragraphs),
        suggested_skills=suggested_skills,
        suggested_milestones=milestones,
        tips=tips,
        estimated_budget_range=BudgetRange(
            min=req.budget_min or 500,
            max=req.budget_max or 5000,
        ) if budget_mid > 0 else None,
        model_version=MODEL_VERSION,
        latency_ms=elapsed,
    )


# ── Endpoint ─────────────────────────────────────────────────────────

@router.post("/enhance", response_model=JobEnhanceResponse)
async def enhance_job(request: JobEnhanceRequest):
    """Enhance a job posting with AI suggestions."""

    # Try Vertex AI in production
    from src.vertex_ai import enhance_job_with_vertex, is_vertex_enabled
    if is_vertex_enabled():
        result = await enhance_job_with_vertex(
            title=request.title,
            description=request.description,
            category=request.category,
            skills=request.skills,
            budget_min=request.budget_min,
            budget_max=request.budget_max,
        )
        if result:
            log_ai_decision(
                decision_type="job_enhance",
                entity_type="job",
                entity_id="draft",
                model_name="vertex-gemini",
                model_version=MODEL_VERSION,
                output={"source": "vertex"},
                confidence_score=0.9,
                latency_ms=result.get("latency_ms", 0),
            )
            return result

    # Fallback to rule-based
    return _dev_enhance(request)
