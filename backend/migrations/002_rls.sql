-- 002_rls.sql
-- Postgres Row Level Security Policies for Neuratia / CogniDetect

-- Enable RLS on all tables
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speech_results        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaze_results          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fused_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patient_links  ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_profile" ON public.profiles;
CREATE POLICY "own_profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
CREATE POLICY "admin_read_all_profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── assessment_sessions ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "patient_own_sessions" ON public.assessment_sessions;
CREATE POLICY "patient_own_sessions" ON public.assessment_sessions
  FOR ALL USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "doctor_linked_sessions" ON public.assessment_sessions;
CREATE POLICY "doctor_linked_sessions" ON public.assessment_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctor_patient_links
      WHERE doctor_id = auth.uid()
        AND patient_id = assessment_sessions.patient_id
        AND approved_by_admin = true
    )
  );

-- ── speech_results ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "speech_results_access" ON public.speech_results;
CREATE POLICY "speech_results_access" ON public.speech_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = speech_results.session_id
        AND (
          s.patient_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.doctor_patient_links dpl
            WHERE dpl.doctor_id = auth.uid()
              AND dpl.patient_id = s.patient_id
              AND dpl.approved_by_admin = true
          )
        )
    )
  );

-- ── gaze_results ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "gaze_results_access" ON public.gaze_results;
CREATE POLICY "gaze_results_access" ON public.gaze_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = gaze_results.session_id
        AND (
          s.patient_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.doctor_patient_links dpl
            WHERE dpl.doctor_id = auth.uid()
              AND dpl.patient_id = s.patient_id
              AND dpl.approved_by_admin = true
          )
        )
    )
  );

-- ── cognitive_game_results ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cognitive_game_results_access" ON public.cognitive_game_results;
CREATE POLICY "cognitive_game_results_access" ON public.cognitive_game_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = cognitive_game_results.session_id
        AND (
          s.patient_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.doctor_patient_links dpl
            WHERE dpl.doctor_id = auth.uid()
              AND dpl.patient_id = s.patient_id
              AND dpl.approved_by_admin = true
          )
        )
    )
  );

-- ── fused_reports ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "fused_reports_access" ON public.fused_reports;
CREATE POLICY "fused_reports_access" ON public.fused_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      WHERE s.id = fused_reports.session_id
        AND (
          s.patient_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.doctor_patient_links dpl
            WHERE dpl.doctor_id = auth.uid()
              AND dpl.patient_id = s.patient_id
              AND dpl.approved_by_admin = true
          )
        )
    )
  );

-- ── doctor_patient_links ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_links" ON public.doctor_patient_links;
CREATE POLICY "admin_manage_links" ON public.doctor_patient_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "doctor_read_own_links" ON public.doctor_patient_links;
CREATE POLICY "doctor_read_own_links" ON public.doctor_patient_links
  FOR SELECT USING (doctor_id = auth.uid());

DROP POLICY IF EXISTS "patient_read_own_links" ON public.doctor_patient_links;
CREATE POLICY "patient_read_own_links" ON public.doctor_patient_links
  FOR SELECT USING (patient_id = auth.uid());
