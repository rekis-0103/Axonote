"""Baseline schema — mirrors SQLAlchemy models.

For fresh installs, `alembic upgrade head` or `infra/mysql/init/002_app_schema.sql`.
"""

from collections.abc import Sequence

revision: str = "001_baseline"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Schema is created via SQLAlchemy metadata on API startup for dev/test.
    # This revision documents the baseline for teams using Alembic against MySQL.
    pass


def downgrade() -> None:
    pass
