"""
Reports API Route

POST /api/sessions/generate-report
  - Accepts a fusion_result payload (from /api/sessions/fuse)
  - Retrieves relevant RAG chunks (TF-IDF over reference corpus)
  - Calls Gemini 1.5 Flash to generate a clinical summary (template fallback if key is placeholder)
  - Persists the report text to fused_reports table
  - Returns structured report with citations, rag_chunks, and is_demo_mode flag
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import AuthUser, get_current_user
from app.core.config import settings
from app.services.report_generator import generate_report

router = APIRouter(prefix="/api/sessions", tags=["reports"])


class GenerateReportRequest(BaseModel):
    session_id: str
    fusion_result: dict[str, Any] = Field(
        description="The full dict returned by POST /api/sessions/fuse"
    )


@router.post("/generate-report")
async def generate_session_report(
    req: GenerateReportRequest,
    user: AuthUser = Depends(get_current_user),
):
    """
    Generates a RAG-augmented LLM clinical summary for the session's fusion result.
    Falls back to a structured template report if Gemini API key is a placeholder.
    """
    if not req.fusion_result.get("composite_score") and req.fusion_result.get(
        "risk_band"
    ) == "insufficient_data":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Fusion result has insufficient data to generate a report.",
        )

    try:
        result = generate_report(req.fusion_result)

        # Persist report text to fused_reports table (non-fatal)
        try:
            from supabase import create_client

            sb = create_client(settings.supabase_url, settings.supabase_service_role_key)
            sb.table("fused_reports").update({
                "report_text": result["report_text"],
                "report_model": result["model"],
            }).eq("session_id", req.session_id).execute()
        except Exception as dbe:
            print(f"[ReportRoute] Supabase DB write notice: {dbe!s}")

        return {
            "status": "success",
            "session_id": req.session_id,
            "result": result,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {e!s}",
        ) from e
