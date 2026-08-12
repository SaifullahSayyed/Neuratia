-- 004_consent_and_storage.sql
-- Adds consent tracking to assessment_sessions and sets up Supabase Storage policies for speech-recordings

ALTER TABLE public.assessment_sessions
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_age_at_session INT,
ADD COLUMN IF NOT EXISTS user_education_at_session TEXT;

-- Create speech-recordings storage bucket policy if using Supabase Storage SQL
INSERT INTO storage.buckets (id, name, public)
VALUES ('speech-recordings', 'speech-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for speech-recordings bucket
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
CREATE POLICY "Authenticated users can upload audio" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'speech-recordings'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can read own audio recordings" ON storage.objects;
CREATE POLICY "Users can read own audio recordings" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'speech-recordings'
    AND (auth.uid() = owner OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin')
    ))
  );
