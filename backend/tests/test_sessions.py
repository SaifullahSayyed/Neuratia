"""
Tests for Session endpoints & modality submissions.
"""

from fastapi.testclient import TestClient
from jose import jwt

from app.core.config import settings
from app.main import app

client = TestClient(app)

SECRET = settings.supabase_jwt_secret


def create_test_token(user_id: str = "patient-123", email: str = "patient@example.com") -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "user_metadata": {"role": "patient"},
        "aud": "authenticated",
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")


def test_start_session_unauthenticated():
    res = client.post("/api/sessions/start", json={"consent_given": True})
    assert res.status_code == 401


def test_start_session_no_consent():
    token = create_test_token()
    res = client.post(
        "/api/sessions/start",
        json={"consent_given": False},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400


def test_start_session_success():
    token = create_test_token()
    res = client.post(
        "/api/sessions/start",
        json={"consent_given": True, "age": 65, "education_level": "undergraduate"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    assert "session" in res.json()


def test_submit_gaze_result_numeric_only():
    """Gaze submission must succeed with numeric fixation features — zero raw video."""
    token = create_test_token()
    payload = {
        "session_id": "mock-session-123",
        "calibration_quality": 4.2,
        "fixation_features": {
            "fixation_dispersion_px": 12.4,
            "saccade_latency_ms": 210,
            "antisaccade_error_rate": 0.15,
        },
        "sub_score": 0.85,
        "model_version": "gaze_client_v1",
    }
    res = client.post(
        "/api/sessions/gaze",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "success"
