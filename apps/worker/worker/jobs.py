from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from worker.config import get_batch_size, get_settings
from worker.db import SessionLocal
from worker.models import Job, Material, Question, QuestionSet, Summary
from worker.pipeline.run import run_analysis


def claim_and_process() -> int:
    processed = 0
    settings = get_settings()

    for _ in range(get_batch_size()):
        job_id = _claim_next_job()
        if job_id is None:
            break
        _process_job(job_id, settings.upload_path)
        processed += 1

    return processed


def _select_queued_job(db: Session, *, skip_locked: bool) -> Job | None:
    query = (
        select(Job)
        .where(Job.status == "queued", Job.type == "analyze")
        .order_by(Job.created_at, Job.id)
        .limit(1)
    )
    if skip_locked:
        query = query.with_for_update(skip_locked=True)
    else:
        query = query.with_for_update()
    return db.scalar(query)


def _claim_next_job() -> int | None:
    with SessionLocal() as db:
        job: Job | None = None
        try:
            job = _select_queued_job(db, skip_locked=True)
        except ProgrammingError:
            db.rollback()
            job = _select_queued_job(db, skip_locked=False)

        if job is None:
            return None

        material = db.get(Material, job.material_id)
        if material is None:
            job.status = "failed"
            job.error_message = "Material not found."
            job.finished_at = datetime.now(UTC)
            db.commit()
            return job.id

        job.status = "running"
        job.started_at = datetime.now(UTC)
        job.attempts += 1
        material.status = "processing"
        material.error_message = None
        db.commit()
        return job.id


def _process_job(job_id: int, upload_path: Path) -> None:
    with SessionLocal() as db:
        job = db.get(Job, job_id)
        if job is None:
            return

        material = db.get(Material, job.material_id)
        if material is None:
            _mark_failed(db, job, material=None, error="Material not found.")
            return

        file_path = upload_path / material.stored_name
        extension = Path(material.original_name).suffix.lower().lstrip(".")

        try:
            if not file_path.is_file():
                raise FileNotFoundError(f"Uploaded file missing: {material.stored_name}")

            result = run_analysis(file_path, extension)
            _replace_outputs(db, material, result)
            material.status = "ready"
            material.error_message = None
            job.status = "done"
            job.error_message = None
            job.finished_at = datetime.now(UTC)
            db.commit()
        except Exception as exc:
            db.rollback()
            job = db.get(Job, job_id)
            material = db.get(Material, job.material_id) if job else None
            if job and material:
                _mark_failed(db, job, material, str(exc))


def _replace_outputs(db: Session, material: Material, result: dict[str, object]) -> None:
    db.execute(delete(Summary).where(Summary.material_id == material.id))
    db.execute(delete(QuestionSet).where(QuestionSet.material_id == material.id))

    summary = Summary(
        material_id=material.id,
        content=str(result["content"]),
        keywords=result["keywords"],
        meta=result["meta"],
    )
    db.add(summary)

    question_set = QuestionSet(material_id=material.id)
    db.add(question_set)
    db.flush()

    for payload in result["questions"]:
        db.add(
            Question(
                question_set_id=question_set.id,
                type=str(payload["type"]),
                stem=str(payload["stem"]),
                options={"items": payload["options"]},
                correct_index=int(payload["correct_index"]),
                explanation=str(payload.get("explanation") or ""),
                source_ref=payload.get("source_ref"),
            )
        )


def _mark_failed(db: Session, job: Job, material: Material | None, error: str) -> None:
    job.status = "failed"
    job.error_message = error[:2000]
    job.finished_at = datetime.now(UTC)
    if material is not None:
        material.status = "failed"
        material.error_message = error[:2000]
    db.commit()
