# Neuratia — Free-Tier Deployment Guide

This guide walks you through deploying **Neuratia** across 100% free-tier services.

---

## 1. Supabase (Database, Auth, Storage)

1. Sign up at [supabase.com](https://supabase.com) (Free Tier).
2. Create a project named `neuratia-db`.
3. In SQL Editor, run migrations in order from `backend/migrations/`:
   - `001_schema.sql`
   - `002_rls.sql`
   - `003_profile_trigger.sql`
   - `004_consent_and_storage.sql`
4. Go to **Storage** -> Create a bucket `speech-recordings` -> Set to Public or apply RLS policy.
5. In **Project Settings** -> API:
   - Copy `URL` -> `SUPABASE_URL`
   - Copy `anon public` key -> `SUPABASE_ANON_KEY`
   - Copy `service_role` secret key -> `SUPABASE_SERVICE_ROLE_KEY`
   - Copy **JWT Secret** -> `SUPABASE_JWT_SECRET`

---

## 2. Groq Console (Whisper Speech-to-Text)

1. Sign up at [console.groq.com](https://console.groq.com) (Free Tier).
2. Create an API key.
3. Save as `GROQ_API_KEY`.

---

## 3. Google AI Studio (Gemini 1.5 Flash LLM Reporting)

1. Sign up at [aistudio.google.com](https://aistudio.google.com) (Free Tier).
2. Generate an API Key for Gemini.
3. Save as `GEMINI_API_KEY`.

---

## 4. Render (Backend FastAPI Deployment)

1. Sign up at [render.com](https://render.com) (Free Tier).
2. Click **New +** -> **Blueprints** -> Connect `https://github.com/SaifullahSayyed/Neuratia.git`.
3. Render automatically picks up `render.yaml`.
4. Enter the env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `GROQ_API_KEY`, `GEMINI_API_KEY`).
5. Render deploys the backend at `https://neuratia-backend.onrender.com`.

---

## 5. Vercel (Frontend React App Deployment)

1. Sign up at [vercel.com](https://vercel.com) (Free Tier).
2. Import repository `https://github.com/SaifullahSayyed/Neuratia.git`.
3. Set **Root Directory** to `frontend`.
4. Set Environment Variable:
   - `VITE_API_URL` = `https://neuratia-backend.onrender.com`
   - `VITE_SUPABASE_URL` = `https://YOUR_SUPABASE_ID.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `YOUR_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will host your app at `https://neuratia.vercel.app`.

---

## 6. Cold-Start & Verification

- Free Render web services sleep after 15 minutes of inactivity.
- The UI includes a `HealthDot` component that handles the ~30s cold-start grace period gracefully.
