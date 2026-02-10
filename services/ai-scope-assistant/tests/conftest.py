"""Shared test fixtures for ai-scope-assistant."""
import pytest
from fastapi.testclient import TestClient
from src.main import app


@pytest.fixture
def client():
    """Create a FastAPI TestClient."""
    return TestClient(app)


@pytest.fixture
def scope_request_payload():
    """Valid payload for the scope analysis endpoint."""
    return {
        "job_id": "job-123",
        "title": "Build a web app",
        "description": "Full-stack web application with auth",
        "category": "web-development",
        "skills_required": ["React", "Node.js", "PostgreSQL"],
        "budget_type": "fixed",
        "budget_min": 5000.0,
        "budget_max": 10000.0,
    }


@pytest.fixture
def minimal_scope_payload():
    """Minimal valid payload (only required fields)."""
    return {
        "job_id": "job-456",
        "title": "Simple task",
        "description": "A simple task description",
        "category": "general",
    }
