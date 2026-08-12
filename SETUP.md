# CogniDetect — New Contributor Setup Guide

This guide walks you through creating the required free-tier accounts and
running the project locally. No paid services are required.

---

## Prerequisites

- **Node.js** 20+ — https://nodejs.org
- **Python** 3.11 — https://python.org (or use `pyenv`)
- **Git** — https://git-scm.com

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/<your-org>/cognidetect.git
cd cognidetect
cp .env.example .env
```

---

## Step 2 — Create a free Supabase project

1. Go to https://supabase.com and sign up (free, no credit card).
2. Click **New Project** — choose any region close to India (e.g., Singapore).
3. Wait for the project to provision (~2 minutes).
4. Go to **Project Settings → API**:
   - Copy **Project URL** → paste as `SUPABASE_URL` in your `.env`
   - Copy **anon / public** key → paste as `SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY`
   - Copy **service_role / secret** key → paste as `SUPABASE_SERVICE_ROLE_KEY`
     > ⚠️ The service role key bypasses Row Level Security. Never commit it or expose it to the browser.

> **Note:** Supabase free projects auto-pause after 7 days of inactivity.
> Resume them at https://supabase.com/dashboard — or add the keep-alive
> GitHub Action from Phase 8.

---

## Step 3 — Create a free Groq account

1. Go to https://console.groq.com and sign up (free, no credit card).
2. Go to **API Keys** → create a new key.
3. Paste it as `GROQ_API_KEY` in your `.env`.

Free limits (2026): ~30 req/min, ~14,400 req/day — plenty for development.

---

## Step 4 — (Optional) Google AI Studio — Gemini fallback

1. Go to https://aistudio.google.com and sign in with your Google account.
2. Click **Get API Key** → create a key.
3. Paste it as `GEMINI_API_KEY` in your `.env`.

Leave `LLM_PROVIDER=groq` unless you specifically want to test the Gemini fallback.

---

## Step 5 — Run the backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000.
Visit http://localhost:8000/docs for the interactive Swagger UI (dev only).

---

## Step 6 — Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at http://localhost:5173.

You should see a **green dot** in the top-right corner confirming the backend is reachable.

---

## Step 7 — (Production) Deploy

### Frontend → Vercel
1. Go to https://vercel.com and sign up (free Hobby tier).
2. Import the `cognidetect` repo → set **Root Directory** to `frontend`.
3. Add environment variables in Vercel's dashboard:
   - `VITE_API_URL` = your Render backend URL (see below)
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Deploy.

### Backend → Render
1. Go to https://render.com and sign up (free).
2. **New → Web Service** → connect your GitHub repo.
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add all environment variables from `.env.example` (except `VITE_*` ones) in the Render dashboard.
5. Deploy. Note the `.onrender.com` URL — this is your `VITE_API_URL` for Vercel.

> ⚠️ Render free tier sleeps after ~15 minutes of inactivity. The first request
> after sleeping can take 30–60 seconds. The frontend shows a "Waking up server…"
> state during this — this is expected, not a bug.

---

## Environment variable quick-reference

| Variable | Where to get it | Used by |
|---|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API | Backend + Frontend |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Frontend (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | Backend only |
| `GROQ_API_KEY` | console.groq.com → API Keys | Backend |
| `GEMINI_API_KEY` | aistudio.google.com → Get API Key | Backend (fallback) |
| `VITE_API_URL` | Your Render URL (or localhost:8000 in dev) | Frontend build |
| `VITE_SUPABASE_URL` | Same as SUPABASE_URL | Frontend build |
| `VITE_SUPABASE_ANON_KEY` | Same as SUPABASE_ANON_KEY | Frontend build |
