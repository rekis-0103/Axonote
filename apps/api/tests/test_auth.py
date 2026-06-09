from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.db import SessionLocal
from app.main import app
from app.models import User


def _delete_user(email: str) -> None:
    with SessionLocal() as db:
        db.execute(delete(User).where(User.email == email))
        db.commit()


def test_register_login_and_me() -> None:
    email = f"student-{uuid4().hex}@example.com"
    password = "secure-password"

    try:
        with TestClient(app) as client:
            register_res = client.post(
                "/api/v1/auth/register",
                json={"name": "Student", "email": email, "password": password},
            )
            assert register_res.status_code == 201

            login_res = client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": password},
            )
            assert login_res.status_code == 200
            token = login_res.json()["access_token"]

            me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
            assert me_res.status_code == 200
            assert me_res.json()["email"] == email
    finally:
        _delete_user(email)


def test_login_rejects_wrong_password() -> None:
    email = f"wrong-password-{uuid4().hex}@example.com"

    try:
        with TestClient(app) as client:
            client.post(
                "/api/v1/auth/register",
                json={
                    "name": "Student",
                    "email": email,
                    "password": "secure-password",
                },
            )
            res = client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": "wrong-password"},
            )
        assert res.status_code == 401
    finally:
        _delete_user(email)
