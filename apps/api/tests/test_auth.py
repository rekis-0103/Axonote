from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import delete, select

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


def _mock_google_claims(sub: str, email: str, name: str = "Google User") -> dict[str, str]:
    return {"sub": sub, "email": email, "name": name}


def test_google_login_creates_user(monkeypatch) -> None:
    email = f"google-{uuid4().hex}@example.com"
    sub = f"google-sub-{uuid4().hex}"

    monkeypatch.setattr(
        "app.auth.verify_google_id_token",
        lambda _credential: _mock_google_claims(sub, email),
    )

    try:
        with TestClient(app) as client:
            res = client.post("/api/v1/auth/google", json={"credential": "fake-token"})
            assert res.status_code == 200
            body = res.json()
            assert body["user"]["email"] == email

            with SessionLocal() as db:
                user = db.scalar(select(User).where(User.email == email))
                assert user is not None
                assert user.auth_provider == "google"
                assert user.google_sub == sub
                assert user.password_hash is None
    finally:
        _delete_user(email)


def test_google_login_is_idempotent(monkeypatch) -> None:
    email = f"google-repeat-{uuid4().hex}@example.com"
    sub = f"google-sub-{uuid4().hex}"

    monkeypatch.setattr(
        "app.auth.verify_google_id_token",
        lambda _credential: _mock_google_claims(sub, email),
    )

    try:
        with TestClient(app) as client:
            first = client.post("/api/v1/auth/google", json={"credential": "fake-token"})
            second = client.post("/api/v1/auth/google", json={"credential": "fake-token"})
            assert first.status_code == 200
            assert second.status_code == 200
            assert first.json()["user"]["id"] == second.json()["user"]["id"]
    finally:
        _delete_user(email)


def test_google_login_links_existing_local_email(monkeypatch) -> None:
    email = f"link-{uuid4().hex}@example.com"
    sub = f"google-sub-{uuid4().hex}"
    password = "secure-password"

    try:
        with TestClient(app) as client:
            register_res = client.post(
                "/api/v1/auth/register",
                json={"name": "Local User", "email": email, "password": password},
            )
            assert register_res.status_code == 201
            local_user_id = register_res.json()["user"]["id"]

            monkeypatch.setattr(
                "app.auth.verify_google_id_token",
                lambda _credential: _mock_google_claims(sub, email, "Linked User"),
            )
            google_res = client.post("/api/v1/auth/google", json={"credential": "fake-token"})
            assert google_res.status_code == 200
            assert google_res.json()["user"]["id"] == local_user_id

            with SessionLocal() as db:
                user = db.scalar(select(User).where(User.email == email))
                assert user is not None
                assert user.google_sub == sub
                assert user.password_hash is not None
    finally:
        _delete_user(email)
