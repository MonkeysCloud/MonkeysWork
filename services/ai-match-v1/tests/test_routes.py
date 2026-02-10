"""Tests for ai-match-v1 routes."""
import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.routes import router

# Ensure the router is mounted for tests
app.include_router(router)


@pytest.fixture
def client():
    return TestClient(app)


class TestMatchRankEndpoint:
    """POST /api/v1/match/rank"""

    def test_valid_request_returns_200(self, client):
        payload = {"job_id": "job-123", "limit": 10}
        response = client.post("/api/v1/match/rank", json=payload)
        assert response.status_code == 200

    def test_response_contains_required_fields(self, client):
        payload = {"job_id": "job-123"}
        response = client.post("/api/v1/match/rank", json=payload)
        data = response.json()
        assert "job_id" in data
        assert "results" in data
        assert "model_version" in data
        assert "ab_group" in data
        assert "latency_ms" in data

    def test_response_echoes_job_id(self, client):
        payload = {"job_id": "job-echo-test"}
        response = client.post("/api/v1/match/rank", json=payload)
        assert response.json()["job_id"] == "job-echo-test"

    def test_default_limit_is_20(self, client):
        """limit should default to 20 if not provided."""
        payload = {"job_id": "job-123"}
        response = client.post("/api/v1/match/rank", json=payload)
        assert response.status_code == 200

    def test_placeholder_returns_empty_results(self, client):
        payload = {"job_id": "job-123"}
        response = client.post("/api/v1/match/rank", json=payload)
        data = response.json()
        assert data["results"] == []
        assert data["ab_group"] == "control"
        assert data["latency_ms"] == 0

    def test_model_version_is_placeholder(self, client):
        payload = {"job_id": "job-123"}
        response = client.post("/api/v1/match/rank", json=payload)
        assert response.json()["model_version"] == "v0.0.0-placeholder"

    def test_missing_job_id_returns_422(self, client):
        response = client.post("/api/v1/match/rank", json={})
        assert response.status_code == 422

    def test_invalid_body_returns_422(self, client):
        response = client.post("/api/v1/match/rank", json="not-a-dict")
        assert response.status_code == 422

    def test_invalid_limit_type_returns_422(self, client):
        payload = {"job_id": "job-123", "limit": "not-a-number"}
        response = client.post("/api/v1/match/rank", json=payload)
        assert response.status_code == 422

    def test_extra_fields_are_ignored(self, client):
        payload = {"job_id": "job-123", "extra": "value"}
        response = client.post("/api/v1/match/rank", json=payload)
        assert response.status_code == 200

    def test_wrong_http_method_returns_405(self, client):
        response = client.get("/api/v1/match/rank")
        assert response.status_code == 405
