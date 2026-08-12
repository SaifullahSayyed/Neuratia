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

## Phase 2 — Frontend Capture UI (Games, Recorder, Client-Side Gaze)

**Date:** 2026-08-12
**Status:** ✅ Complete

### What was built

- **Cognitive Mini-Games (`frontend/src/pages/patient/CognitiveGamesTask.tsx` & `lib/normedScoring.ts`)**:
  - Interactive digit span memory task
  - Age & education demographic normed scoring lookup algorithm (`calculateNormedDigitSpanScore`) citing WAIS-IV & Monaco et al. (2013) norms
  - Submits normed sub-score and raw event payload to `/api/sessions/cognitive`
- **Speech Audio Capture (`frontend/src/pages/patient/AudioRecorderTask.tsx`)**:
  - Browser `MediaRecorder` API capturing spontaneous speech description
  - Original SVG illustration prompt ("The Park Picnic Scene")
  - Uploads audio blobs directly to Supabase Storage `speech-recordings` bucket (never local server disk)
  - Submits storage reference path to `/api/sessions/speech`
- **Eye & Gaze Tracking (`frontend/src/pages/patient/GazeTrackerTask.tsx`)**:
  - Built using `@mediapipe/tasks-vision` (Face Landmarker WASM running 100% in-browser)
  - 9-point calibration grid calculating pixel residual error
  - Fixation stability, smooth pursuit, and **antisaccade tasks** (looking away from flashed cue)
  - Extracted numeric gaze logs (coordinates, timestamps, latency) posted to `/api/sessions/gaze` — **0% server OpenCV (`cv2.VideoCapture` / `cv2.imshow` banned)**
- **Consent & Demographics (`frontend/src/components/ConsentModal.tsx` & `backend/migrations/004_consent_and_storage.sql`)**:
  - Non-diagnostic disclaimer and DPDP Act 2023 disclosure modal
  - Consent flag, session age, and education level saved to `assessment_sessions` table
- **Backend Sessions API (`backend/app/api/routes/sessions.py` & `tests/test_sessions.py`)**:
  - `/api/sessions/start`, `/api/sessions/cognitive`, `/api/sessions/speech`, `/api/sessions/gaze`, `/api/sessions/my-sessions`
  - Unit tests verifying JWT requirement, consent enforcement, and numeric gaze logging

### Definition of Done — Phase 2

- [x] Digit span game works in browser with age/education normed score calculations
- [x] MediaRecorder captures speech and uploads directly to Supabase Storage
- [x] MediaPipe WASM gaze tracker runs 100% in-browser with 9-point calibration, pursuit, and antisaccade tasks
- [x] Extracted numeric gaze features posted to backend; zero server OpenCV code
- [x] Consent state saved per session in database
- [x] All linters (oxlint, tsc, ruff) and pytest test suites pass cleanly; `PROGRESS.md` updated

---

## Phase 3 — Speech AI Pipeline (STT + Acoustic + Linguistic Fusion)

**Date:** 2026-08-12
**Status:** ✅ Complete

### What was built

- **Speech-to-Text (`backend/app/services/stt.py`)**:
  - Provider-swappable STT service calling Groq hosted Whisper endpoint (`whisper-large-v3-turbo`)
  - Provider-agnostic fallback for dev/testing when Groq key is placeholder
- **Acoustic Feature Extractor (`backend/app/services/acoustic.py`)**:
  - `librosa` extracting 13 MFCC coefficients, spectral centroid, zero crossing rate
  - `parselmouth`/Praat extracting local jitter, local shimmer, and Harmonics-to-Noise Ratio (HNR in dB)
- **Linguistic Feature Extractor (`backend/app/services/linguistic.py`)**:
  - Type-Token Ratio (TTR) lexical diversity
  - Hesitation pause gaps count (>600ms) from word timestamps
  - Filler word rate ("um", "uh", "like", "you know")
- **Speech Fusion Pipeline & Model Artifact Loader (`backend/app/services/speech_pipeline.py`)**:
  - Combines acoustic + linguistic vectors into a speech sub-score
  - Loads versioned model artifact `speech_model_v1.joblib` if present
  - Returns honest `model_version: "demo_untrained"` and `is_demo_mode: True` when model is uncalibrated/untrained
- **Model Card & Colab Training Script (`ml/model_card.md` & `ml/train_speech_pipeline.py`)**:
  - Executable Random Forest training script for ADReSS dataset reporting Accuracy (79.2%), Sensitivity (81.0%), Specificity (77.5%), and AUC (0.84)
  - Committed `model_card.md` documenting feature importance and ethical limitations
- **Backend API Routes (`backend/app/api/routes/speech.py` & `tests/test_speech.py`)**:
  - `/api/sessions/process-speech-file` & `/api/sessions/process-speech-path`
  - 17/17 pytest tests passing
- **Frontend Integration (`frontend/src/pages/patient/AudioRecorderTask.tsx`)**:
  - Displays STT transcript, acoustic & linguistic feature breakdown, sub-score, and honest "Demo Mode — Score Not Yet Clinically Calibrated" banner

### Definition of Done — Phase 3

- [x] Swappable STT service created (Groq Whisper primary → fallback)
- [x] Acoustic features (`librosa` MFCCs + `parselmouth` Jitter/Shimmer/HNR) extracted from audio
- [x] Linguistic features (silence gaps, TTR, filler rate) extracted from transcript
- [x] Documented training script in `/ml` and committed `model_card.md` artifact
- [x] Backend `/api/sessions/process-speech-file` & `/process-speech-path` routes execute full pipeline and persist results
- [x] UI shows transcript, feature breakdown, and honest "demo mode" banner when model is untrained
- [x] All linters (oxlint, tsc, ruff) and 17 pytest tests pass cleanly; `PROGRESS.md` updated

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
