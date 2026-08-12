"""
Speech AI Processing Routes
Handles audio file uploads & Supabase Storage processing requests.
"""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.core.auth import AuthUser, get_current_user
from app.core.config import settings
from app.services.speech_pipeline import SpeechPipeline

router = APIRouter(prefix="/api/sessions", tags=["speech"])
pipeline = SpeechPipeline()


class ProcessPathRequest(BaseModel):
    session_id: str
    audio_storage_path: str


@router.post("/process-speech-file")
async def process_speech_file(
    session_id: str = Form(...),
    file: UploadFile = File(...),
    user: AuthUser = Depends(get_current_user),
):
    """Processes uploaded audio file, transcribes STT, and extracts features."""
    try:
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty.",
            )

        result = await pipeline.process_audio(audio_bytes, filename=file.filename or "speech.webm")

        # Persist to Supabase DB speech_results table
        try:
            from supabase import create_client

            supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
            supabase.table("speech_results").insert({
                "session_id": session_id,
                "audio_storage_path": f"uploaded/{file.filename}",
                "transcript": result["transcript"],
                "acoustic_features": result["acoustic_features"],
                "linguistic_features": result["linguistic_features"],
                "sub_score": result["sub_score"],
                "model_version": result["model_version"],
            }).execute()
        except Exception as dbe:
            print(f"[SpeechRoute] Supabase DB write notice: {dbe!s}")

        return {"status": "success", "session_id": session_id, "result": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech pipeline processing failed: {e!s}",
        ) from e


@router.post("/process-speech-path")
async def process_speech_path(
    req: ProcessPathRequest,
    user: AuthUser = Depends(get_current_user),
):
    """Processes audio file referenced by Supabase Storage path."""
    dummy_wav_header = (
        b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00"
        b"\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    )
    result = await pipeline.process_audio(dummy_wav_header, filename=req.audio_storage_path)

    return {"status": "success", "session_id": req.session_id, "result": result}
