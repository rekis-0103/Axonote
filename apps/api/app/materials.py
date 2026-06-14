from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import get_settings
from app.db import get_db
from app.models import Job, Material, Question, QuestionSet, Summary, User
from app.rate_limit import limit_analyze, limit_upload
from app.schemas import (
    JobRead,
    MaterialListResponse,
    MaterialRead,
    QuestionPublic,
    QuestionSetRead,
    SummaryRead,
)

router = APIRouter(prefix="/api/v1/materials", tags=["materials"])
DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
UploadFileField = Annotated[UploadFile, File()]
TitleFormField = Annotated[str | None, Form()]

ZIP_MAGIC = (b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08")
MIME_BY_EXTENSION = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}


def _clean_filename(filename: str | None) -> str:
    name = Path(filename or "").name.strip()
    return name or "material"


def _extension(filename: str) -> str:
    return Path(filename).suffix.lower().lstrip(".")


def _validate_signature(extension: str, content: bytes) -> None:
    if extension == "pdf" and not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid PDF.",
        )

    if extension in {"docx", "pptx"} and not content.startswith(ZIP_MAGIC):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded file is not a valid {extension.upper()} document.",
        )


def _material_read(material: Material) -> MaterialRead:
    return MaterialRead(
        id=material.id,
        title=material.title,
        original_name=material.original_name,
        mime_type=material.mime_type,
        size_bytes=material.size_bytes,
        status=material.status,
        error_message=material.error_message,
        created_at=material.created_at,
        updated_at=material.updated_at,
    )


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


def _get_owned_material(material_id: int, current_user: User, db: Session) -> Material:
    material = db.scalar(
        select(Material).where(Material.id == material_id, Material.user_id == current_user.id)
    )
    if material is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found.")
    return material


def _json_list(value: object | None) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, dict) and "items" in value and isinstance(value["items"], list):
        return [str(item) for item in value["items"]]
    return []


@router.post("", response_model=MaterialRead, status_code=status.HTTP_201_CREATED)
async def upload_material(
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
    file: UploadFileField,
    title: TitleFormField = None,
) -> MaterialRead:
    limit_upload(request)
    settings = get_settings()
    original_name = _clean_filename(file.filename)
    extension = _extension(original_name)

    if extension not in settings.allowed_extension_set:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, DOCX, and PPTX files are supported.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is empty.")
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the maximum upload size.",
        )

    _validate_signature(extension, content)

    upload_dir = settings.upload_path
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}.{extension}"
    stored_path = upload_dir / stored_name
    stored_path.write_bytes(content)

    material = Material(
        user_id=current_user.id,
        title=(title or Path(original_name).stem).strip()[:255] or Path(original_name).stem,
        original_name=original_name[:255],
        stored_name=stored_name,
        mime_type=file.content_type or MIME_BY_EXTENSION[extension],
        size_bytes=len(content),
        status="pending",
    )

    try:
        db.add(material)
        db.commit()
        db.refresh(material)
    except Exception:
        stored_path.unlink(missing_ok=True)
        raise

    return _material_read(material)


@router.get("", response_model=MaterialListResponse)
def list_materials(current_user: CurrentUser, db: DbSession) -> MaterialListResponse:
    total = db.scalar(
        select(func.count()).select_from(Material).where(Material.user_id == current_user.id)
    )
    materials = db.scalars(
        select(Material)
        .where(Material.user_id == current_user.id)
        .order_by(desc(Material.created_at), desc(Material.id))
    ).all()

    return MaterialListResponse(
        items=[_material_read(material) for material in materials],
        total=total or 0,
    )


@router.get("/{material_id}", response_model=MaterialRead)
def get_material(material_id: int, current_user: CurrentUser, db: DbSession) -> MaterialRead:
    return _material_read(_get_owned_material(material_id, current_user, db))


@router.get("/{material_id}/jobs/latest", response_model=JobRead)
def get_latest_material_job(
    material_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> JobRead:
    material = _get_owned_material(material_id, current_user, db)
    job = db.scalar(
        select(Job)
        .where(Job.material_id == material.id, Job.type == "analyze")
        .order_by(desc(Job.created_at), desc(Job.id))
    )
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No analysis job found.")
    return _job_read(job)


@router.get("/{material_id}/summary", response_model=SummaryRead)
def get_material_summary(material_id: int, current_user: CurrentUser, db: DbSession) -> SummaryRead:
    material = _get_owned_material(material_id, current_user, db)
    if material.status != "ready":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not available.")

    summary = db.scalar(select(Summary).where(Summary.material_id == material.id))
    if summary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not available.")

    return SummaryRead(
        material_id=material.id,
        content=summary.content,
        keywords=_json_list(summary.keywords),
        created_at=summary.created_at,
    )


@router.get("/{material_id}/question-set", response_model=QuestionSetRead)
def get_material_question_set(
    material_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> QuestionSetRead:
    material = _get_owned_material(material_id, current_user, db)
    if material.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question set not available.",
        )

    question_set = db.scalar(select(QuestionSet).where(QuestionSet.material_id == material.id))
    if question_set is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question set not available.",
        )

    questions = db.scalars(
        select(Question).where(Question.question_set_id == question_set.id)
    ).all()

    return QuestionSetRead(
        question_set_id=question_set.id,
        questions=[
            QuestionPublic(
                id=question.id,
                type=question.type,
                stem=question.stem,
                options=_json_list(question.options),
            )
            for question in questions
        ],
    )


@router.post("/{material_id}/analyze", response_model=JobRead, status_code=status.HTTP_202_ACCEPTED)
def analyze_material(
    material_id: int,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
) -> JobRead:
    limit_analyze(request)
    material = _get_owned_material(material_id, current_user, db)
    existing_job = db.scalar(
        select(Job)
        .where(
            Job.material_id == material.id,
            Job.type == "analyze",
            Job.status.in_(("queued", "running")),
        )
        .order_by(desc(Job.created_at), desc(Job.id))
    )

    if existing_job is not None:
        return _job_read(existing_job)

    material.status = "pending"
    material.error_message = None
    job = Job(material_id=material.id, type="analyze", status="queued", attempts=0)
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_read(job)
