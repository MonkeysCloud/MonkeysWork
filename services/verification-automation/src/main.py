"""
Verification Automation - Identity & document verification

Subscribes to:
  - user-registered → creates initial verification row
  - verification-submitted → processes uploaded documents

Callbacks to PHP API:
  - POST /internal/verifications — create verification
  - PATCH /internal/verifications/{id} — update with AI result
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

SERVICE_NAME = "verification-automation"
VERSION = os.getenv("SERVICE_VERSION", "1.0.0")

_subscriber_tasks = []


async def _start_subscribers():
    """Start Pub/Sub subscribers for verification events."""
    try:
        from shared.pubsub import subscribe_async
        from src.subscribers import handle_user_registered, handle_verification_submitted

        global _subscriber_tasks
        _subscriber_tasks.append(
            asyncio.create_task(
                subscribe_async(
                    topic_name="user-registered",
                    subscription_name="user-registered-verification",
                    handler=handle_user_registered,
                )
            )
        )
        _subscriber_tasks.append(
            asyncio.create_task(
                subscribe_async(
                    topic_name="verification-submitted",
                    subscription_name="verification-submitted-automation",
                    handler=handle_verification_submitted,
                )
            )
        )
        logger.info("subscribers_started", topics=["user-registered", "verification-submitted"])
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
