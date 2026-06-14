from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import AttemptAnswer, Material, Question, QuestionSet, QuizAttempt, User
from app.schemas import (
    AttemptHistoryItem,
    AttemptHistoryResponse,
    AttemptResultItem,
    AttemptSubmitRequest,
    AttemptSubmitResponse,
)

router = APIRouter(prefix="/api/v1/question-sets", tags=["quiz"])
DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def _get_owned_question_set(question_set_id: int, current_user: User, db: Session) -> QuestionSet:
    question_set = db.scalar(
        select(QuestionSet)
        .join(Material, Material.id == QuestionSet.material_id)
        .where(QuestionSet.id == question_set_id, Material.user_id == current_user.id)
    )
    if question_set is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question set not found.")
    return question_set


@router.post(
    "/{question_set_id}/attempts",
    response_model=AttemptSubmitResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_attempt(
    question_set_id: int,
    payload: AttemptSubmitRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> AttemptSubmitResponse:
    question_set = _get_owned_question_set(question_set_id, current_user, db)
    questions = db.scalars(
        select(Question).where(Question.question_set_id == question_set.id)
    ).all()
    question_map = {question.id: question for question in questions}

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No questions available.",
        )

    if len(payload.answers) != len(questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All questions must be answered.",
        )

    score = 0
    results: list[AttemptResultItem] = []
    answer_rows: list[AttemptAnswer] = []

    for answer in payload.answers:
        question = question_map.get(answer.question_id)
        if question is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid question id.",
            )

        options = question.options.get("items", []) if isinstance(question.options, dict) else []
        if answer.chosen_index < 0 or answer.chosen_index >= len(options):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid chosen index.",
            )

        is_correct = answer.chosen_index == question.correct_index
        if is_correct:
            score += 1

        results.append(
            AttemptResultItem(
                question_id=question.id,
                chosen_index=answer.chosen_index,
                correct_index=question.correct_index,
                is_correct=is_correct,
                explanation=question.explanation,
            )
        )
        answer_rows.append(
            AttemptAnswer(
                question_id=question.id,
                chosen_index=answer.chosen_index,
                is_correct=is_correct,
            )
        )

    attempt = QuizAttempt(
        question_set_id=question_set.id,
        user_id=current_user.id,
        score=score,
        total=len(questions),
        finished_at=datetime.now(timezone.utc),
    )
    db.add(attempt)
    db.flush()

    for row in answer_rows:
        row.attempt_id = attempt.id
        db.add(row)

    db.commit()

    return AttemptSubmitResponse(
        attempt_id=attempt.id,
        score=score,
        total=len(questions),
        results=results,
    )


@router.get("/{question_set_id}/attempts", response_model=AttemptHistoryResponse)
def list_attempts(
    question_set_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> AttemptHistoryResponse:
    question_set = _get_owned_question_set(question_set_id, current_user, db)
    attempts = db.scalars(
        select(QuizAttempt)
        .where(
            QuizAttempt.question_set_id == question_set.id,
            QuizAttempt.user_id == current_user.id,
        )
        .order_by(desc(QuizAttempt.started_at), desc(QuizAttempt.id))
    ).all()

    return AttemptHistoryResponse(
        items=[
            AttemptHistoryItem(
                attempt_id=attempt.id,
                score=attempt.score,
                total=attempt.total,
                started_at=attempt.started_at,
                finished_at=attempt.finished_at,
            )
            for attempt in attempts
        ]
    )
