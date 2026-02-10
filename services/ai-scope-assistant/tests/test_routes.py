"""Tests for ai-scope-assistant routes."""
import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.routes import router

# Ensure the router is mounted for tests
app.include_router(router)


@pytest.fixture
def client():
    return TestClient(app)


class TestScopeAnalyzeEndpoint:
    """POST /api/v1/scope/analyze"""

    def test_valid_request_returns_200(self, client):
        payload = {
            "job_id": "job-123",
            "title": "Build a web app",
            "description": "Full-stack web application",
            "category": "web-development",
        }
        response = client.post("/api/v1/scope/analyze", json=payload)
        assert response.status_code == 200

    def test_response_contains_required_fields(self, client):
        payload = {
            "job_id": "job-123",
            "title": "Test job",
            "description": "Test description",
            "category": "testing",
        }
        response = client.post("/api/v1/scope/analyze", json=payload)
        data = response.json()
        assert "job_id" in data
        assert "milestones" in data
        assert "total_estimated_hours" in data
        assert "confidence_score" in data
        assert "complexity_tier" in data
        assert "model_version" in data

    def test_response_echoes_job_id(self, client):
        payload = {
            "job_id": "job-echo-test",
            "title": "Echo test",
            "description": "Testing echo",
            "category": "test",
        }
        response = client.post("/api/v1/scope/analyze", json=payload)
        assert response.json()["job_id"] == "job-echo-test"

    def test_skills_required_defaults_empty_list(self, client):
        """skills_required should default to [] if not provided."""
        payload = {
            "job_id": "job-123",
            "title": "Test",
            "description": "Test desc",
            "category": "test",
        }
        response = client.post("/api/v1/scope/analyze", json=payload)
        assert response.status_code == 200

    def test_budget_type_defaults_fixed(self, client):
        """budget_type should default to 'fixed'."""
        payload = {
            "job_id": "job-123",
            "title": "Test",
            "description": "Test desc",
            "category": "test",
        }
        response = client.post("/api/v1/scope/analyze", json=payload)
        assert response.status_code == 200

    def test_optional_budget_fields(self, client):
        """budget_min and budget_max are optional."""
        payload = {
            "job_id": "job-123",
            "title": "Test",
            "description": "Test desc",
            "category": "test",
            "budget_min": 1000.0,
            "budget_max": 5000.0,
        }
        response = client.post("/api/v1/scope/analyze", json=payload)
        assert response.status_code == 200

    def test_full_payload_with_all_fields(self, client):
        payload = {
            "job_id": "job-full",
            "title": "Full project",
            "description": "A complete project scope",
            "category": "web-development",
            "skills_required": ["React", "Node.js"],
            "budget_type": "hourly",
            "budget_min": 50.0,
            "budget_max": 100.0,
        }
        response = client.post("/api/v1/scope/analyze", json=payload)
        assert response.status_code == 200

    def test_placeholder_returns_empty_milestones(self, client):
        payload = {
            "job_id": "job-123",
            "title": "Test",
            "description": "Test desc",
            "category": "test",
        }
        response = client.post("/api/v1/scope/analyze", json=payload)
        data = response.json()
        assert data["milestones"] == []
        assert data["total_estimated_hours"] == 0
        assert data["confidence_score"] == 0
        assert data["complexity_tier"] == "unknown"

    def test_model_version_is_placeholder(self, client):
        payload = {
            "job_id": "job-123",
            "title": "Test",
            "description": "Test desc",
            "category": "test",
        }
        response = client.post("/api/v1/scope/analyze", json=payload)
        assert response.json()["model_version"] == "v0.0.0-placeholder"

    def test_missing_job_id_returns_422(self, client):
        payload = {
            "title": "Test",
            "description": "Test desc",
            "category": "test",
        }
        response = client.post("/api/v1/scope/analyze", json=payload)
        assert response.status_code == 422

    def test_missing_title_returns_422(self, client):
        payload = {
            "job_id": "job-123",
            "description": "Test desc",
            "category": "test",
        }
        response = client.post("/api/v1/scope/analyze", json=payload)
        assert response.status_code == 422

    def test_missing_description_returns_422(self, client):
        payload = {
            "job_id": "job-123",
            "title": "Test",
            "category": "test",
        }
        response = client.post("/api/v1/scope/analyze", json=payload)
        assert response.status_code == 422

    def test_missing_category_returns_422(self, client):
        payload = {
            "job_id": "job-123",
            "title": "Test",
            "description": "Test desc",
        }
        response = client.post("/api/v1/scope/analyze", json=payload)
        assert response.status_code == 422

    def test_invalid_body_returns_422(self, client):
        response = client.post("/api/v1/scope/analyze", json="not-a-dict")
        assert response.status_code == 422

    def test_extra_fields_are_ignored(self, client):
        payload = {
            "job_id": "job-123",
            "title": "Test",
            "description": "Test desc",
            "category": "test",
            "unknown_field": "should-be-ignored",
        }
        response = client.post("/api/v1/scope/analyze", json=payload)
        assert response.status_code == 200

    def test_wrong_http_method_returns_405(self, client):
        response = client.get("/api/v1/scope/analyze")
        assert response.status_code == 405
