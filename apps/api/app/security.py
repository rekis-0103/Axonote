import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.config import get_settings

_GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 210_000)
    return f"pbkdf2_sha256${_b64url_encode(salt)}${_b64url_encode(digest)}"


def verify_password(password: str, password_hash: str | None) -> bool:
    if password_hash is None:
        return False
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


def verify_google_id_token(credential: str) -> dict[str, str]:
    """Verify a Google Identity Services ID token and return trusted claims."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid Google credential.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Sign-In is not configured.",
        )

    try:
        idinfo = google_id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.google_client_id,
            clock_skew_in_seconds=settings.google_clock_skew_seconds,
        )
    except ValueError as exc:
        # TODO: remove debug logging once Google login is confirmed working.
        print(f"[google-auth-debug] verify failed: {exc}")
        raise credentials_error from exc

    issuer = idinfo.get("iss")
    if issuer not in _GOOGLE_ISSUERS:
        raise credentials_error

    if idinfo.get("email_verified") is not True:
        raise credentials_error

    sub = idinfo.get("sub")
    email = idinfo.get("email")
    if not sub or not email:
        raise credentials_error

    name = idinfo.get("name") or email.split("@", maxsplit=1)[0]
    return {
        "sub": str(sub),
        "email": str(email).strip().lower(),
        "name": str(name).strip()[:120],
    }
