from worker.db import init_db
from worker.jobs import claim_and_process


def test_claim_and_process_noop_without_db() -> None:
    init_db()
    assert claim_and_process() == 0
