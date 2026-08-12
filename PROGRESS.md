# CogniDetect — Build Progress Log

---

## Phase 0 — Repo Scaffolding & Free-Tier Setup

**Date:** 2026-08-12
**Status:** ✅ Complete

### What was built

- Clean monorepo skeleton at `scratch/cognidetect/`
  - `/frontend` — React 18 + Vite + TypeScript + Tailwind CSS (fresh, no code from old repo)
  - `/backend` — FastAPI + Python 3.11, structured as `app/{main,api/routes,core,services,models}`
  - `/ml` — training script directory with rules README (no scripts yet; added in Phase 3+)
  - `/docs` — ARCHITECTURE.md, DATA_ETHICS.md (stubs where noted)
- `.env.example` with all 9 env vars — placeholder values only, safe to commit
- `.gitignore` covering `.env`, `__pycache__`, `node_modules`, model artifact files
- `SETUP.md` — full contributor guide for free-tier account creation + local dev
- `README.md` — accurate tech stack, honest validation-status table, no false compliance claims
- `backend/app/api/routes/health.py` — `GET /api/health → {"status": "ok"}` (intentionally public)
- `backend/app/core/config.py` — pydantic-settings, fails loudly if required env var is missing
- `backend/app/main.py` — FastAPI app with CORS (open in dev, Vercel-restricted in prod)
- `frontend/src/lib/api.ts` — `checkHealth()` reads base URL from `VITE_API_URL` env var (never hardcoded)
- `frontend/src/components/HealthDot.tsx` — green/amber/red dot with Render cold-start "waking up" UX
- `frontend/src/App.tsx` — dark glassmorphic landing page with always-visible disclaimer
- `.github/workflows/ci.yml` — ESLint + tsc + ruff + pytest on every push

### What is stubbed / deferred

- No auth, no schema, no DB migrations (Phase 1)
- No capture UI — games, audio recorder, gaze (Phase 2)
- No ML models or training scripts (Phase 3+)
- No LLM/RAG integration (Phase 6)
- `docs/DATA_ETHICS.md` — retention periods TBD, pending legal input for any non-prototype deployment
- `docs/reference-corpus/` — populated in Phase 6

### Required env vars / free-tier accounts (as of Phase 0)

| Variable | Account needed | Free tier |
|---|---|---|
| `SUPABASE_URL` | supabase.com | Free |
| `SUPABASE_ANON_KEY` | supabase.com | Free |
| `SUPABASE_SERVICE_ROLE_KEY` | supabase.com | Free |
| `GROQ_API_KEY` | console.groq.com | Free |
| `GEMINI_API_KEY` | aistudio.google.com | Free (optional in Phase 0) |
| `VITE_API_URL` | n/a — set to `http://localhost:8000` in dev | — |

### Definition of Done — Phase 0

- [x] `npm run dev` starts with no errors using a filled `.env`
- [x] `uvicorn app.main:app --reload` starts with no errors using a filled `.env`
- [x] Health-check dot renders green in the browser (verified locally)
- [x] `.env` is git-ignored; `.env.example` has only placeholder values
- [x] GitHub Actions CI workflow exists and will run on push
- [x] `PROGRESS.md` created with honest summary

---

## Phase 1 — Auth, Database Schema, RBAC

**Date:** 2026-08-12
**Status:** ✅ Complete

### What was built

- **Database Migrations (`backend/migrations/`)**:
  - `001_schema.sql`: 7 core tables (`profiles`, `assessment_sessions`, `speech_results`, `gaze_results`, `cognitive_game_results`, `fused_reports`, `doctor_patient_links`)
  - `002_rls.sql`: Row Level Security policies for all tables (patient/doctor/admin access scoping)
  - `003_profile_trigger.sql`: Trigger function `handle_new_user()` auto-creating profile records upon signup
- **Backend Auth & RBAC (`backend/app/core/auth.py` & `routes/auth.py`)**:
  - Supabase JWT verification dependency (`get_current_user`, `require_role`)
  - `GET /api/auth/me`: verified token user identity check
  - `GET /api/admin/pending-links` & `POST /api/admin/approve-link`: admin-gated doctor-patient link management
  - 5 new unit tests in `backend/tests/test_auth.py` verifying 401 unauthenticated, 403 forbidden, and 200 authorised access
- **Frontend Auth & Dashboards (`frontend/src/`)**:
  - `lib/supabase.ts`: Supabase JS client singleton
  - `contexts/AuthContext.tsx`: React Context providing user identity, role, and JWT token state
  - `pages/LoginPage.tsx`: Sign-in/Sign-up tabs with role selection (Patient / Doctor), Google OAuth button, and mandatory disclaimer
  - `pages/patient/PatientDashboard.tsx`: Patient portal shell
  - `pages/doctor/DoctorDashboard.tsx`: Clinician portal shell
  - `pages/admin/AdminDashboard.tsx`: Admin console for reviewing & approving doctor-patient link requests
  - `App.tsx`: Role-aware `ProtectedRoute` guards and navigation routes

### Definition of Done — Phase 1

- [x] Sign-up/login UI created against Supabase Auth architecture
- [x] RLS policies created in SQL migration files (001, 002, 003)
- [x] FastAPI routes check verified Supabase JWT token & role on server side
- [x] Admin approval UI flow built for `doctor_patient_links`
- [x] Backend tests verify 401 on missing/invalid token and 403 on role mismatch
- [x] `PROGRESS.md` updated

---

## Phase 2 — Frontend Capture UI

**Status:** 🔲 Not started

---

## Phase 3 — Speech AI Pipeline

**Status:** 🔲 Not started

---

## Phase 4 — Gaze/Oculomotor Scoring Backend

**Status:** 🔲 Not started

---

## Phase 5 — Multimodal Fusion + Explainability

**Status:** 🔲 Not started

---

## Phase 6 — LLM + RAG Reporting Layer

**Status:** 🔲 Not started

---

## Phase 7 — Security Hardening, Tests, CI

**Status:** 🔲 Not started

---

## Phase 8 — Free Deployment & NEC Demo Polish

**Status:** 🔲 Not started
