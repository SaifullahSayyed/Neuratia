"""
Fusion API Route — Multimodal composite score endpoint.

POST /api/sessions/fuse
  - Accepts optional sub-scores for speech, gaze, and cognitive modalities.
  - Redistributes weights for missing modalities.
  - Persists composite score and contributions to fused_reports table.
  - Returns composite score, risk band, per-modality contributions, citations.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import AuthUser, get_current_user
from app.core.config import settings
from app.services.fusion import fuse_scores

router = APIRouter(prefix="/api/sessions", tags=["fusion"])


class FuseRequest(BaseModel):
    session_id: str = Field(max_length=64)
    speech_score: float | None = Field(default=None, ge=0.0, le=1.0)
    gaze_score: float | None = Field(default=None, ge=0.0, le=1.0)
    cognitive_score: float | None = Field(default=None, ge=0.0, le=1.0)


@router.post("/fuse")
async def fuse_session(
    req: FuseRequest,
    user: Annotated[AuthUser, Depends(get_current_user)],
):
    """
    Fuses modality sub-scores into a composite risk score and saves to DB.
    Missing modalities cause their weights to be redistributed proportionally.
    """
    if all(s is None for s in [req.speech_score, req.gaze_score, req.cognitive_score]):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one modality sub-score must be provided.",
        )

    result = fuse_scores(req.speech_score, req.gaze_score, req.cognitive_score)

    # Persist to Supabase fused_reports table
    try:
        from supabase import create_client

        sb = create_client(settings.supabase_url, settings.supabase_service_role_key)
        sb.table("fused_reports").insert({
            "session_id": req.session_id,
            "composite_score": result["composite_score"],
            "risk_band": result["risk_band"],
            "modality_contributions": result["modality_contributions"],
            "weights_applied": result["weights_applied"],
            "model_version": "fusion_literature_v1",
        }).execute()
    except Exception as dbe:
        # Non-fatal: DB persistence failure must not block score return
        print(f"[FusionRoute] Supabase DB write notice: {dbe!s}")

    return {"status": "success", "session_id": req.session_id, "result": result}
