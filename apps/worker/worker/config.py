import logging
import os
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

logger = logging.getLogger("worker.config")

_WORKER_ROOT = Path(__file__).resolve().parent.parent
_REPO_ROOT = _WORKER_ROOT.parent.parent
_API_ROOT = _REPO_ROOT / "apps" / "api"

for _env_path in (
    _REPO_ROOT / ".env",
    _API_ROOT / ".env",
    _WORKER_ROOT / ".env",
):
    if _env_path.is_file():
        load_dotenv(_env_path)

POLL_INTERVAL_SECONDS = float(os.getenv("WORKER_POLL_INTERVAL_SECONDS", "3"))
BATCH_SIZE = int(os.getenv("WORKER_BATCH_SIZE", "1"))


def get_batch_size() -> int:
    return BATCH_SIZE


class Settings:
    def __init__(self, database_url: str, upload_dir: str) -> None:
        self.database_url = database_url
        self.upload_dir = upload_dir

    @property
    def upload_path(self) -> Path:
        path = Path(self.upload_dir)
        if path.is_absolute():
            return path
        return _REPO_ROOT / path

    @property
    def uses_mysql(self) -> bool:
        return self.database_url.startswith("mysql")


@lru_cache
def get_settings() -> Settings:
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        database_url = "sqlite:///:memory:"
        logger.warning(
            "DATABASE_URL is not set. Worker will use in-memory SQLite and will NOT "
            "process jobs from MySQL. Set DATABASE_URL in apps/api/.env or root .env."
        )

    upload_dir = os.getenv("UPLOAD_DIR", "uploads").strip() or "uploads"
    return Settings(database_url=database_url, upload_dir=upload_dir)


def database_label(database_url: str) -> str:
    if database_url.startswith("sqlite"):
        return "SQLite (in-memory or local file — not shared with API MySQL)"
    parsed = urlparse(database_url.replace("+pymysql", ""))
    host = parsed.hostname or "unknown"
    port = parsed.port or ""
    database = (parsed.path or "").lstrip("/") or "unknown"
    port_suffix = f":{port}" if port else ""
    return f"MySQL {host}{port_suffix}/{database}"
