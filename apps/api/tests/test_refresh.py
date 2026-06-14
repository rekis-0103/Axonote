from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.db import SessionLocal
from app.main import app
from app.models import RefreshToken, User


def _cleanup(email: str) -> None:
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is not None:
            db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
            db.execute(delete(User).where(User.id == user.id))
            db.commit()


def test_refresh_rotates_token_and_logout_revokes() -> None:
    email = f"refresh-{uuid4().hex}@example.com"
    password = "secure-password"

    try:
        with TestClient(app) as client:
            register_res = client.post(
                "/api/v1/auth/register",
                json={"name": "Refresh User", "email": email, "password": password},
            )
            assert register_res.status_code == 201
            first_refresh = register_res.json()["refresh_token"]

            refresh_res = client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": first_refresh},
            )
            assert refresh_res.status_code == 200
            second_refresh = refresh_res.json()["refresh_token"]
            new_access = refresh_res.json()["access_token"]
            assert second_refresh != first_refresh

            me_res = client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {new_access}"},
            )
            assert me_res.status_code == 200

            logout_res = client.post(
                "/api/v1/auth/logout",
                json={"refresh_token": second_refresh},
            )
            assert logout_res.status_code == 204

            stale_res = client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": second_refresh},
            )
            assert stale_res.status_code == 401
    finally:
        _cleanup(email)
