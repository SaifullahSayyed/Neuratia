"""
Tests for JWT Authentication and Role-Based Access Control (RBAC).
"""

from fastapi.testclient import TestClient
from jose import jwt

from app.core.config import settings
from app.main import app

client = TestClient(app)

SECRET = settings.supabase_jwt_secret


def create_test_token(user_id: str = "test-user-123", email: str = "test@example.com", role: str = "patient") -> str:
    """Helper to generate a valid test JWT signed with SUPABASE_JWT_SECRET."""
    payload = {
        "sub": user_id,
        "email": email,
        "user_metadata": {"role": role},
        "aud": "authenticated",
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")


def test_auth_me_missing_token():
    """Unauthenticated request to protected route returns 401."""
    res = client.get("/api/auth/me")
    assert res.status_code == 401
    assert "missing" in res.json()["detail"].lower()


def test_auth_me_invalid_token():
    """Invalid token returns 401."""
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert res.status_code == 401


def test_auth_me_valid_patient_token():
    """Valid patient token returns patient details."""
    token = create_test_token(user_id="patient-1", email="patient@example.com", role="patient")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "patient-1"
    assert data["email"] == "patient@example.com"
    assert data["role"] == "patient"


def test_admin_route_denied_for_patient():
    """Patient role attempting to access admin route gets 403 Forbidden."""
    token = create_test_token(user_id="patient-1", role="patient")
    res = client.get("/api/admin/pending-links", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]


def test_admin_route_allowed_for_admin():
    """Admin role attempting to access admin route gets 200 OK."""
    token = create_test_token(user_id="admin-1", role="admin")
    res = client.get("/api/admin/pending-links", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "pending_links" in res.json()
