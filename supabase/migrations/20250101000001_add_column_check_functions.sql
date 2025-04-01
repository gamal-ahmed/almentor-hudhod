
-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION public.check_column_exists(
  table_name text,
  column_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = $1
    AND column_name = $2
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$;

-- Function to add a column to a table if it doesn't exist
CREATE OR REPLACE FUNCTION public.add_column_if_not_exists(
  table_name text,
  column_name text,
  column_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = $1
    AND column_name = $2
  ) THEN
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I %s', $1, $2, $3);
  END IF;
END;
$$;
