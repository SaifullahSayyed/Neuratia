"""
Health check route — intentionally public (no auth required).
Used for:
  - Phase 0 smoke test (green/red dot in the React UI)
  - Render uptime verification
  - GitHub Actions keep-alive ping (Phase 8)
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/api/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
