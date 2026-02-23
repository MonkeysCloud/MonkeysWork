"""
AI Scope Assistant - Job decomposition into structured milestones

Subscribes to:
  - job-published → auto-analyze scope for new jobs (async)

Exposes:
  - POST /api/v1/scope/analyze → sync scope analysis (called by PHP API)
"""

import os
import sys
import asyncio
from fastapi import FastAPI
from contextlib import asynccontextmanager
import structlog

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.routes import router
from src.job_enhance_routes import router as job_enhance_router
from src.proposal_routes import router as proposal_router
from src.config import settings

logger = structlog.get_logger()

SERVICE_NAME = "ai-scope-assistant"
VERSION = os.getenv("SERVICE_VERSION", "1.0.0")

_subscriber_task = None


async def _start_subscribers():
    """Start Pub/Sub subscribers for job-published events."""
    try:
        from shared.pubsub import subscribe_async
        from src.subscribers import handle_job_published, handle_job_moderation

        global _subscriber_task
        # Scope analysis subscriber
        scope_task = asyncio.create_task(
            subscribe_async(
                topic_name="job-published",
                subscription_name="job-published-scope",
                handler=handle_job_published,
            )
        )
        # Content moderation subscriber
        moderation_task = asyncio.create_task(
            subscribe_async(
                topic_name="job-published",
                subscription_name="job-published-moderation",
                handler=handle_job_moderation,
            )
        )
        _subscriber_task = asyncio.gather(scope_task, moderation_task)
        logger.info("subscribers_started", topics=["job-published-scope", "job-published-moderation"])
    except Exception:
        logger.exception("subscriber_start_failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("service_starting", service=SERVICE_NAME, version=VERSION)
    await _start_subscribers()
    yield
    if _subscriber_task:
        _subscriber_task.cancel()
    logger.info("service_stopping", service=SERVICE_NAME)


app = FastAPI(title=SERVICE_NAME, version=VERSION, lifespan=lifespan)
app.include_router(router)
app.include_router(job_enhance_router)
app.include_router(proposal_router)


@app.get("/healthz")
async def health():
    return {"status": "ok", "service": SERVICE_NAME, "version": VERSION}


@app.get("/readyz")
async def ready():
    return {"status": "ready"}
