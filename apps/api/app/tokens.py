from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import RefreshToken, User
from app.security import (
    create_access_token,
    create_refresh_token_value,
    hash_refresh_token,
    refresh_token_expiry,
)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def issue_token_pair(db: Session, user: User) -> tuple[str, str]:
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token_value()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(refresh_token),
            expires_at=refresh_token_expiry(),
        )
    )
    db.flush()
    return access_token, refresh_token


def revoke_refresh_token(db: Session, refresh_token: str) -> None:
    token_hash = hash_refresh_token(refresh_token)
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    if stored is not None and stored.revoked_at is None:
        stored.revoked_at = _utc_now()


def rotate_refresh_token(db: Session, refresh_token: str) -> tuple[str, str, User]:
    token_hash = hash_refresh_token(refresh_token)
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    if stored is None:
        raise ValueError("invalid_refresh_token")

    now = _utc_now()
    if stored.revoked_at is not None or _as_utc(stored.expires_at) < now:
        raise ValueError("invalid_refresh_token")

    user = db.get(User, stored.user_id)
    if user is None:
        raise ValueError("invalid_refresh_token")

    stored.revoked_at = now
    access_token, new_refresh = issue_token_pair(db, user)
    return access_token, new_refresh, user
