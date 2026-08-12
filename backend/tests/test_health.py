"""
Phase 0 smoke tests — these run in CI with placeholder env vars.
They must NOT require a live Supabase/Groq connection.

Real integration tests (auth rejection, RLS behavior, scoring accuracy)
are added in Phase 7 once all routes exist.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_returns_ok():
    """The health endpoint must return 200 {"status": "ok"} — no auth needed."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_returns_message():
    """Root / returns a friendly message (not a 404)."""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_unknown_route_returns_404():
    """A non-existent route returns 404, not 500."""
    response = client.get("/api/does-not-exist")
    assert response.status_code == 404
