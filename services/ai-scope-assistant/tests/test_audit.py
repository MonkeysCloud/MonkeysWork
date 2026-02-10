"""Tests for ai-scope-assistant audit logging."""
import uuid
from unittest.mock import patch
from datetime import datetime
from src.audit import log_ai_decision


class TestLogAiDecision:
    """Test the audit log_ai_decision function."""

    def _make_decision(self, **overrides):
        defaults = {
            "decision_type": "scope_analysis",
            "entity_type": "job",
            "entity_id": "job-123",
            "model_name": "scope-model",
            "model_version": "v1.0.0",
            "output": {"milestones": [], "complexity_tier": "medium"},
            "confidence_score": 0.78,
            "latency_ms": 500,
        }
        defaults.update(overrides)
        return log_ai_decision(**defaults)

    def test_returns_dict(self):
        record = self._make_decision()
        assert isinstance(record, dict)

    def test_record_contains_all_required_fields(self):
        record = self._make_decision()
        expected_keys = {
            "id", "decision_type", "entity_type", "entity_id",
            "model_name", "model_version", "prompt_version",
            "output", "confidence_score", "latency_ms",
            "explanation", "created_at",
        }
        assert expected_keys.issubset(set(record.keys()))

    def test_id_is_valid_uuid(self):
        record = self._make_decision()
        parsed = uuid.UUID(record["id"])
        assert str(parsed) == record["id"]

    def test_created_at_is_iso_format(self):
        record = self._make_decision()
        dt = datetime.fromisoformat(record["created_at"])
        assert dt is not None

    def test_decision_type_matches_input(self):
        record = self._make_decision(decision_type="scope_analysis")
        assert record["decision_type"] == "scope_analysis"

    def test_entity_fields_match_input(self):
        record = self._make_decision(entity_type="job", entity_id="job-999")
        assert record["entity_type"] == "job"
        assert record["entity_id"] == "job-999"

    def test_model_fields_match_input(self):
        record = self._make_decision(model_name="gemini-pro", model_version="v2.0.0")
        assert record["model_name"] == "gemini-pro"
        assert record["model_version"] == "v2.0.0"

    def test_output_dict_preserved(self):
        output = {"milestones": [{"title": "Phase 1"}], "complexity_tier": "high"}
        record = self._make_decision(output=output)
        assert record["output"] == output

    def test_confidence_score_preserved(self):
        record = self._make_decision(confidence_score=0.55)
        assert record["confidence_score"] == 0.55

    def test_latency_ms_preserved(self):
        record = self._make_decision(latency_ms=800)
        assert record["latency_ms"] == 800

    def test_prompt_version_defaults_none(self):
        record = self._make_decision()
        assert record["prompt_version"] is None

    def test_prompt_version_when_provided(self):
        record = self._make_decision(prompt_version="scope-prompt-v3")
        assert record["prompt_version"] == "scope-prompt-v3"

    def test_explanation_defaults_none(self):
        record = self._make_decision()
        assert record["explanation"] is None

    def test_explanation_when_provided(self):
        explanation = {"reasoning": "Complex multi-phase project"}
        record = self._make_decision(explanation=explanation)
        assert record["explanation"] == explanation

    @patch("src.audit.logger")
    def test_logger_info_called(self, mock_logger):
        record = self._make_decision()
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args
        assert call_args[0][0] == "ai_decision"

    @patch("src.audit.logger")
    def test_logger_receives_record_kwargs(self, mock_logger):
        self._make_decision(decision_type="test_decision")
        call_kwargs = mock_logger.info.call_args[1]
        assert call_kwargs["decision_type"] == "test_decision"
        assert "id" in call_kwargs
        assert "created_at" in call_kwargs
