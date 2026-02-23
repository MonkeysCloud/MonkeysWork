"""
Proposal Generation routes — AI-powered proposal drafting.
"""

import time
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import structlog

from src.config import settings
from src.audit import log_ai_decision

logger = structlog.get_logger()

router = APIRouter(prefix="/api/v1/proposal")

MODEL_VERSION = f"proposal-gen-{settings.model_version}"


# ── Request / Response models ────────────────────────────────────────

class ProposalGenRequest(BaseModel):
    job_title: str
    job_description: str
    category: str = ""
    required_skills: List[str] = []
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    experience_level: str = ""
    freelancer_name: str = ""
    freelancer_skills: List[str] = []
    freelancer_bio: str = ""
    freelancer_experience_years: int = 0
    freelancer_hourly_rate: Optional[float] = None
    freelancer_certifications: List[dict] = []
    freelancer_portfolio: List[str] = []
    freelancer_education: List[dict] = []
    freelancer_total_jobs: int = 0
    freelancer_avg_rating: float = 0.0
    freelancer_success_rate: float = 0.0
    highlights: str = ""
    tone: str = "professional"  # professional | friendly | technical


class ProposalMilestone(BaseModel):
    title: str
    description: str
    amount: float


class ProposalGenResponse(BaseModel):
    cover_letter: str
    suggested_bid: float
    suggested_milestones: List[ProposalMilestone]
    suggested_duration_weeks: int
    key_talking_points: List[str]
    model_version: str
    latency_ms: int


# ── Dev fallback ─────────────────────────────────────────────────────

def _dev_generate(req: ProposalGenRequest) -> ProposalGenResponse:
    """Rule-based proposal generation for dev mode (no Gemini needed)."""
    start = time.monotonic()

    name = req.freelancer_name or "there"
    job = req.job_title or "this project"

    # Build matching skills
    matching = set(s.lower() for s in req.freelancer_skills) & set(s.lower() for s in req.required_skills)
    match_str = ", ".join(matching) if matching else ", ".join(req.required_skills[:3]) if req.required_skills else "the required technologies"

    # Experience context
    exp_str = f"{req.freelancer_experience_years}+ years of experience" if req.freelancer_experience_years > 0 else "relevant experience"
    stats_str = ""
    if req.freelancer_total_jobs > 0:
        stats_str = f" With {req.freelancer_total_jobs} completed projects"
        if req.freelancer_avg_rating > 0:
            stats_str += f" and a {req.freelancer_avg_rating:.1f}/5 average rating"
        if req.freelancer_success_rate > 0:
            stats_str += f" ({req.freelancer_success_rate:.0f}% success rate)"
        stats_str += ", I have a proven track record of delivering quality work."

    cert_str = ""
    if req.freelancer_certifications:
        cert_names = [c.get('name', c.get('title', '')) for c in req.freelancer_certifications if isinstance(c, dict)]
        cert_names = [n for n in cert_names if n]
        if cert_names:
            cert_str = f" I hold certifications in {', '.join(cert_names[:3])}."

    # Tone-specific openings
    tone_map = {
        "professional": f"Dear Hiring Manager,\n\nI am writing to express my strong interest in your project \"{job}\". With {exp_str} in {match_str}, I am confident that my skills make me an excellent fit for this role.",
        "friendly": f"Hi there! 👋\n\nI just came across your project \"{job}\" and I'm really excited about it. With {exp_str}, this is right in my wheelhouse and I'd love to help bring your vision to life!",
        "technical": f"Hello,\n\nI've carefully analyzed the technical requirements for \"{job}\". With {exp_str} in {match_str}, I have a clear approach for delivering a high-quality solution.",
    }

    # Tone-specific approaches
    approach_map = {
        "professional": "My approach would follow industry best practices: starting with a thorough requirements analysis, followed by iterative development with regular check-ins to ensure alignment with your vision. I prioritize clean, maintainable code and comprehensive documentation.",
        "friendly": "Here's how I'd tackle this: First, we'd have a quick kickoff chat to make sure I understand your goals perfectly. Then I'd dive into development, sharing progress regularly so you're never in the dark. I'm big on communication and keeping things transparent!",
        "technical": f"My technical approach: 1) Architecture design with focus on scalability and maintainability. 2) Implementation using {match_str} with proper testing coverage. 3) Code reviews and documentation. 4) Performance optimization and deployment.",
    }

    closing_map = {
        "professional": "I look forward to discussing this opportunity in more detail. Please feel free to review my portfolio and previous work. I am available to start immediately and can dedicate focused time to ensure timely delivery.",
        "friendly": "I'd love to jump on a quick call to discuss the details — I'm sure we can make something amazing together! Let me know what works for you. 🚀",
        "technical": "I'm ready to begin immediately with a detailed technical planning phase. Happy to discuss architecture decisions and implementation details at your convenience.",
    }

    tone = req.tone if req.tone in tone_map else "professional"

    cover_letter = f"""{tone_map[tone]}

With {exp_str} in {match_str}, I have successfully delivered similar projects that required attention to detail, performance optimization, and user-centric design.{stats_str}{cert_str}

{approach_map[tone]}

{closing_map[tone]}

Best regards,
{req.freelancer_name or "Your Freelancer"}"""

    # Calculate suggested bid
    if req.budget_min and req.budget_max:
        suggested_bid = round((req.budget_min + req.budget_max) / 2, 2)
    elif req.budget_max:
        suggested_bid = round(req.budget_max * 0.75, 2)
    elif req.budget_min:
        suggested_bid = round(req.budget_min * 1.2, 2)
    else:
        suggested_bid = 1500.0

    # Generate milestones
    milestones = [
        ProposalMilestone(
            title="Discovery & Planning",
            description="Requirements review, technical planning, and architecture design",
            amount=round(suggested_bid * 0.15, 2),
        ),
        ProposalMilestone(
            title="Core Development",
            description="Build the primary features and functionality as specified",
            amount=round(suggested_bid * 0.40, 2),
        ),
        ProposalMilestone(
            title="Integration & Polish",
            description="API integration, UI polish, responsiveness, and edge cases",
            amount=round(suggested_bid * 0.25, 2),
        ),
        ProposalMilestone(
            title="Testing & Delivery",
            description="Comprehensive testing, bug fixes, documentation, and final delivery",
            amount=round(suggested_bid * 0.20, 2),
        ),
    ]

    # Duration estimate based on budget
    if suggested_bid < 1000:
        weeks = 2
    elif suggested_bid < 5000:
        weeks = 4
    elif suggested_bid < 15000:
        weeks = 8
    else:
        weeks = 13

    talking_points = [
        f"Strong experience with {match_str}",
        "Proven track record of on-time delivery",
        "Clear communication and regular progress updates",
        "Attention to clean code, testing, and documentation",
        "Available to start immediately",
    ]

    elapsed = int((time.monotonic() - start) * 1000)

    return ProposalGenResponse(
        cover_letter=cover_letter,
        suggested_bid=suggested_bid,
        suggested_milestones=milestones,
        suggested_duration_weeks=weeks,
        key_talking_points=talking_points,
        model_version=MODEL_VERSION,
        latency_ms=elapsed,
    )


# ── Endpoint ─────────────────────────────────────────────────────────

@router.post("/generate", response_model=ProposalGenResponse)
async def generate_proposal(request: ProposalGenRequest):
    """Generate a proposal draft with AI assistance."""

    from src.vertex_ai import generate_proposal_with_vertex, is_vertex_enabled
    if is_vertex_enabled():
        result = await generate_proposal_with_vertex(
            job_title=request.job_title,
            job_description=request.job_description,
            category=request.category,
            required_skills=request.required_skills,
            budget_min=request.budget_min,
            budget_max=request.budget_max,
            experience_level=request.experience_level,
            freelancer_name=request.freelancer_name,
            freelancer_skills=request.freelancer_skills,
            freelancer_bio=request.freelancer_bio,
            freelancer_experience_years=request.freelancer_experience_years,
            freelancer_hourly_rate=request.freelancer_hourly_rate,
            freelancer_certifications=request.freelancer_certifications,
            freelancer_portfolio=request.freelancer_portfolio,
            freelancer_education=request.freelancer_education,
            freelancer_total_jobs=request.freelancer_total_jobs,
            freelancer_avg_rating=request.freelancer_avg_rating,
            freelancer_success_rate=request.freelancer_success_rate,
            highlights=request.highlights,
            tone=request.tone,
        )
        if result:
            log_ai_decision(
                decision_type="proposal_generate",
                entity_type="proposal",
                entity_id="draft",
                model_name="vertex-gemini",
                model_version=MODEL_VERSION,
                output={"source": "vertex"},
                confidence_score=0.9,
                latency_ms=result.get("latency_ms", 0),
            )
            return result

    # Fallback to rule-based
    return _dev_generate(request)
