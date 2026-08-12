"""
Security Middleware — Neuratia

Adds HTTP security headers to every response:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY  (clickjacking protection)
  - X-XSS-Protection: 0  (modern browsers use CSP; legacy header disabled)
  - Referrer-Policy: strict-origin-when-cross-origin
  - Content-Security-Policy: restrictive policy blocking inline scripts
  - Strict-Transport-Security: 1 year HSTS (only in production)
  - Permissions-Policy: restricts camera/microphone to self (WASM gaze)

These headers follow OWASP Secure Headers Project recommendations.
Reference: https://owasp.org/www-project-secure-headers/
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

CSP = (
    "default-src 'self'; "
    "script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net "
    "https://storage.googleapis.com; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' https://fonts.gstatic.com; "
    "img-src 'self' data: blob:; "
    "connect-src 'self' https://*.supabase.co https://api.groq.com "
    "https://generativelanguage.googleapis.com; "
    "media-src 'self' blob:; "
    "worker-src 'self' blob:; "
    "frame-ancestors 'none';"
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Injects OWASP-recommended security headers into every response."""

    def __init__(self, app, is_production: bool = False) -> None:
        super().__init__(app)
        self.is_production = is_production

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = CSP
        response.headers["Permissions-Policy"] = (
            "camera=(self), microphone=(self), geolocation=()"
        )
        if self.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        return response
