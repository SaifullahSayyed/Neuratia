"""
CogniDetect FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.fusion import router as fusion_router
from app.api.routes.gaze import router as gaze_router
from app.api.routes.health import router as health_router
from app.api.routes.reports import router as reports_router
from app.api.routes.sessions import router as sessions_router
from app.api.routes.speech import router as speech_router
from app.core.config import settings
from app.core.rate_limit import RateLimitMiddleware
from app.core.security import SecurityHeadersMiddleware

app = FastAPI(
    title="CogniDetect API",
    description=(
        "Backend for the CogniDetect early cognitive-decline screening app. "
        "This is a research prototype — not a certified medical device."
    ),
    version="0.1.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

origins = (
    ["*"]
    if settings.environment in ("dev", "test")
    else [
        "https://cognidetect.vercel.app",
        "https://neuratia.vercel.app",
    ]
)

app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware, is_production=settings.is_production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(speech_router)
app.include_router(gaze_router)
app.include_router(fusion_router)
app.include_router(reports_router)


@app.get("/", include_in_schema=False)
async def root() -> dict[str, str]:
    return {"message": "CogniDetect API — see /docs for endpoints"}
