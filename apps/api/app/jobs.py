from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import Job, Material, User
from app.schemas import JobRead

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])
DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def _job_read(job: Job) -> JobRead:
    return JobRead(
        id=job.id,
        material_id=job.material_id,
        type=job.type,
        status=job.status,
        error_message=job.error_message,
        created_at=job.created_at,
        finished_at=job.finished_at,
    )


@router.get("/{job_id}", response_model=JobRead)
def get_job(job_id: int, current_user: CurrentUser, db: DbSession) -> JobRead:
    job = db.scalar(
        select(Job)
        .join(Material, Material.id == Job.material_id)
        .where(Job.id == job_id, Material.user_id == current_user.id)
    )
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return _job_read(job)
