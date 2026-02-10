/*
  # Move Extensions from Public Schema

  1. Security Improvements
    - Move vector and pg_trgm extensions to extensions schema
    - Keeps public schema clean and follows best practices
    
  2. Changes
    - Create extensions schema if not exists
    - Move vector extension to extensions schema
    - Move pg_trgm extension to extensions schema
*/

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move vector extension if it exists in public schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension
    WHERE extname = 'vector'
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION vector SET SCHEMA extensions;
  END IF;
END $$;

-- Move pg_trgm extension if it exists in public schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension
    WHERE extname = 'pg_trgm'
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
END $$;