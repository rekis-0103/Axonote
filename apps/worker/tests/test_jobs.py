from unittest.mock import MagicMock, patch

from sqlalchemy.exc import ProgrammingError

from worker.jobs import _claim_next_job


def test_claim_falls_back_when_skip_locked_unsupported() -> None:
    queued_job = MagicMock()
    queued_job.material_id = 1
    queued_job.id = 99

    session = MagicMock()
    session.scalar.side_effect = [ProgrammingError("", "", ""), queued_job]
    session.get.return_value = MagicMock(status="pending")
    session.commit = MagicMock()

    with patch("worker.jobs.SessionLocal") as session_local:
        session_local.return_value.__enter__.return_value = session
        job_id = _claim_next_job()

    assert job_id == 99
    assert session.rollback.called
    assert session.scalar.call_count == 2
