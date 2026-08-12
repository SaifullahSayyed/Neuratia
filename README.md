# CogniDetect

> **⚠️ Research Prototype — Not a medical device. Not for clinical use.**
> This is a submission for NEC 2026 (IIT Bombay). All scores are informational
> screening indicators only. See [DATA_ETHICS.md](docs/DATA_ETHICS.md) for full disclosure.

---

## What is CogniDetect?

CogniDetect is a non-invasive, browser-based cognitive-decline **screening** tool that combines three modalities:

| Modality | What it captures | How |
|---|---|---|
| 🎙️ **Speech analysis** | Acoustic features (jitter, shimmer, MFCCs) + linguistic patterns (pauses, lexical diversity) | Browser MediaRecorder → Groq Whisper → librosa + DistilBERT |
| 👁️ **Gaze / oculomotor** | Fixation stability, saccade latency, antisaccade error rate | MediaPipe Face Landmarker — runs entirely in-browser, no video sent to server |
| 🧠 **Cognitive mini-games** | Digit span, sequence memory — normed against age + education band | Browser-side game logic |

Results are fused into a composite risk indicator and explained in a plain-language report grounded in a fixed reference corpus (Groq Llama 3.3 / Gemini fallback). A doctor-facing view lets approved clinicians review patient sessions and ask follow-up questions.

---

## Current Validation Status & Limitations

> This section is kept honest by policy — see `.agents/rules/project-rules.md`.

| Claim | Status |
|---|---|
| Speech model trained and validated | 🔴 Not yet — training script exists in `/ml`, model pending DementiaBank data access |
| Gaze scoring validated against labeled cohort | 🔴 Not yet — using literature-cited thresholds, labeled as "unvalidated engagement metric" in UI |
| Cognitive game norms cited | 🟡 Partial — normed lookup table from published literature, not validated on this app's own users |
| Multimodal fusion validated | 🔴 Not yet — weighted average v1, ablation pending |
| LLM reports audited for hallucination | 🟡 Logged (context stored alongside output) — manual audit pending |
| CDSCO SaMD certification | 🔴 None — research prototype only |
| HIPAA compliant | N/A — this is not a US product |
| DPDP Act 2023 aligned | 🟡 Designed for alignment — not legally reviewed |

---

## Tech Stack

| Layer | Tool | Hosting |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS | Vercel (free Hobby) |
| Backend | FastAPI + Python 3.11 | Render (free Web Service) |
| Database + Auth + Storage | Supabase (PostgreSQL + pgvector + RLS) | Supabase (free) |
| Speech-to-text | Groq Whisper (primary) / faster-whisper (local fallback) | Groq free tier |
| LLM | Groq Llama 3.3 (primary) / Gemini 2.0 Flash (fallback) | Groq + Google AI Studio free tiers |
| Client gaze tracking | MediaPipe Face Landmarker (WASM, browser-only) | CDN |
| ML training | Google Colab / Kaggle Notebooks | Free GPU |
| CI/CD | GitHub Actions | Free (public repo) |

**Total monthly cost: $0** — 100% free-tier stack.

---

## Repository Structure

```
cognidetect/
├── frontend/        React + Vite + Tailwind app
├── backend/         FastAPI Python API
├── ml/              Training scripts (run on Colab/Kaggle, not at request time)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATA_ETHICS.md
│   └── reference-corpus/   (added Phase 6 — RAG grounding documents)
├── .env.example     All env vars with descriptions — safe to commit
├── SETUP.md         New contributor guide
├── PROGRESS.md      Per-phase build log
└── .github/
    └── workflows/ci.yml   Lint + test on every push
```

---

## Setup

See **[SETUP.md](SETUP.md)** for full instructions. Quick start:

```bash
git clone https://github.com/<your-org>/cognidetect.git
cd cognidetect
cp .env.example .env          # fill in your free-tier keys
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload
# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

---

## Build Phases

| Phase | Description | Status |
|---|---|---|
| 0 | Repo scaffolding, free-tier wiring, health-check round trip, CI | ✅ Complete |
| 1 | Supabase Auth, DB schema, RLS, RBAC | ✅ Complete |
| 2 | Capture UI — browser games, audio recorder, client-side gaze | ✅ Complete |
| 3 | Speech AI pipeline — STT + acoustic librosa/praat + linguistic | ✅ Complete |
| 4 | Gaze/oculomotor scoring backend & calibration gating | ✅ Complete |
| 5 | Multimodal fusion + SHAP-style explainability | ✅ Complete |
| 6 | LLM + TF-IDF RAG reporting layer (Gemini 1.5 Flash) | ✅ Complete |
| 7 | Security hardening, OWASP headers, rate limiting, 64 tests | ✅ Complete |
| 8 | Free deployment (Render + Vercel) + NEC demo polish | ✅ Complete |


---

## Contributing

1. Read `.agents/rules/project-rules.md` — these rules are enforced on every PR.
2. No secrets in source. No hardcoded URLs. No server-side camera code. No fake scores.
3. Every new route must have a pytest test. Every new frontend flow must have a Vitest test.
4. CI must be green before merging.

---

## License

MIT — see `LICENSE`. Clinical use requires regulatory clearance (see [DATA_ETHICS.md](docs/DATA_ETHICS.md)).
