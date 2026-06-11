from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.config import get_settings
from app.db import SessionLocal
from app.main import app
from app.models import Material, User


def _register_and_token(client: TestClient) -> tuple[str, str]:
    email = f"upload-{uuid4().hex}@example.com"
    res = client.post(
        "/api/v1/auth/register",
        json={"name": "Upload User", "email": email, "password": "secure-password"},
    )
    assert res.status_code == 201
    return email, res.json()["access_token"]


def _cleanup(email: str) -> None:
    upload_path = get_settings().upload_path
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is not None:
            materials = db.scalars(select(Material).where(Material.user_id == user.id)).all()
            for material in materials:
                (upload_path / material.stored_name).unlink(missing_ok=True)
            db.execute(delete(User).where(User.id == user.id))
            db.commit()


def test_upload_and_list_materials(tmp_path) -> None:
    get_settings().upload_dir = str(tmp_path)

    with TestClient(app) as client:
        email, token = _register_and_token(client)

        try:
            upload_res = client.post(
                "/api/v1/materials",
                headers={"Authorization": f"Bearer {token}"},
                data={"title": "Biology notes"},
                files={
                    "file": (
                        "biology.pdf",
                        b"%PDF-1.4\n% Axonote test file\n",
                        "application/pdf",
                    )
                },
            )
            assert upload_res.status_code == 201
            body = upload_res.json()
            assert body["title"] == "Biology notes"
            assert body["original_name"] == "biology.pdf"
            assert body["status"] == "pending"

            list_res = client.get(
                "/api/v1/materials",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert list_res.status_code == 200
            assert list_res.json()["total"] == 1
            assert list_res.json()["items"][0]["title"] == "Biology notes"

            material_id = body["id"]
            detail_res = client.get(
                f"/api/v1/materials/{material_id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert detail_res.status_code == 200
            assert detail_res.json()["id"] == material_id

            analyze_res = client.post(
                f"/api/v1/materials/{material_id}/analyze",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert analyze_res.status_code == 202
            assert analyze_res.json()["status"] == "queued"
            job_id = analyze_res.json()["id"]

            job_res = client.get(
                f"/api/v1/jobs/{job_id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert job_res.status_code == 200
            assert job_res.json()["material_id"] == material_id
        finally:
            _cleanup(email)


def test_upload_rejects_wrong_file_type(tmp_path) -> None:
    get_settings().upload_dir = str(tmp_path)

    with TestClient(app) as client:
        email, token = _register_and_token(client)

        try:
            res = client.post(
                "/api/v1/materials",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": ("notes.txt", b"plain text", "text/plain")},
            )
            assert res.status_code == 400
        finally:
            _cleanup(email)
