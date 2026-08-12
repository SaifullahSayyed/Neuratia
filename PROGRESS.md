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

**Status:** 🔲 Not started

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
