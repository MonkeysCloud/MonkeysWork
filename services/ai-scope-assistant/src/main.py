"""
AI Scope Assistant - Job decomposition into structured milestones
"""
import os
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
import structlog

logger = structlog.get_logger()

SERVICE_NAME = "ai-scope-assistant"
VERSION = os.getenv("SERVICE_VERSION", "0.1.0")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("service_starting", service=SERVICE_NAME, version=VERSION)
    # TODO: Initialize model clients, PubSub subscribers
    yield
    logger.info("service_stopping", service=SERVICE_NAME)


app = FastAPI(
    title=SERVICE_NAME,
    version=VERSION,
    lifespan=lifespan,
)


@app.get("/healthz")
async def health():
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "version": VERSION,
    }


@app.get("/readyz")
async def ready():
    # TODO: Check model endpoint connectivity, PubSub health
    return {"status": "ready"}
