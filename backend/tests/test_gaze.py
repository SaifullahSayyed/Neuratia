"""
Tests for Gaze metrics, calibration gating, and processing routes.
"""

from fastapi.testclient import TestClient
from jose import jwt

from app.core.config import settings
from app.main import app
from app.services.gaze_metrics import CITED_THRESHOLDS, GazeMetricExtractor
from app.services.gaze_pipeline import GazePipeline

client = TestClient(app)
SECRET = settings.supabase_jwt_secret


def create_test_token() -> str:
    payload = {
        "sub": "gaze-patient-123",
        "email": "patient@example.com",
        "user_metadata": {"role": "patient"},
        "aud": "authenticated",
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")


def test_gaze_metric_extractor_thresholds():
    extractor = GazeMetricExtractor()
    metrics = extractor.extract_metrics({
        "fixation_dispersion_px": 12.0,
        "saccade_latency_ms": 210,
        "antisaccade_error_rate": 0.15,
    })
    assert metrics["fixation_dispersion_px"] == 12.0
    assert metrics["saccade_latency_ms"] == 210
    assert metrics["antisaccade_error_rate"] == 0.15
    assert "max_acceptable_calibration_error_px" in metrics["thresholds_applied"]


def test_gaze_pipeline_good_calibration():
    pipeline = GazePipeline()
    res = pipeline.process_gaze(
        calibration_quality=4.2,
        fixation_features={"fixation_dispersion_px": 11.0, "saccade_latency_ms": 200, "antisaccade_error_rate": 0.10},
    )
    assert res["is_low_confidence"] is False
    assert "High confidence" in res["confidence_note"]
    assert res["sub_score"] > 0.5


def test_gaze_pipeline_calibration_gating_flag():
    """Calibration residual error > 10.0px MUST flag is_low_confidence = True (Holmqvist 2011)."""
    pipeline = GazePipeline()
    res = pipeline.process_gaze(
        calibration_quality=14.5,
        fixation_features={"fixation_dispersion_px": 11.0, "saccade_latency_ms": 200, "antisaccade_error_rate": 0.10},
    )
    assert res["is_low_confidence"] is True
    assert "Low confidence" in res["confidence_note"]


def test_process_gaze_unauthenticated():
    res = client.post(
        "/api/sessions/process-gaze",
        json={
            "session_id": "sess-123",
            "calibration_quality": 3.5,
            "fixation_features": {"fixation_dispersion_px": 10.0},
        },
    )
    assert res.status_code == 401


def test_process_gaze_authenticated():
    token = create_test_token()
    res = client.post(
        "/api/sessions/process-gaze",
        json={
            "session_id": "sess-123",
            "calibration_quality": 3.5,
            "fixation_features": {
                "fixation_dispersion_px": 10.0,
                "saccade_latency_ms": 210,
                "antisaccade_error_rate": 0.12,
            },
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "result" in data
    assert "is_low_confidence" in data["result"]
    assert "citations" in data["result"]
