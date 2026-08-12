"""
Gaze AI Processing Routes
Processes numeric gaze feature logs, applies calibration gating, and persists gaze results.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import AuthUser, get_current_user
from app.core.config import settings
from app.services.gaze_pipeline import GazePipeline

router = APIRouter(prefix="/api/sessions", tags=["gaze"])
pipeline = GazePipeline()


class ProcessGazeRequest(BaseModel):
    session_id: str
    calibration_quality: float = Field(ge=0.0)
    fixation_features: dict[str, Any]


@router.post("/process-gaze")
async def process_gaze(
    req: ProcessGazeRequest,
    user: AuthUser = Depends(get_current_user),
):
    """Processes numeric gaze metrics, evaluates calibration gating, and computes gaze sub-score."""
    try:
        result = pipeline.process_gaze(req.calibration_quality, req.fixation_features)

        # Persist to Supabase DB gaze_results table
        try:
            from supabase import create_client

            supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
            supabase.table("gaze_results").insert({
                "session_id": req.session_id,
                "calibration_quality": req.calibration_quality,
                "fixation_features": result["metrics"],
                "sub_score": result["sub_score"],
                "model_version": result["model_version"],
            }).execute()
        except Exception as dbe:
            print(f"[GazeRoute] Supabase DB write notice: {dbe!s}")

        return {"status": "success", "session_id": req.session_id, "result": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gaze processing failed: {e!s}",
        ) from e
