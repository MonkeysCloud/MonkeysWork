"""
AI Match v1 - Freelancer-to-job matching engine

Subscribes to:
  - job-published → computes matches for new jobs (async)
  - profile-ready → re-ranks jobs for updated freelancer profiles

Exposes:
  - POST /api/v1/match/rank → sync match ranking (called by PHP API)
"""

import os
import sys
import asyncio
from fastapi import FastAPI
from contextlib import asynccontextmanager
import structlog

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.routes import router
from src.config import settings

logger = structlog.get_logger()

SERVICE_NAME = "ai-match-v1"
VERSION = os.getenv("SERVICE_VERSION", "1.0.0")

_subscriber_tasks = []


async def _start_subscribers():
    """Start Pub/Sub subscribers for matching events."""
    try:
        from shared.pubsub import subscribe_async
        from src.subscribers import handle_job_published, handle_profile_ready

        global _subscriber_tasks
        _subscriber_tasks.append(
            asyncio.create_task(
                subscribe_async(
                    topic_name="job-published",
                    subscription_name="job-published-match",
                    handler=handle_job_published,
                )
            )
        )
        _subscriber_tasks.append(
            asyncio.create_task(
                subscribe_async(
                    topic_name="profile-ready",
                    subscription_name="profile-ready-match",
                    handler=handle_profile_ready,
                )
            )
        )
        logger.info("subscribers_started", topics=["job-published", "profile-ready"])
    except Exception:
        logger.exception("subscriber_start_failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("service_starting", service=SERVICE_NAME, version=VERSION)
    await _start_subscribers()
    yield
    for task in _subscriber_tasks:
        task.cancel()
    logger.info("service_stopping", service=SERVICE_NAME)


app = FastAPI(title=SERVICE_NAME, version=VERSION, lifespan=lifespan)
app.include_router(router)


@app.get("/healthz")
async def health():
    return {"status": "ok", "service": SERVICE_NAME, "version": VERSION}


@app.get("/readyz")
async def ready():
    return {"status": "ready"}
