"""Tests for ai-match-v1 audit logging."""
import uuid
from unittest.mock import patch
from datetime import datetime
from src.audit import log_ai_decision


class TestLogAiDecision:
    """Test the audit log_ai_decision function."""

    def _make_decision(self, **overrides):
        defaults = {
            "decision_type": "match_ranking",
            "entity_type": "job",
            "entity_id": "job-123",
            "model_name": "match-model",
            "model_version": "v1.0.0",
            "output": {"results": [], "ab_group": "control"},
            "confidence_score": 0.88,
            "latency_ms": 200,
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
        record = self._make_decision(decision_type="match_ranking")
        assert record["decision_type"] == "match_ranking"

    def test_entity_fields_match_input(self):
        record = self._make_decision(entity_type="job", entity_id="job-999")
        assert record["entity_type"] == "job"
        assert record["entity_id"] == "job-999"

    def test_model_fields_match_input(self):
        record = self._make_decision(model_name="match-v2", model_version="v2.0.0")
        assert record["model_name"] == "match-v2"
        assert record["model_version"] == "v2.0.0"

    def test_output_dict_preserved(self):
        output = {"results": [{"id": "f1", "score": 0.9}]}
        record = self._make_decision(output=output)
        assert record["output"] == output

    def test_confidence_score_preserved(self):
        record = self._make_decision(confidence_score=0.65)
        assert record["confidence_score"] == 0.65

    def test_latency_ms_preserved(self):
        record = self._make_decision(latency_ms=300)
        assert record["latency_ms"] == 300

    def test_prompt_version_defaults_none(self):
        record = self._make_decision()
        assert record["prompt_version"] is None

    def test_prompt_version_when_provided(self):
        record = self._make_decision(prompt_version="prompt-v2")
        assert record["prompt_version"] == "prompt-v2"

    def test_explanation_defaults_none(self):
        record = self._make_decision()
        assert record["explanation"] is None

    def test_explanation_when_provided(self):
        explanation = {"reason": "Skills alignment"}
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
