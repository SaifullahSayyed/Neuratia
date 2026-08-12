"""
Phase 7 — Security Hardening Tests

Covers:
1. Security headers present on all responses (X-Content-Type-Options, X-Frame-Options, CSP)
2. Rate limiting returns 429 after limit is exceeded
3. Input validation — oversized / malformed inputs rejected with 422
4. Auth enforcement — all protected routes return 401 without token
5. SQL injection safety — parameterised values don't execute raw SQL
6. Environment variable completeness check
"""

import os

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.core.config import settings
from app.core.rate_limit import DEFAULT_LIMIT, ROUTE_LIMITS, _InMemoryStore
from app.main import app

client = TestClient(app)
SECRET = settings.supabase_jwt_secret


def create_test_token(role: str = "patient") -> str:
    payload = {
        "sub": "security-test-user-1",
        "email": "sec@example.com",
        "user_metadata": {"role": role},
        "aud": "authenticated",
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")


# ── Security Headers ───────────────────────────────────────────────────────────

def test_security_header_x_content_type_options():
    res = client.get("/api/health")
    assert res.headers.get("x-content-type-options") == "nosniff"


def test_security_header_x_frame_options():
    res = client.get("/api/health")
    assert res.headers.get("x-frame-options") == "DENY"


def test_security_header_csp_present():
    res = client.get("/api/health")
    csp = res.headers.get("content-security-policy", "")
    assert "default-src" in csp
    assert "frame-ancestors 'none'" in csp


def test_security_header_referrer_policy():
    res = client.get("/api/health")
    assert "strict-origin" in res.headers.get("referrer-policy", "")


def test_security_header_permissions_policy():
    res = client.get("/api/health")
    pp = res.headers.get("permissions-policy", "")
    assert "camera" in pp and "microphone" in pp


def test_no_hsts_in_dev():
    """HSTS must NOT be set in dev/test — only in production."""
    res = client.get("/api/health")
    assert "strict-transport-security" not in res.headers


# ── Rate Limiter Unit Tests ────────────────────────────────────────────────────

def test_rate_limiter_store_allows_under_limit():
    store = _InMemoryStore()
    for _ in range(5):
        assert store.is_allowed("test-key", limit=10, window=60) is True


def test_rate_limiter_store_blocks_over_limit():
    store = _InMemoryStore()
    for _ in range(10):
        store.is_allowed("block-key", limit=10, window=60)
    assert store.is_allowed("block-key", limit=10, window=60) is False


def test_route_limits_defined_for_sensitive_routes():
    """LLM and audio routes must have tighter limits than the default."""
    llm_limit = ROUTE_LIMITS["/api/sessions/generate-report"][0]
    audio_limit = ROUTE_LIMITS["/api/sessions/process-speech"][0]
    default_limit = DEFAULT_LIMIT[0]
    assert llm_limit < default_limit
    assert audio_limit < default_limit


# ── Input Validation / 422 Hardening ──────────────────────────────────────────

def test_start_session_age_out_of_range():
    """Age must be 18–120. Age=200 should return 422."""
    token = create_test_token()
    res = client.post(
        "/api/sessions/start",
        json={"consent_given": True, "age": 200, "education_level": "secondary"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 422


def test_start_session_age_below_minimum():
    token = create_test_token()
    res = client.post(
        "/api/sessions/start",
        json={"consent_given": True, "age": 5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 422


def test_fuse_score_out_of_range():
    """Scores must be in [0,1]. 1.5 should return 422."""
    token = create_test_token()
    res = client.post(
        "/api/sessions/fuse",
        json={"session_id": "s-001", "speech_score": 1.5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 422


def test_fuse_session_id_too_long():
    """session_id longer than 64 chars must be rejected."""
    token = create_test_token()
    too_long = "x" * 200
    res = client.post(
        "/api/sessions/fuse",
        json={"session_id": too_long, "speech_score": 0.5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 422


def test_gaze_calibration_quality_negative():
    """Negative calibration quality (px) is physically impossible — reject 422."""
    token = create_test_token()
    res = client.post(
        "/api/sessions/process-gaze",
        json={
            "session_id": "s-001",
            "calibration_quality": -5.0,
            "fixation_features": {},
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 422


# ── Auth Enforcement ───────────────────────────────────────────────────────────

@pytest.mark.parametrize("route", [
    ("/api/sessions/start", "POST"),
    ("/api/sessions/fuse", "POST"),
    ("/api/sessions/generate-report", "POST"),
    ("/api/sessions/process-gaze", "POST"),
    ("/api/auth/me", "GET"),
])
def test_all_protected_routes_require_auth(route):
    path, method = route
    if method == "POST":
        res = client.post(path, json={})
    else:
        res = client.get(path)
    assert res.status_code == 401, f"{path} should require auth but returned {res.status_code}"


# ── SQL Injection Safety ───────────────────────────────────────────────────────

def test_sql_injection_in_session_id_does_not_crash():
    """
    SQL injection attempt in session_id must not crash the app with 500 Internal Server Error.
    Supabase client uses parameterized queries — this verifies no raw SQL syntax errors or unhandled exceptions occur.
    """
    token = create_test_token()
    malicious = "'; DROP TABLE assessment_sessions; --"
    res = client.post(
        "/api/sessions/fuse",
        json={"session_id": malicious, "speech_score": 0.5},
        headers={"Authorization": f"Bearer {token}"},
    )
    # Should safely complete or validate, never crash with unhandled DB exception
    assert res.status_code == 200
    assert res.json()["status"] == "success"



# ── Environment Variable Completeness ─────────────────────────────────────────

def test_required_env_vars_are_set():
    """
    All required env vars must be present (even placeholder values are acceptable).
    This prevents silent failures where missing keys cause runtime errors at request time.
    """
    required = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "GROQ_API_KEY",
    ]
    for var in required:
        assert os.environ.get(var), f"Required env var {var} is not set"
