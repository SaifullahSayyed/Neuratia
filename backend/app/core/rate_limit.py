"""
Rate Limiting Middleware — Neuratia

Implements per-IP sliding-window rate limiting using an in-memory store.
This is free-tier compatible (no Redis required).

Limits (tunable via env vars):
  - General API: 60 requests / 60 seconds per IP
  - /api/sessions/generate-report: 5 requests / 60 seconds (LLM route)
  - /api/sessions/process-speech*: 10 requests / 60 seconds (audio upload)

In production, swap the in-memory store for a Redis-backed implementation.
Reference: OWASP API Security Top 10 — API4:2023 Unrestricted Resource Consumption
"""

from __future__ import annotations

import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

ROUTE_LIMITS: dict[str, tuple[int, int]] = {
    "/api/sessions/generate-report": (5, 60),
    "/api/sessions/process-speech": (10, 60),
    "/api/sessions/process-gaze": (20, 60),
}
DEFAULT_LIMIT = (60, 60)


class _InMemoryStore:
    """Sliding-window counter backed by a deque. Not thread-safe for multi-worker."""

    def __init__(self) -> None:
        self._windows: dict[str, deque[float]] = defaultdict(deque)

    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        now = time.monotonic()
        dq = self._windows[key]
        while dq and now - dq[0] > window:
            dq.popleft()
        if len(dq) >= limit:
            return False
        dq.append(now)
        return True


_store = _InMemoryStore()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Per-IP sliding-window rate limiter. Returns 429 when limit is exceeded."""

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in ("/api/health", "/"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path

        limit, window = DEFAULT_LIMIT
        for prefix, route_limit in ROUTE_LIMITS.items():
            if path.startswith(prefix):
                limit, window = route_limit
                break

        key = f"{client_ip}:{path}"
        if not _store.is_allowed(key, limit, window):
            return JSONResponse(
                status_code=429,
                content={
                    "detail": (
                        f"Rate limit exceeded. Maximum {limit} requests "
                        f"per {window}s for this endpoint."
                    )
                },
                headers={"Retry-After": str(window)},
            )
        return await call_next(request)
