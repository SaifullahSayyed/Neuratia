"""
Auth & RBAC Routes
Protected endpoints for identity inspection and admin link approvals.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import AuthUser, get_current_user, require_role
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["auth"])


class ApproveLinkRequest(BaseModel):
    doctor_id: str
    patient_id: str
    approve: bool = True


@router.get("/auth/me")
async def get_my_profile(user: AuthUser = Depends(get_current_user)):
    """Returns the authenticated user's verified token information."""
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
    }


@router.get("/admin/pending-links")
async def list_pending_links(admin: AuthUser = Depends(require_role(["admin"]))):
    """Admin endpoint: lists doctor-patient links awaiting approval."""
    try:
        from supabase import create_client

        supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
        res = (
            supabase.table("doctor_patient_links")
            .select("*")
            .eq("approved_by_admin", False)
            .execute()
        )
        return {"pending_links": res.data}
    except Exception as e:
        return {"pending_links": [], "note": f"Supabase query skipped or errored: {e!s}"}


@router.post("/admin/approve-link")
async def approve_doctor_patient_link(
    req: ApproveLinkRequest,
    admin: AuthUser = Depends(require_role(["admin"])),
):
    """Admin endpoint: approves or rejects a doctor-patient link."""
    try:
        from supabase import create_client

        supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
        if req.approve:
            res = (
                supabase.table("doctor_patient_links")
                .update({"approved_by_admin": True})
                .eq("doctor_id", req.doctor_id)
                .eq("patient_id", req.patient_id)
                .execute()
            )
        else:
            res = (
                supabase.table("doctor_patient_links")
                .delete()
                .eq("doctor_id", req.doctor_id)
                .eq("patient_id", req.patient_id)
                .execute()
            )
        return {"status": "success", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update link: {e!s}") from e
