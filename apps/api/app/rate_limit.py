import time
from collections import defaultdict

from fastapi import HTTPException, Request, status


class RateLimiter:
    """Simple in-memory sliding-window rate limiter."""

    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str) -> None:
        now = time.monotonic()
        window_start = now - self.window_seconds
        hits = [stamp for stamp in self._hits[key] if stamp > window_start]
        if len(hits) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )
        hits.append(now)
        self._hits[key] = hits


AUTH_LIMITER = RateLimiter(max_requests=20, window_seconds=60)
UPLOAD_LIMITER = RateLimiter(max_requests=10, window_seconds=60)
ANALYZE_LIMITER = RateLimiter(max_requests=10, window_seconds=60)


def client_key(request: Request) -> str:
    if request.client is None:
        return "unknown"
    return request.client.host


def limit_auth(request: Request) -> None:
    AUTH_LIMITER.check(client_key(request))


def limit_upload(request: Request) -> None:
    UPLOAD_LIMITER.check(client_key(request))


def limit_analyze(request: Request) -> None:
    ANALYZE_LIMITER.check(client_key(request))
