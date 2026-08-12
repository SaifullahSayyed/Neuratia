"""
Assessment Sessions API Routes
Handles session lifecycle, consent recording, and storing raw/fused modality payloads.
All routes require a verified Supabase JWT token.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import AuthUser, get_current_user
from app.core.config import settings

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class StartSessionRequest(BaseModel):
    consent_given: bool = True
    age: int | None = Field(default=None, ge=18, le=120)
    education_level: str | None = None


class CognitiveResultSubmission(BaseModel):
    session_id: str
    game_type: str  # 'digit_span' | 'sequence_memory'
    raw_events: list[dict[str, Any]] | dict[str, Any]
    age_band: str
    education_band: str
    sub_score: float = Field(ge=0.0, le=1.0)


class SpeechSubmission(BaseModel):
    session_id: str
    audio_storage_path: str
    transcript: str | None = None
    metadata: dict[str, Any] | None = None


class GazeSubmission(BaseModel):
    session_id: str
    calibration_quality: float  # residual error in pixels
    fixation_features: dict[str, Any]  # fixation stability, pursuit latency, antisaccade error rate
    sub_score: float = Field(ge=0.0, le=1.0)
    model_version: str = "gaze_client_v1"


@router.post("/start")
async def start_session(
    req: StartSessionRequest,
    user: AuthUser = Depends(get_current_user),
):
    """Starts an assessment session, persisting consent and demographic metadata."""
    if not req.consent_given:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session cannot be started without explicit consent.",
        )

    try:
        from supabase import create_client

        supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
        res = (
            supabase.table("assessment_sessions")
            .insert({
                "patient_id": user.id,
                "consent_given": req.consent_given,
                "user_age_at_session": req.age,
                "user_education_at_session": req.education_level,
                "status": "in_progress",
            })
            .execute()
        )
        session_data = res.data[0] if res.data else {"id": "mock-session-id", "patient_id": user.id}
        return {"status": "success", "session": session_data}
    except Exception as e:
        # Fallback response for dev environment testing without live Supabase DB
        return {
            "status": "success",
            "session": {
                "id": "mock-session-id",
                "patient_id": user.id,
                "consent_given": req.consent_given,
                "status": "in_progress",
            },
            "note": f"Dev mode fallback: {e!s}",
        }


@router.post("/cognitive")
async def submit_cognitive_result(
    req: CognitiveResultSubmission,
    user: AuthUser = Depends(get_current_user),
):
    """Submits cognitive game results (digit span / sequence memory) with normed score."""
    try:
        from supabase import create_client

        supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
        res = (
            supabase.table("cognitive_game_results")
            .insert({
                "session_id": req.session_id,
                "game_type": req.game_type,
                "raw_events": req.raw_events,
                "age_band": req.age_band,
                "education_band": req.education_band,
                "sub_score": req.sub_score,
            })
            .execute()
        )
        return {"status": "success", "data": res.data}
    except Exception as e:
        return {
            "status": "success",
            "data": [req.model_dump()],
            "note": f"Dev mode fallback: {e!s}",
        }


@router.post("/speech")
async def submit_speech_result(
    req: SpeechSubmission,
    user: AuthUser = Depends(get_current_user),
):
    """Submits audio recording reference path in Supabase Storage."""
    try:
        from supabase import create_client

        supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
        res = (
            supabase.table("speech_results")
            .insert({
                "session_id": req.session_id,
                "audio_storage_path": req.audio_storage_path,
                "transcript": req.transcript,
                "model_version": "demo_untrained",
            })
            .execute()
        )
        return {"status": "success", "data": res.data}
    except Exception as e:
        return {
            "status": "success",
            "data": [req.model_dump()],
            "note": f"Dev mode fallback: {e!s}",
        }


@router.post("/gaze")
async def submit_gaze_result(
    req: GazeSubmission,
    user: AuthUser = Depends(get_current_user),
):
    """Submits client-extracted numeric gaze features (fixation, pursuit, antisaccade)."""
    try:
        from supabase import create_client

        supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
        res = (
            supabase.table("gaze_results")
            .insert({
                "session_id": req.session_id,
                "calibration_quality": req.calibration_quality,
                "fixation_features": req.fixation_features,
                "sub_score": req.sub_score,
                "model_version": req.model_version,
            })
            .execute()
        )
        return {"status": "success", "data": res.data}
    except Exception as e:
        return {
            "status": "success",
            "data": [req.model_dump()],
            "note": f"Dev mode fallback: {e!s}",
        }


@router.get("/my-sessions")
async def get_my_sessions(user: AuthUser = Depends(get_current_user)):
    """Fetches assessment sessions for current patient."""
    try:
        from supabase import create_client

        supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
        res = (
            supabase.table("assessment_sessions")
            .select("*")
            .eq("patient_id", user.id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"sessions": res.data}
    except Exception as e:
        return {"sessions": [], "note": f"Dev mode fallback: {e!s}"}
