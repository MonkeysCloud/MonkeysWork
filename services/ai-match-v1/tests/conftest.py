"""Shared test fixtures for ai-match-v1."""
import pytest
from fastapi.testclient import TestClient
from src.main import app


@pytest.fixture
def client():
    """Create a FastAPI TestClient."""
    return TestClient(app)


@pytest.fixture
def match_request_payload():
    """Valid payload for the match ranking endpoint."""
    return {
        "job_id": "job-123",
        "limit": 10,
    }


@pytest.fixture
def minimal_match_payload():
    """Minimal valid payload (only required fields)."""
    return {"job_id": "job-456"}
