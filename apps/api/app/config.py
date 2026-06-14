from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_API_ROOT = Path(__file__).resolve().parent.parent
_ENV_CANDIDATES = (
    _API_ROOT / ".env",
    _API_ROOT.parent.parent / ".env",
)
_ENV_FILES = tuple(str(path) for path in _ENV_CANDIDATES if path.is_file()) or (
    str(_API_ROOT / ".env"),
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILES, extra="ignore")

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"
    database_url: str = "sqlite:///:memory:"
    jwt_secret: str = "change-me-in-production"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    google_client_id: str = ""
    google_clock_skew_seconds: int = 120
    upload_dir: str = "uploads"
    max_upload_bytes: int = 20 * 1024 * 1024
    allowed_extensions: str = "pdf,docx,pptx"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_extension_set(self) -> set[str]:
        return {ext.strip().lower().lstrip(".") for ext in self.allowed_extensions.split(",")}

    @property
    def upload_path(self) -> Path:
        path = Path(self.upload_dir)
        if path.is_absolute():
            return path
        return _API_ROOT.parent.parent / path


@lru_cache
def get_settings() -> Settings:
    return Settings()
