from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.rate_limit import limit_auth
from app.schemas import (
    GoogleLoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserRead,
)
from app.security import (
    hash_password,
    verify_access_token,
    verify_google_id_token,
    verify_password,
)
from app.tokens import issue_token_pair, revoke_refresh_token, rotate_refresh_token

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)
DbSession = Annotated[Session, Depends(get_db)]
BearerCredentials = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]


def _user_read(user: User) -> UserRead:
    return UserRead(id=user.id, name=user.display_name, email=user.email)


def _token_response(db: Session, user: User) -> TokenResponse:
    access_token, refresh_token = issue_token_pair(db, user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_user_read(user),
    )


def get_current_user(
    credentials: BearerCredentials,
    db: DbSession,
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = verify_access_token(credentials.credentials)
    user = db.get(User, int(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, request: Request, db: DbSession) -> TokenResponse:
    limit_auth(request)
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already used.")

    user = User(
        display_name=payload.name.strip(),
        email=payload.email,
        password_hash=hash_password(payload.password),
        auth_provider="local",
    )
    db.add(user)
    db.flush()
    response = _token_response(db, user)
    db.commit()
    return response


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, request: Request, db: DbSession) -> TokenResponse:
    limit_auth(request)
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    response = _token_response(db, user)
    db.commit()
    return response


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, request: Request, db: DbSession) -> TokenResponse:
    limit_auth(request)
    claims = verify_google_id_token(payload.credential)

    user = db.scalar(select(User).where(User.google_sub == claims["sub"]))
    if user is None:
        user = db.scalar(select(User).where(User.email == claims["email"]))
        if user is not None:
            if user.google_sub and user.google_sub != claims["sub"]:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email is already linked to another Google account.",
                )
            user.google_sub = claims["sub"]
            if not user.display_name:
                user.display_name = claims["name"]
        else:
            user = User(
                display_name=claims["name"],
                email=claims["email"],
                password_hash=None,
                auth_provider="google",
                google_sub=claims["sub"],
            )
            db.add(user)
        db.flush()
    else:
        db.flush()

    response = _token_response(db, user)
    db.commit()
    return response


@router.post("/refresh", response_model=RefreshTokenResponse)
def refresh_tokens(
    payload: RefreshTokenRequest, request: Request, db: DbSession,
) -> RefreshTokenResponse:
    limit_auth(request)
    try:
        access_token, refresh_token, _ = rotate_refresh_token(db, payload.refresh_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        ) from None
    db.commit()
    return RefreshTokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: LogoutRequest, request: Request, db: DbSession) -> Response:
    limit_auth(request)
    revoke_refresh_token(db, payload.refresh_token)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserRead)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> UserRead:
    return _user_read(current_user)
