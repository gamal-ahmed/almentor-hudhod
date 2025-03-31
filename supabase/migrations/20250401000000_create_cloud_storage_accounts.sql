
-- Create cloud_storage_accounts table
CREATE TABLE IF NOT EXISTS public.cloud_storage_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google-drive', 'dropbox')),
  email TEXT NOT NULL,
  name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_used TIMESTAMP WITH TIME ZONE,
  UNIQUE (user_id, provider, email)
);

-- Add RLS policies
ALTER TABLE public.cloud_storage_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own cloud storage accounts
CREATE POLICY "Users can view their own cloud storage accounts"
  ON public.cloud_storage_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own cloud storage accounts
CREATE POLICY "Users can insert their own cloud storage accounts"
  ON public.cloud_storage_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own cloud storage accounts
CREATE POLICY "Users can update their own cloud storage accounts"
  ON public.cloud_storage_accounts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can only delete their own cloud storage accounts
CREATE POLICY "Users can delete their own cloud storage accounts"
  ON public.cloud_storage_accounts
  FOR DELETE
  USING (auth.uid() = user_id);
