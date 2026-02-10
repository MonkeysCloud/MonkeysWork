"""Tests for ai-fraud-v1 routes."""
import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.routes import router

# Ensure the router is mounted for tests
app.include_router(router)


@pytest.fixture
def client():
    return TestClient(app)


class TestFraudCheckEndpoint:
    """POST /api/v1/fraud/check"""

    def test_valid_request_returns_200(self, client):
        payload = {
            "account_id": "acc-123",
            "entity_type": "proposal",
            "entity_id": "prop-456",
        }
        response = client.post("/api/v1/fraud/check", json=payload)
        assert response.status_code == 200

    def test_response_contains_required_fields(self, client):
        payload = {"account_id": "acc-123"}
        response = client.post("/api/v1/fraud/check", json=payload)
        data = response.json()
        assert "account_id" in data
        assert "fraud_score" in data
        assert "risk_tier" in data
        assert "recommended_action" in data
        assert "top_risk_factors" in data
        assert "model_version" in data
        assert "enforcement_mode" in data

    def test_response_echoes_account_id(self, client):
        payload = {"account_id": "acc-test-echo"}
        response = client.post("/api/v1/fraud/check", json=payload)
        assert response.json()["account_id"] == "acc-test-echo"

    def test_default_entity_type_is_proposal(self, client):
        """entity_type should default to 'proposal' if not provided."""
        payload = {"account_id": "acc-123"}
        response = client.post("/api/v1/fraud/check", json=payload)
        # Endpoint should still accept request without entity_type
        assert response.status_code == 200

    def test_placeholder_returns_low_risk(self, client):
        """Placeholder implementation returns safe defaults."""
        payload = {"account_id": "acc-123"}
        response = client.post("/api/v1/fraud/check", json=payload)
        data = response.json()
        assert data["fraud_score"] == 0.0
        assert data["risk_tier"] == "low"
        assert data["recommended_action"] == "allow"
        assert data["top_risk_factors"] == []
        assert data["enforcement_mode"] == "shadow"

    def test_missing_account_id_returns_422(self, client):
        response = client.post("/api/v1/fraud/check", json={})
        assert response.status_code == 422

    def test_invalid_body_returns_422(self, client):
        response = client.post("/api/v1/fraud/check", json="not-a-dict")
        assert response.status_code == 422

    def test_extra_fields_are_ignored(self, client):
        payload = {
            "account_id": "acc-123",
            "unknown_field": "should-be-ignored",
        }
        response = client.post("/api/v1/fraud/check", json=payload)
        assert response.status_code == 200

    def test_empty_account_id_accepted(self, client):
        """Empty string is still a valid str for the field."""
        payload = {"account_id": ""}
        response = client.post("/api/v1/fraud/check", json=payload)
        assert response.status_code == 200
        assert response.json()["account_id"] == ""

    def test_model_version_is_placeholder(self, client):
        payload = {"account_id": "acc-123"}
        response = client.post("/api/v1/fraud/check", json=payload)
        assert response.json()["model_version"] == "v0.0.0-placeholder"

    def test_wrong_http_method_returns_405(self, client):
        response = client.get("/api/v1/fraud/check")
        assert response.status_code == 405
