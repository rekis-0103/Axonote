from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.db import SessionLocal
from app.main import app
from app.models import Material, Question, QuestionSet, Summary, User


def _register(client: TestClient) -> tuple[str, str, str]:
    email = f"quiz-{uuid4().hex}@example.com"
    res = client.post(
        "/api/v1/auth/register",
        json={"name": "Quiz User", "email": email, "password": "secure-password"},
    )
    assert res.status_code == 201
    body = res.json()
    return email, body["access_token"], body["refresh_token"]


def _cleanup(email: str) -> None:
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is not None:
            db.execute(delete(User).where(User.id == user.id))
            db.commit()


def _seed_ready_material(user_id: int) -> tuple[int, int]:
    with SessionLocal() as db:
        material = Material(
            user_id=user_id,
            title="Seeded material",
            original_name="seed.docx",
            stored_name="seed.docx",
            mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            size_bytes=100,
            status="ready",
        )
        db.add(material)
        db.flush()

        db.add(
            Summary(
                material_id=material.id,
                content="Machine learning learns patterns from data.",
                keywords=["machine", "learning", "data"],
            )
        )

        question_set = QuestionSet(material_id=material.id)
        db.add(question_set)
        db.flush()

        db.add(
            Question(
                question_set_id=question_set.id,
                type="mcq",
                stem="Fill in the blank: _____ learns from data.",
                options={"items": ["Machine learning", "Water", "Stone", "Glass"]},
                correct_index=0,
                explanation="Machine learning is the correct term.",
            )
        )
        db.commit()
        return material.id, question_set.id


def test_question_set_hides_answers_until_attempt() -> None:
    email = f"quiz-hide-{uuid4().hex}@example.com"
    try:
        with TestClient(app) as client:
            res = client.post(
                "/api/v1/auth/register",
                json={"name": "Quiz User", "email": email, "password": "secure-password"},
            )
            assert res.status_code == 201
            token = res.json()["access_token"]
            with SessionLocal() as db:
                user = db.scalar(select(User).where(User.email == email))
                assert user is not None
                material_id, question_set_id = _seed_ready_material(user.id)

            headers = {"Authorization": f"Bearer {token}"}
            summary_res = client.get(f"/api/v1/materials/{material_id}/summary", headers=headers)
            assert summary_res.status_code == 200
            assert "Machine learning" in summary_res.json()["content"]

            qs_res = client.get(f"/api/v1/materials/{material_id}/question-set", headers=headers)
            assert qs_res.status_code == 200
            body = qs_res.json()
            assert body["question_set_id"] == question_set_id
            question = body["questions"][0]
            assert "correct_index" not in question
            assert "explanation" not in question

            attempt_res = client.post(
                f"/api/v1/question-sets/{question_set_id}/attempts",
                headers=headers,
                json={"answers": [{"question_id": question["id"], "chosen_index": 0}]},
            )
            assert attempt_res.status_code == 201
            result = attempt_res.json()
            assert result["score"] == 1
            assert result["results"][0]["correct_index"] == 0
            assert result["results"][0]["explanation"]

            history_res = client.get(
                f"/api/v1/question-sets/{question_set_id}/attempts",
                headers=headers,
            )
            assert history_res.status_code == 200
            assert history_res.json()["items"][0]["score"] == 1
    finally:
        _cleanup(email)

