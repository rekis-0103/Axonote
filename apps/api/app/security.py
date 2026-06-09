import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.config import get_settings


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 210_000)
    return f"pbkdf2_sha256${_b64url_encode(salt)}${_b64url_encode(digest)}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, salt_value, digest_value = password_hash.split("$", maxsplit=2)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False

    salt = _b64url_decode(salt_value)
    expected = _b64url_decode(digest_value)
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 210_000)
    return hmac.compare_digest(actual, expected)


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {"sub": subject, "exp": int(expires_at.timestamp())}
    signing_input = ".".join(
        [
            _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8")),
            _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8")),
        ]
    )
    signature = hmac.new(
        settings.jwt_secret.encode("utf-8"), signing_input.encode("ascii"), hashlib.sha256
    ).digest()
    return f"{signing_input}.{_b64url_encode(signature)}"


def verify_access_token(token: str) -> str:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        header_value, payload_value, signature_value = token.split(".", maxsplit=2)
    except ValueError as exc:
        raise credentials_error from exc

    signing_input = f"{header_value}.{payload_value}"
    expected = hmac.new(
        get_settings().jwt_secret.encode("utf-8"), signing_input.encode("ascii"), hashlib.sha256
    ).digest()
    if not hmac.compare_digest(_b64url_decode(signature_value), expected):
        raise credentials_error

    try:
        payload = json.loads(_b64url_decode(payload_value))
        subject = str(payload["sub"])
        expires_at = int(payload["exp"])
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise credentials_error from exc

    if expires_at < int(datetime.now(timezone.utc).timestamp()):
        raise credentials_error
    return subject
