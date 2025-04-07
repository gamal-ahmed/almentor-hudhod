
-- Add Row Level Security to transcription tables

-- Enable RLS for transcription_sessions
ALTER TABLE public.transcription_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert their own transcription sessions
CREATE POLICY "Users can insert their own transcription sessions" 
ON public.transcription_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Policy for users to update their own transcription sessions
CREATE POLICY "Users can update their own transcription sessions" 
ON public.transcription_sessions 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Policy for users to view their own transcription sessions
CREATE POLICY "Users can view their own transcription sessions" 
ON public.transcription_sessions 
FOR SELECT 
USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Policy for users to delete their own transcription sessions
CREATE POLICY "Users can delete their own transcription sessions" 
ON public.transcription_sessions 
FOR DELETE 
USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Enable RLS for transcriptions
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert their own transcriptions
CREATE POLICY "Users can insert their own transcriptions" 
ON public.transcriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Policy for users to update their own transcriptions
CREATE POLICY "Users can update their own transcriptions" 
ON public.transcriptions 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Policy for users to view their own transcriptions
CREATE POLICY "Users can view their own transcriptions" 
ON public.transcriptions 
FOR SELECT 
USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Policy for users to delete their own transcriptions
CREATE POLICY "Users can delete their own transcriptions" 
ON public.transcriptions 
FOR DELETE 
USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
