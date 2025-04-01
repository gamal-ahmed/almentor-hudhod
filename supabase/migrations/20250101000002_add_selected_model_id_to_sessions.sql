
-- Add selected_model_id column to transcription_sessions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transcription_sessions'
    AND column_name = 'selected_model_id'
  ) THEN
    ALTER TABLE public.transcription_sessions ADD COLUMN selected_model_id uuid DEFAULT NULL;
  END IF;
END
$$;
