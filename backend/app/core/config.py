"""
CogniDetect Backend — Core Settings
Loads all configuration from environment variables via pydantic-settings.
If a required variable is missing, the app fails loudly at startup (not silently at request time).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str = "placeholder-jwt-secret"

    groq_api_key: str
    gemini_api_key: str = ""
    llm_provider: str = "groq"

    environment: str = "dev"

    @property
    def is_production(self) -> bool:
        return self.environment == "prod"


settings = Settings()
