"""Axonote worker — polls jobs and runs the analysis pipeline."""
import logging
import signal
import time

from worker.config import POLL_INTERVAL_SECONDS, database_label, get_settings
from worker.db import init_db
from worker.jobs import claim_and_process

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("worker")

_running = True


def _stop(*_args: object) -> None:
    global _running
    _running = False
    logger.info("Shutdown signal received, stopping...")


def run() -> None:
    settings = get_settings()
    init_db()
    signal.signal(signal.SIGINT, _stop)
    signal.signal(signal.SIGTERM, _stop)
    logger.info(
        "Worker started. Polling every %ss. Database: %s. Upload dir: %s",
        POLL_INTERVAL_SECONDS,
        database_label(settings.database_url),
        settings.upload_path,
    )
    if not settings.uses_mysql:
        logger.warning(
            "Worker is not connected to MySQL. Jobs in XAMPP will stay queued until "
            "DATABASE_URL points to the same database as the API (see apps/api/.env)."
        )
    while _running:
        processed = claim_and_process()
        if processed == 0:
            time.sleep(POLL_INTERVAL_SECONDS)
    logger.info("Worker stopped.")


if __name__ == "__main__":
    run()
