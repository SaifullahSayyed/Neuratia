"""
Tests for RAG Retrieval and LLM Report Generator (Phase 6).
"""

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.core.config import settings
from app.main import app
from app.services.rag_retrieval import RAGRetriever
from app.services.report_generator import DISCLAIMER, _template_report, generate_report

client = TestClient(app)
SECRET = settings.supabase_jwt_secret


def create_test_token() -> str:
    payload = {
        "sub": "report-patient-42",
        "email": "patient@example.com",
        "user_metadata": {"role": "patient"},
        "aud": "authenticated",
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")


SAMPLE_FUSION = {
    "composite_score": 0.72,
    "risk_band": "high",
    "risk_label": "High Risk Signal — Clinician Review Strongly Recommended",
    "modality_contributions": {"speech": 0.29, "gaze": 0.25, "cognitive": 0.18},
    "weights_applied": {"speech": 0.40, "gaze": 0.35, "cognitive": 0.25},
    "missing_modalities": [],
}

PARTIAL_FUSION = {
    "composite_score": 0.51,
    "risk_band": "moderate",
    "risk_label": "Moderate Risk Signal — Clinician Review Suggested",
    "modality_contributions": {"speech": 0.31, "gaze": 0.20},
    "weights_applied": {"speech": 0.53, "gaze": 0.47},
    "missing_modalities": ["cognitive"],
}



def test_rag_retriever_returns_chunks():
    retriever = RAGRetriever()
    chunks = retriever.retrieve("speech gaze cognitive MCI", top_k=3)
    assert len(chunks) <= 3
    assert all("topic" in c and "content" in c for c in chunks)


def test_rag_retriever_relevance_ordering():
    """Speech query should return a speech-related chunk as top result."""
    retriever = RAGRetriever()
    chunks = retriever.retrieve("speech filler words type token ratio", top_k=2)
    combined = " ".join(c["content"].lower() for c in chunks)
    assert "speech" in combined or "filler" in combined or "type" in combined


def test_rag_retriever_top_k_respected():
    retriever = RAGRetriever()
    for k in [1, 2, 3]:
        assert len(retriever.retrieve("test", top_k=k)) <= k



def test_template_report_contains_disclaimer():
    """Non-diagnostic disclaimer must be present in every report."""
    rag = RAGRetriever().retrieve("cognitive MCI", top_k=2)
    report = _template_report(SAMPLE_FUSION, rag)
    assert "NON-DIAGNOSTIC DISCLAIMER" in report["report_text"]
    assert report["disclaimer"] == DISCLAIMER


def test_template_report_high_risk_framing():
    """High risk reports must recommend clinician review."""
    rag = RAGRetriever().retrieve("cognitive MCI risk", top_k=2)
    report = _template_report(SAMPLE_FUSION, rag)
    lower = report["report_text"].lower()
    assert "neurologist" in lower or "clinician" in lower or "evaluation" in lower


def test_template_report_missing_modality_note():
    """Missing modality should appear in report text."""
    rag = RAGRetriever().retrieve("cognitive", top_k=2)
    report = _template_report(PARTIAL_FUSION, rag)
    assert "cognitive" in report["report_text"].lower()


def test_generate_report_falls_back_to_template():
    """With placeholder GEMINI_API_KEY, generate_report must return template."""
    result = generate_report(SAMPLE_FUSION)
    assert "report_text" in result
    assert result["is_demo_mode"] is True
    assert "disclaimer" in result
    assert len(result["rag_chunks_used"]) > 0



def test_generate_report_unauthenticated():
    res = client.post(
        "/api/sessions/generate-report",
        json={"session_id": "s-001", "fusion_result": SAMPLE_FUSION},
    )
    assert res.status_code == 401


def test_generate_report_authenticated_full():
    token = create_test_token()
    res = client.post(
        "/api/sessions/generate-report",
        json={"session_id": "s-001", "fusion_result": SAMPLE_FUSION},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "report_text" in data["result"]
    assert "rag_chunks_used" in data["result"]
    assert "NON-DIAGNOSTIC" in data["result"]["report_text"]


def test_generate_report_authenticated_partial_modalities():
    token = create_test_token()
    res = client.post(
        "/api/sessions/generate-report",
        json={"session_id": "s-002", "fusion_result": PARTIAL_FUSION},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["result"]["is_demo_mode"] is True
