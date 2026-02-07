import os
from pydantic import BaseModel


class Settings(BaseModel):
    service_name: str = "ai-match-v1"
    environment: str = os.getenv("ENVIRONMENT", "dev")
    gcp_project_id: str = os.getenv("GCP_PROJECT_ID", "monkeyswork-dev")
    region: str = os.getenv("REGION", "us-central1")
    log_level: str = os.getenv("LOG_LEVEL", "info")

    # Feature flags
    feature_enabled: bool = os.getenv("FEATURE_FLAG_AI_MATCH_V1", "true").lower() == "true"
    fallback_mode: str = os.getenv("FALLBACK_MODE", "manual")

    # Model
    model_endpoint: str = os.getenv("MODEL_ENDPOINT", "")
    model_version: str = os.getenv("MODEL_VERSION", "v1.0.0")


settings = Settings()
