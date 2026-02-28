"""
Profile AI routes — bio/headline generation and skill suggestions.
"""

import json
import time
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter
import structlog

logger = structlog.get_logger()

router = APIRouter(prefix="/api/v1/profile", tags=["Profile AI"])

MODEL_VERSION = "dev-fallback-v1"

logger.info("profile_routes_loaded", endpoints=["enhance", "suggest-skills"])


# ── Request / Response models ──────────────────────────────────────

class ProfileEnhanceRequest(BaseModel):
    name: str = ""
    current_headline: str = ""
    current_bio: str = ""
    skills: List[str] = []
    experience_years: int = 0
    tone: str = "professional"  # professional | friendly | creative


class ProfileEnhanceResponse(BaseModel):
    headline: str
    bio: str
    model_version: str = MODEL_VERSION
    latency_ms: int = 0


class SkillSuggestRequest(BaseModel):
    headline: str = ""
    bio: str = ""
    experience_years: int = 0
    current_skills: List[str] = []


class SuggestedSkill(BaseModel):
    name: str
    reason: str


class SkillSuggestResponse(BaseModel):
    suggested_skills: List[SuggestedSkill]
    model_version: str = MODEL_VERSION
    latency_ms: int = 0


# ── Dev fallback: profile enhance ──────────────────────────────────

def _dev_enhance(req: ProfileEnhanceRequest) -> ProfileEnhanceResponse:
    """Rule-based fallback when Vertex AI is not enabled."""
    start = time.monotonic()
    name = req.name or "Freelancer"
    skills_str = ", ".join(req.skills[:5]) if req.skills else "various technologies"
    exp = req.experience_years

    # Generate headline
    if req.skills:
        top_skills = req.skills[:3]
        headline = f"{' & '.join(top_skills)} Specialist"
        if exp > 0:
            headline += f" | {exp}+ Years Experience"
    else:
        headline = f"Experienced Professional | {exp}+ Years" if exp > 0 else "Skilled Freelancer Ready for New Challenges"

    # Generate bio
    exp_phrase = f"With over {exp} years of hands-on experience" if exp > 0 else "As a dedicated professional"

    tone_intros = {
        "professional": f"{exp_phrase} in {skills_str}, I deliver high-quality solutions that drive real business results.",
        "friendly": f"{exp_phrase} working with {skills_str}, I love turning complex challenges into elegant solutions!",
        "creative": f"{exp_phrase} across {skills_str}, I bring a unique blend of technical expertise and creative problem-solving to every project.",
    }

    intro = tone_intros.get(req.tone, tone_intros["professional"])

    bio = f"""{intro}

My approach centers on understanding client needs first, then applying best practices to deliver reliable, maintainable solutions on time and within budget. I'm passionate about clean code, clear communication, and exceeding expectations.

Whether you need a full build from scratch or improvements to an existing system, I'm ready to bring your vision to life. Let's discuss your project!"""

    elapsed = int((time.monotonic() - start) * 1000)
    return ProfileEnhanceResponse(
        headline=headline,
        bio=bio,
        latency_ms=elapsed,
    )


# ── Dev fallback: skill suggestions ────────────────────────────────

# Common skill clusters for the suggestion engine
SKILL_CLUSTERS = {
    "react": ["TypeScript", "Next.js", "Redux", "Tailwind CSS", "GraphQL", "Jest"],
    "node": ["Express.js", "TypeScript", "MongoDB", "PostgreSQL", "REST API", "Docker"],
    "python": ["Django", "FastAPI", "PostgreSQL", "Docker", "Machine Learning", "Data Analysis"],
    "javascript": ["TypeScript", "React", "Node.js", "CSS", "HTML", "REST API"],
    "php": ["Laravel", "MySQL", "REST API", "Docker", "Redis", "JavaScript"],
    "java": ["Spring Boot", "Microservices", "Docker", "Kubernetes", "PostgreSQL", "REST API"],
    "design": ["Figma", "Adobe XD", "UI/UX", "Prototyping", "Responsive Design", "User Research"],
    "mobile": ["React Native", "Flutter", "Firebase", "REST API", "UI/UX", "App Store Optimization"],
    "devops": ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Linux"],
    "data": ["Python", "SQL", "Machine Learning", "Data Visualization", "Pandas", "TensorFlow"],
    "marketing": ["SEO", "Google Analytics", "Content Strategy", "Social Media", "Email Marketing", "A/B Testing"],
}


def _dev_suggest_skills(req: SkillSuggestRequest) -> SkillSuggestResponse:
    """Rule-based fallback for skill suggestions."""
    start = time.monotonic()
    current_lower = {s.lower() for s in req.current_skills}
    suggestions: list[SuggestedSkill] = []

    # Combine headline + bio for keyword matching
    context = f"{req.headline} {req.bio}".lower()

    for keyword, related_skills in SKILL_CLUSTERS.items():
        if keyword in context or any(keyword in s for s in current_lower):
            for skill in related_skills:
                if skill.lower() not in current_lower and not any(s.name == skill for s in suggestions):
                    suggestions.append(SuggestedSkill(
                        name=skill,
                        reason=f"Commonly paired with {keyword} expertise",
                    ))

    # Deduplicate and limit
    seen = set()
    unique = []
    for s in suggestions:
        if s.name.lower() not in seen:
            seen.add(s.name.lower())
            unique.append(s)
    suggestions = unique[:10]

    # If no matches, suggest general in-demand skills
    if not suggestions:
        suggestions = [
            SuggestedSkill(name="Communication", reason="Essential for client collaboration"),
            SuggestedSkill(name="Project Management", reason="Highly valued by clients"),
            SuggestedSkill(name="Problem Solving", reason="Core freelancing skill"),
            SuggestedSkill(name="Git", reason="Industry-standard version control"),
            SuggestedSkill(name="Agile", reason="Modern project methodology"),
        ]

    elapsed = int((time.monotonic() - start) * 1000)
    return SkillSuggestResponse(
        suggested_skills=suggestions,
        latency_ms=elapsed,
    )


# ── Vertex AI prompts ──────────────────────────────────────────────

PROFILE_ENHANCE_PROMPT = """You are a career coach helping a freelancer create a compelling profile on MonkeysWork, a freelancing platform.

FREELANCER INFO:
- Name: {name}
- Skills: {skills}
- Experience: {experience_years} years
- Current headline (may be empty): {current_headline}
- Current bio (may be empty): {current_bio}
- Desired tone: {tone}

GENERATE:
1. A professional headline (max 80 characters) that highlights their top skills and experience
2. A compelling bio (150-250 words) that:
   - Opens with a strong value proposition
   - Highlights key skills and experience
   - Mentions specific technologies/tools
   - Shows personality matching the requested tone
   - Ends with a call-to-action

Respond in STRICT JSON only, no markdown fences:
{{
  "headline": "<string, max 80 chars>",
  "bio": "<string, 150-250 words, plain text with paragraph breaks>"
}}"""

SKILL_SUGGEST_PROMPT = """You are a career advisor helping a freelancer on MonkeysWork identify skills they should add to their profile.

FREELANCER CONTEXT:
- Headline: {headline}
- Bio: {bio}
- Experience: {experience_years} years
- Current skills: {current_skills}

Suggest 8-10 additional skills they likely have or should learn, based on their profile. Only suggest skills NOT already in their current skills list.

For each skill, provide a brief reason why it's relevant.

Respond in STRICT JSON only, no markdown fences:
{{
  "suggested_skills": [
    {{"name": "<skill name>", "reason": "<brief reason, 10 words max>"}}
  ]
}}"""


# ── Endpoints ──────────────────────────────────────────────────────

@router.post("/enhance", response_model=ProfileEnhanceResponse)
async def enhance_profile(request: ProfileEnhanceRequest):
    """Generate an optimized headline and bio for a freelancer profile."""
    from src.vertex_ai import is_vertex_enabled

    if is_vertex_enabled():
        try:
            from src.vertex_ai import _get_model
            import json as _json

            start = time.monotonic()
            prompt = PROFILE_ENHANCE_PROMPT.format(
                name=request.name or "Freelancer",
                skills=", ".join(request.skills) if request.skills else "Not specified",
                experience_years=request.experience_years or "Not specified",
                current_headline=request.current_headline or "Not provided",
                current_bio=request.current_bio or "Not provided",
                tone=request.tone,
            )

            model = _get_model()
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 2048,
                    "response_mime_type": "application/json",
                },
            )

            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
                text = text.rsplit("```", 1)[0].strip()

            result = _json.loads(text)
            elapsed = int((time.monotonic() - start) * 1000)

            logger.info("vertex_profile_enhance_complete", model="vertex")
            return ProfileEnhanceResponse(
                headline=result.get("headline", ""),
                bio=result.get("bio", ""),
                model_version="vertex-ai",
                latency_ms=elapsed,
            )
        except Exception as e:
            logger.exception("vertex_profile_enhance_failed", error=str(e))
            # Fall through to dev fallback

    return _dev_enhance(request)


@router.post("/suggest-skills", response_model=SkillSuggestResponse)
async def suggest_skills(request: SkillSuggestRequest):
    """Suggest relevant skills based on the freelancer's profile."""
    from src.vertex_ai import is_vertex_enabled

    if is_vertex_enabled():
        try:
            from src.vertex_ai import _get_model
            import json as _json

            start = time.monotonic()
            prompt = SKILL_SUGGEST_PROMPT.format(
                headline=request.headline or "Not provided",
                bio=request.bio or "Not provided",
                experience_years=request.experience_years or "Not specified",
                current_skills=", ".join(request.current_skills) if request.current_skills else "None",
            )

            model = _get_model()
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.5,
                    "max_output_tokens": 2048,
                    "response_mime_type": "application/json",
                },
            )

            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
                text = text.rsplit("```", 1)[0].strip()

            result = _json.loads(text)
            elapsed = int((time.monotonic() - start) * 1000)

            suggestions = [
                SuggestedSkill(name=s.get("name", ""), reason=s.get("reason", ""))
                for s in result.get("suggested_skills", [])
                if s.get("name")
            ]

            logger.info("vertex_skill_suggest_complete", count=len(suggestions))
            return SkillSuggestResponse(
                suggested_skills=suggestions,
                model_version="vertex-ai",
                latency_ms=elapsed,
            )
        except Exception as e:
            logger.exception("vertex_skill_suggest_failed", error=str(e))

    return _dev_suggest_skills(request)
