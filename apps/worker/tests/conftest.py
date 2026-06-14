import os

# Tests use in-memory SQLite unless DATABASE_URL is set in the environment.
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
