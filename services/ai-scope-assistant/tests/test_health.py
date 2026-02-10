"""Tests for ai-scope-assistant health and readiness endpoints."""
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


class TestHealthEndpoint:
    """GET /healthz"""

    def test_returns_200(self):
        response = client.get("/healthz")
        assert response.status_code == 200

    def test_status_is_ok(self):
        response = client.get("/healthz")
        assert response.json()["status"] == "ok"

    def test_service_name(self):
        response = client.get("/healthz")
        assert response.json()["service"] == "ai-scope-assistant"

    def test_version_present(self):
        response = client.get("/healthz")
        assert "version" in response.json()

    def test_response_is_json(self):
        response = client.get("/healthz")
        assert response.headers["content-type"] == "application/json"


class TestReadinessEndpoint:
    """GET /readyz"""

    def test_returns_200(self):
        response = client.get("/readyz")
        assert response.status_code == 200

    def test_status_is_ready(self):
        response = client.get("/readyz")
        assert response.json()["status"] == "ready"
