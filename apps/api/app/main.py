from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Axonote API", version="0.1.0", openapi_url="/api/v1/openapi.json")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["meta"])
    def health() -> dict:
        return {"status": "ok", "service": "axonote-api"}

    @app.get("/api/v1/ping", tags=["meta"])
    def ping() -> dict:
        return {"message": "pong"}

    return app


app = create_app()
