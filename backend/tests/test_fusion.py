"""
Tests for Multimodal Fusion service and API route.
"""

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.core.config import settings
from app.main import app
from app.services.fusion import BASE_WEIGHTS, fuse_scores

client = TestClient(app)
SECRET = settings.supabase_jwt_secret


def create_test_token() -> str:
    payload = {
        "sub": "fusion-patient-999",
        "email": "patient@example.com",
        "user_metadata": {"role": "patient"},
        "aud": "authenticated",
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")



def test_fuse_all_modalities_present():
    """All three modalities present → weighted composite equals expected value."""
    result = fuse_scores(speech_score=0.8, gaze_score=0.6, cognitive_score=0.5)
    expected = round(0.8 * 0.40 + 0.6 * 0.35 + 0.5 * 0.25, 4)
    assert result["composite_score"] == expected
    assert result["missing_modalities"] == []
    assert set(result["weights_applied"].keys()) == {"speech", "gaze", "cognitive"}


def test_fuse_weights_sum_to_one():
    """Base weights must sum to 1.0 — confirms literature citation consistency."""
    assert abs(sum(BASE_WEIGHTS.values()) - 1.0) < 1e-9


def test_fuse_missing_speech_redistributes():
    """When speech is absent, its 0.40 weight must be redistributed to gaze & cognitive."""
    result = fuse_scores(speech_score=None, gaze_score=0.7, cognitive_score=0.4)
    assert "speech" not in result["weights_applied"]
    redistributed = result["weights_applied"]
    total = sum(redistributed.values())
    assert abs(total - 1.0) < 1e-6
    assert "speech" in result["missing_modalities"]


def test_fuse_single_modality():
    """Single modality available — weight becomes 1.0, composite equals that score."""
    result = fuse_scores(speech_score=0.72, gaze_score=None, cognitive_score=None)
    assert result["composite_score"] == 0.72
    assert result["weights_applied"]["speech"] == pytest.approx(1.0)


def test_fuse_risk_bands():
    """Risk band thresholds: >=0.65 high, >=0.40 moderate, <0.40 low."""
    assert fuse_scores(0.9, 0.9, 0.9)["risk_band"] == "high"
    assert fuse_scores(0.5, 0.5, 0.5)["risk_band"] == "moderate"
    assert fuse_scores(0.1, 0.1, 0.1)["risk_band"] == "low"


def test_fuse_no_scores_returns_insufficient():
    """All None → status insufficient_data, no crash."""
    result = fuse_scores(None, None, None)
    assert result["risk_band"] == "insufficient_data"
    assert result["composite_score"] is None


def test_fuse_citations_present():
    """Response must contain at least one literature citation."""
    result = fuse_scores(0.6, 0.5, 0.7)
    assert len(result["citations"]) >= 1



def test_fuse_endpoint_unauthenticated():
    res = client.post(
        "/api/sessions/fuse",
        json={"session_id": "sess-001", "speech_score": 0.7},
    )
    assert res.status_code == 401


def test_fuse_endpoint_no_scores_rejected():
    token = create_test_token()
    res = client.post(
        "/api/sessions/fuse",
        json={"session_id": "sess-001"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 422


def test_fuse_endpoint_success_all_modalities():
    token = create_test_token()
    res = client.post(
        "/api/sessions/fuse",
        json={
            "session_id": "sess-001",
            "speech_score": 0.75,
            "gaze_score": 0.60,
            "cognitive_score": 0.55,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "composite_score" in data["result"]
    assert "modality_contributions" in data["result"]
    assert "citations" in data["result"]


def test_fuse_endpoint_partial_modalities():
    """API must succeed with only gaze + cognitive (speech missing)."""
    token = create_test_token()
    res = client.post(
        "/api/sessions/fuse",
        json={
            "session_id": "sess-002",
            "gaze_score": 0.55,
            "cognitive_score": 0.45,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "speech" in data["result"]["missing_modalities"]
