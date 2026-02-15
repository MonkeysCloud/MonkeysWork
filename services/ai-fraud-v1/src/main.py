"""
AI Fraud Detection v1 - Account and proposal fraud scoring

Subscribes to:
  - user-registered  → creates fraud baseline (async)

Exposes:
  - POST /api/v1/fraud/check  → sync fraud score for proposals (<500ms)
"""

import os
import sys
import asyncio
from fastapi import FastAPI
from contextlib import asynccontextmanager
import structlog

# Add parent dir so shared/ is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.routes import router
from src.config import settings

logger = structlog.get_logger()

SERVICE_NAME = "ai-fraud-v1"
VERSION = os.getenv("SERVICE_VERSION", "1.0.0")

# Background task handle
_subscriber_task = None


async def _start_subscribers():
    """Start Pub/Sub subscribers as background tasks."""
    try:
        from shared.pubsub import subscribe_async
        from src.subscribers import handle_user_registered

        global _subscriber_task
        _subscriber_task = asyncio.create_task(
            subscribe_async(
                topic_name="user-registered",
                subscription_name="user-registered-fraud",
                handler=handle_user_registered,
            )
        )
        logger.info("subscriber_started", topic="user-registered")
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


app = FastAPI(
    title=SERVICE_NAME,
    version=VERSION,
    lifespan=lifespan,
)

app.include_router(router)


@app.get("/healthz")
async def health():
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "version": VERSION,
    }


@app.get("/readyz")
async def ready():
    return {"status": "ready"}
