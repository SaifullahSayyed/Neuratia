
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('patient','doctor','admin')) DEFAULT 'patient',
  age           INT CHECK (age BETWEEN 18 AND 120),
  education_level TEXT CHECK (education_level IN ('primary','secondary','undergraduate','postgraduate')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessment_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  status       TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','complete','error'))
);

CREATE TABLE IF NOT EXISTS public.speech_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  audio_storage_path TEXT,
  transcript      TEXT,
  acoustic_features JSONB,
  linguistic_features JSONB,
  sub_score       FLOAT,
  model_version   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gaze_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  calibration_quality FLOAT,
  fixation_features JSONB,
  sub_score       FLOAT,
  model_version   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cognitive_game_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  game_type       TEXT NOT NULL CHECK (game_type IN ('digit_span','sequence_memory')),
  raw_events      JSONB,
  age_band        TEXT,
  education_band  TEXT,
  sub_score       FLOAT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fused_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  fused_risk_score  FLOAT,
  explanation_json  JSONB,
  llm_report_text   JSONB,
  rag_context_log   JSONB,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.doctor_patient_links (
  doctor_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  approved_by_admin BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (doctor_id, patient_id)
);
