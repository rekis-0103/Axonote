import os

POLL_INTERVAL_SECONDS = float(os.getenv("WORKER_POLL_INTERVAL_SECONDS", "3"))
BATCH_SIZE = int(os.getenv("WORKER_BATCH_SIZE", "1"))
