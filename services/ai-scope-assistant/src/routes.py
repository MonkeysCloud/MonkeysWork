"""
Scope analysis routes — real milestone decomposition logic.

Analyzes a job description and decomposes it into:
  - Structured milestones with tasks
  - Hour/cost estimates per milestone
  - Complexity tier (simple | moderate | complex | enterprise)
"""

import time
import re
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
import structlog

from src.config import settings
from src.audit import log_ai_decision

logger = structlog.get_logger()

router = APIRouter(prefix="/api/v1/scope")

MODEL_VERSION = f"scope-{settings.model_version}"


# ── Request / Response models ────────────────────────────────────────

class ScopeRequest(BaseModel):
    job_id: str
    title: str
    description: str
    category: str = ""
    skills_required: List[str] = []
    budget_type: str = "fixed"
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None


class TaskItem(BaseModel):
    title: str
    estimated_hours: float


class MilestoneOutput(BaseModel):
    title: str
    description: str
    estimated_hours: float
    estimated_cost: float
    tasks: List[TaskItem]


class ScopeResponse(BaseModel):
    job_id: str
    milestones: List[MilestoneOutput]
    total_estimated_hours: float
    total_estimated_cost: float
    confidence_score: float = Field(ge=0.0, le=1.0)
    complexity_tier: str  # simple | moderate | complex | enterprise
    model_version: str
    latency_ms: int


# ── Analysis logic ───────────────────────────────────────────────────

# Complexity indicators in description
COMPLEXITY_KEYWORDS = {
    "simple": ["landing page", "static", "simple", "basic", "single page", "template"],
    "moderate": ["dashboard", "crud", "api", "database", "authentication", "responsive"],
    "complex": ["real-time", "websocket", "microservice", "machine learning", "ai",
                "payment", "integration", "multi-tenant", "scalable"],
    "enterprise": ["enterprise", "compliance", "hipaa", "gdpr", "distributed",
                   "high-availability", "kubernetes", "blockchain"],
}

# Base milestone templates by complexity
MILESTONE_TEMPLATES = {
    "simple": [
        ("Setup & Design", "Project setup, design system, and basic structure", [
            ("Environment setup", 2), ("Design mockups", 4), ("Asset preparation", 2),
        ]),
        ("Implementation", "Core feature development", [
            ("Core implementation", 8), ("Styling & polish", 4),
        ]),
        ("Testing & Delivery", "QA and handoff", [
            ("Testing", 3), ("Bug fixes", 2), ("Documentation", 1),
        ]),
    ],
    "moderate": [
        ("Planning & Architecture", "Requirements analysis and system design", [
            ("Requirements analysis", 4), ("Architecture design", 6), ("Database schema", 4),
        ]),
        ("Backend Development", "API and business logic implementation", [
            ("API endpoints", 12), ("Business logic", 10), ("Authentication", 6),
        ]),
        ("Frontend Development", "UI components and integration", [
            ("UI components", 12), ("API integration", 8), ("Responsive design", 4),
        ]),
        ("Testing & Deployment", "QA, deployment, and documentation", [
            ("Unit tests", 6), ("Integration tests", 4), ("Deployment setup", 4),
            ("Documentation", 3),
        ]),
    ],
    "complex": [
        ("Discovery & Planning", "Deep-dive into requirements and architecture", [
            ("Requirements workshop", 8), ("Architecture design", 10),
            ("Technical spike/POC", 8), ("Database & API design", 6),
        ]),
        ("Core Infrastructure", "Foundation systems and services", [
            ("Core services setup", 12), ("Database implementation", 10),
            ("Authentication & authorization", 8), ("CI/CD pipeline", 6),
        ]),
        ("Feature Development - Phase 1", "Primary feature set", [
            ("Primary features", 20), ("API development", 12),
            ("Frontend components", 16),
        ]),
        ("Feature Development - Phase 2", "Secondary features and integrations", [
            ("Secondary features", 16), ("Third-party integrations", 12),
            ("Real-time features", 10),
        ]),
        ("Testing & Optimization", "Comprehensive testing and performance", [
            ("Unit & integration tests", 10), ("E2E testing", 8),
            ("Performance optimization", 6), ("Security audit", 4),
        ]),
        ("Deployment & Handoff", "Production deployment and documentation", [
            ("Production deployment", 6), ("Monitoring setup", 4),
            ("Documentation", 6), ("Knowledge transfer", 4),
        ]),
    ],
    "enterprise": [
        ("Discovery & Assessment", "Stakeholder interviews and requirements", [
            ("Stakeholder workshops", 12), ("Requirements documentation", 10),
            ("Compliance assessment", 8), ("Risk analysis", 6),
        ]),
        ("Architecture & Design", "System architecture and detailed design", [
            ("System architecture", 16), ("Security architecture", 10),
            ("Data architecture", 10), ("API contracts", 8),
            ("Infrastructure planning", 8),
        ]),
        ("Phase 1 - Foundation", "Core infrastructure and services", [
            ("Core services", 24), ("Database layer", 16),
            ("Authentication/IAM", 12), ("CI/CD & DevOps", 10),
        ]),
        ("Phase 2 - Features", "Primary feature development", [
            ("Feature set A", 24), ("Feature set B", 20),
            ("Integration layer", 16), ("Admin panel", 12),
        ]),
        ("Phase 3 - Advanced", "Advanced features and integrations", [
            ("Advanced features", 20), ("Third-party integrations", 16),
            ("Analytics & reporting", 12), ("Notification system", 8),
        ]),
        ("Testing & Compliance", "Comprehensive QA and compliance", [
            ("Automated testing", 16), ("Security testing", 10),
            ("Compliance validation", 8), ("Performance testing", 8),
            ("UAT", 10),
        ]),
        ("Deployment & Operations", "Production rollout and support", [
            ("Staged deployment", 10), ("Monitoring & alerting", 8),
            ("Documentation", 10), ("Training & handoff", 8),
        ]),
    ],
}


def _detect_complexity(description: str, skills: List[str], budget_max: Optional[float]) -> str:
    """Detect job complexity from description, skills, and budget."""
    desc_lower = description.lower()
    scores = {"simple": 0, "moderate": 0, "complex": 0, "enterprise": 0}

    for tier, keywords in COMPLEXITY_KEYWORDS.items():
        for kw in keywords:
            if kw in desc_lower:
                scores[tier] += 1

    # Skill count as complexity indicator
    if len(skills) >= 8:
        scores["complex"] += 2
    elif len(skills) >= 5:
        scores["moderate"] += 1

    # Budget as complexity indicator
    if budget_max:
        if budget_max >= 50000:
            scores["enterprise"] += 3
        elif budget_max >= 15000:
            scores["complex"] += 2
        elif budget_max >= 5000:
            scores["moderate"] += 1

    # Description length
    word_count = len(description.split())
    if word_count > 500:
        scores["complex"] += 1
    elif word_count > 200:
        scores["moderate"] += 1

    return max(scores, key=scores.get)  # type: ignore


def analyze_scope(request: ScopeRequest) -> ScopeResponse:
    """Analyze a job and decompose it into milestones."""
    start = time.monotonic()

    complexity = _detect_complexity(
        request.description, request.skills_required, request.budget_max
    )

    template = MILESTONE_TEMPLATES.get(complexity, MILESTONE_TEMPLATES["moderate"])

    # Estimate hourly rate from budget
    total_template_hours = sum(
        sum(t[1] for t in m[2]) for m in template
    )
    hourly_rate = 50.0  # default
    if request.budget_max and total_template_hours > 0:
        hourly_rate = request.budget_max / total_template_hours

    milestones = []
    total_hours = 0.0
    total_cost = 0.0

    for title, description, tasks in template:
        milestone_hours = sum(t[1] for t in tasks)
        milestone_cost = milestone_hours * hourly_rate
        total_hours += milestone_hours
        total_cost += milestone_cost

        milestones.append(MilestoneOutput(
            title=title,
            description=description,
            estimated_hours=milestone_hours,
            estimated_cost=round(milestone_cost, 2),
            tasks=[
                TaskItem(title=t[0], estimated_hours=t[1]) for t in tasks
            ],
        ))

    # Confidence based on how much info we have
    confidence = 0.5
    if request.description and len(request.description) > 100:
        confidence += 0.15
    if request.skills_required:
        confidence += 0.10
    if request.budget_max:
        confidence += 0.10
    if request.category:
        confidence += 0.05
    confidence = min(1.0, confidence)

    elapsed_ms = int((time.monotonic() - start) * 1000)

    # Audit
    log_ai_decision(
        decision_type="scope_analysis",
        entity_type="job",
        entity_id=request.job_id,
        model_name="scope-rule-engine",
        model_version=MODEL_VERSION,
        output={
            "complexity": complexity,
            "milestones_count": len(milestones),
            "total_hours": total_hours,
        },
        confidence_score=confidence,
        latency_ms=elapsed_ms,
    )

    return ScopeResponse(
        job_id=request.job_id,
        milestones=milestones,
        total_estimated_hours=total_hours,
        total_estimated_cost=round(total_cost, 2),
        confidence_score=round(confidence, 4),
        complexity_tier=complexity,
        model_version=MODEL_VERSION,
        latency_ms=elapsed_ms,
    )


# ── Endpoint ─────────────────────────────────────────────────────────

@router.post("/analyze", response_model=ScopeResponse)
async def analyze(request: ScopeRequest):
    """Analyze job scope and decompose into milestones."""
    return analyze_scope(request)
