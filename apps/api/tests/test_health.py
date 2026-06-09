from fastapi.testclient import TestClient

from app.main import app


def test_health() -> None:
    with TestClient(app) as client:
        res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_ping() -> None:
    with TestClient(app) as client:
        res = client.get("/api/v1/ping")
    assert res.status_code == 200
    assert res.json() == {"message": "pong"}
