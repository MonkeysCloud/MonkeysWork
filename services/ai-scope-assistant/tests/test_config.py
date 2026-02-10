"""Tests for ai-scope-assistant configuration."""
import os
import importlib
from unittest.mock import patch


class TestSettingsDefaults:
    """Test the Settings model default values."""

    def test_default_service_name(self):
        from src.config import Settings
        s = Settings()
        assert s.service_name == "ai-scope-assistant"

    def test_default_environment_is_dev(self):
        from src.config import Settings
        s = Settings()
        assert isinstance(s.environment, str)

    def test_default_gcp_project(self):
        from src.config import Settings
        s = Settings()
        assert isinstance(s.gcp_project_id, str)

    def test_default_region(self):
        from src.config import Settings
        s = Settings()
        assert s.region == "us-central1"

    def test_default_log_level(self):
        from src.config import Settings
        s = Settings()
        assert s.log_level == "info"

    def test_default_fallback_mode(self):
        from src.config import Settings
        s = Settings()
        assert s.fallback_mode == "manual"

    def test_default_model_version(self):
        from src.config import Settings
        s = Settings()
        assert s.model_version == "v1.0.0"

    def test_settings_singleton_exists(self):
        from src.config import settings
        assert settings is not None
        assert settings.service_name == "ai-scope-assistant"


class TestSettingsEnvOverrides:
    """Test that env vars control Settings values."""

    def _reload_settings(self):
        import src.config
        importlib.reload(src.config)
        return src.config.Settings()

    def test_feature_enabled_true_by_default(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("FEATURE_FLAG_AI_SCOPE_ASSISTANT", None)
            s = self._reload_settings()
            assert s.feature_enabled is True

    def test_feature_enabled_false_when_env_false(self):
        with patch.dict(os.environ, {"FEATURE_FLAG_AI_SCOPE_ASSISTANT": "false"}):
            s = self._reload_settings()
            assert s.feature_enabled is False

    def test_feature_enabled_case_insensitive(self):
        with patch.dict(os.environ, {"FEATURE_FLAG_AI_SCOPE_ASSISTANT": "TRUE"}):
            s = self._reload_settings()
            assert s.feature_enabled is True

    def test_env_override_model_endpoint(self):
        with patch.dict(os.environ, {"MODEL_ENDPOINT": "https://vertex.ai/test"}):
            s = self._reload_settings()
            assert s.model_endpoint == "https://vertex.ai/test"

    def test_env_override_environment(self):
        with patch.dict(os.environ, {"ENVIRONMENT": "production"}):
            s = self._reload_settings()
            assert s.environment == "production"

    def test_env_override_log_level(self):
        with patch.dict(os.environ, {"LOG_LEVEL": "debug"}):
            s = self._reload_settings()
            assert s.log_level == "debug"

    def test_env_override_gcp_project(self):
        with patch.dict(os.environ, {"GCP_PROJECT_ID": "monkeyswork-prod"}):
            s = self._reload_settings()
            assert s.gcp_project_id == "monkeyswork-prod"

    def test_env_override_model_version(self):
        with patch.dict(os.environ, {"MODEL_VERSION": "v2.5.0"}):
            s = self._reload_settings()
            assert s.model_version == "v2.5.0"
