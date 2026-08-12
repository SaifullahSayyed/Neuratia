
ALTER TABLE public.assessment_sessions
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_age_at_session INT,
ADD COLUMN IF NOT EXISTS user_education_at_session TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('speech-recordings', 'speech-recordings', false)
ON CONFLICT (id) DO NOTHING;

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
