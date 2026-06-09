"""Axonote worker skeleton.

A minimal poll loop. The analysis pipeline (extract -> preprocess -> keywords ->
summary -> questions) is intentionally not implemented yet; see
docs/architecture.md for the planned design.
"""
import logging
import signal
import time

from worker.config import POLL_INTERVAL_SECONDS

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("worker")

_running = True


def _stop(*_args: object) -> None:
    global _running
    _running = False
    logger.info("Shutdown signal received, stopping...")


def claim_and_process() -> int:
    """Placeholder: return number of jobs processed this tick (always 0 for now)."""
    return 0


def run() -> None:
    signal.signal(signal.SIGINT, _stop)
    signal.signal(signal.SIGTERM, _stop)
    logger.info("Worker started. Polling every %ss (skeleton, no-op).", POLL_INTERVAL_SECONDS)
    while _running:
        processed = claim_and_process()
        if processed == 0:
            time.sleep(POLL_INTERVAL_SECONDS)
    logger.info("Worker stopped.")


if __name__ == "__main__":
    run()
