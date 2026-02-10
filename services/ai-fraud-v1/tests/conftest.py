"""Shared test fixtures for ai-fraud-v1."""
import pytest
from fastapi.testclient import TestClient
from src.main import app


@pytest.fixture
def client():
    """Create a FastAPI TestClient."""
    return TestClient(app)


@pytest.fixture
def fraud_check_payload():
    """Valid payload for the fraud check endpoint."""
    return {
        "account_id": "acc-123",
        "entity_type": "proposal",
        "entity_id": "prop-456",
    }


@pytest.fixture
def minimal_fraud_payload():
    """Minimal valid payload (only required fields)."""
    return {"account_id": "acc-789"}
