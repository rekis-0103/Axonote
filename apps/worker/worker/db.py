from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from worker.config import get_settings


class Base(DeclarativeBase):
    pass


def _connect_args() -> dict[str, bool]:
    if get_settings().database_url.startswith("sqlite"):
        return {"check_same_thread": False}
    return {}


def _engine_kwargs() -> dict[str, object]:
    if get_settings().database_url == "sqlite:///:memory:":
        return {"poolclass": StaticPool}
    return {}


engine = create_engine(
    get_settings().database_url,
    connect_args=_connect_args(),
    **_engine_kwargs(),
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db() -> None:
    from worker import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
