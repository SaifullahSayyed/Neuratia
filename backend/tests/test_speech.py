"""
Tests for Speech AI Pipeline services and processing routes.
"""

import anyio
from fastapi.testclient import TestClient
from jose import jwt

from app.core.config import settings
from app.main import app
from app.services.acoustic import AcousticFeatureExtractor
from app.services.linguistic import LinguisticFeatureExtractor
from app.services.stt import STTService

client = TestClient(app)
SECRET = settings.supabase_jwt_secret


def create_test_token() -> str:
    payload = {
        "sub": "speech-patient-123",
        "email": "patient@example.com",
        "user_metadata": {"role": "patient"},
        "aud": "authenticated",
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")


def test_stt_service_fallback():
    async def _test():
        service = STTService()
        res = await service.transcribe(b"mock_audio", "test.webm")
        assert "text" in res
        assert "provider" in res

    anyio.run(_test)


def test_acoustic_feature_extractor():
    extractor = AcousticFeatureExtractor()
    features = extractor.extract_features(b"mock_audio_bytes")
    assert "mfcc_means" in features
    assert len(features["mfcc_means"]) == 13
    assert "jitter_local" in features
    assert "shimmer_local" in features
    assert "hnr_db" in features


def test_linguistic_feature_extractor():
    extractor = LinguisticFeatureExtractor()
    transcript = "The family is having a park picnic near the green trees. Um, like, a dog is resting."
    features = extractor.extract_features(transcript)
    assert features["word_count"] > 10
    assert features["type_token_ratio"] > 0.0
    assert features["filler_word_count"] >= 2


def test_process_speech_path_unauthenticated():
    res = client.post(
        "/api/sessions/process-speech-path",
        json={"session_id": "sess-123", "audio_storage_path": "test/path.webm"},
    )
    assert res.status_code == 401


def test_process_speech_path_authenticated():
    token = create_test_token()
    res = client.post(
        "/api/sessions/process-speech-path",
        json={"session_id": "sess-123", "audio_storage_path": "test/path.webm"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "result" in data
    assert "sub_score" in data["result"]
    assert "is_demo_mode" in data["result"]
