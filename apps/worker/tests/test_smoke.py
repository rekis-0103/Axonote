from worker.main import claim_and_process


def test_claim_and_process_noop() -> None:
    assert claim_and_process() == 0
