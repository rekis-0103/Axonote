from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if "@" not in email or "." not in email.rsplit("@", maxsplit=1)[-1]:
            raise ValueError("Enter a valid email address.")
        return email


class UserLogin(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UserRead(BaseModel):
    id: int
    name: str
    email: str


class GoogleLoginRequest(BaseModel):
    credential: str = Field(min_length=10)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    user: UserRead


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=10)


class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LogoutRequest(BaseModel):
    refresh_token: str = Field(min_length=10)


class SummaryRead(BaseModel):
    material_id: int
    content: str
    keywords: list[str]
    created_at: datetime


class QuestionPublic(BaseModel):
    id: int
    type: str
    stem: str
    options: list[str]


class QuestionSetRead(BaseModel):
    question_set_id: int
    questions: list[QuestionPublic]


class AttemptAnswerInput(BaseModel):
    question_id: int
    chosen_index: int = Field(ge=0)


class AttemptSubmitRequest(BaseModel):
    answers: list[AttemptAnswerInput]


class AttemptResultItem(BaseModel):
    question_id: int
    chosen_index: int
    correct_index: int
    is_correct: bool
    explanation: str | None = None


class AttemptSubmitResponse(BaseModel):
    attempt_id: int
    score: int
    total: int
    results: list[AttemptResultItem]


class AttemptHistoryItem(BaseModel):
    attempt_id: int
    score: int
    total: int
    started_at: datetime
    finished_at: datetime | None = None


class AttemptHistoryResponse(BaseModel):
    items: list[AttemptHistoryItem]


class MaterialRead(BaseModel):
    id: int
    title: str
    original_name: str
    mime_type: str
    size_bytes: int
    status: str
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime


class MaterialListResponse(BaseModel):
    items: list[MaterialRead]
    total: int


class JobRead(BaseModel):
    id: int
    material_id: int
    type: str
    status: str
    error_message: str | None = None
    created_at: datetime
    finished_at: datetime | None = None
