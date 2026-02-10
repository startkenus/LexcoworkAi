/*
  # Add FAILED status to task and step status enums

  1. Changes
    - Add 'FAILED' to task_status enum
    - Add 'FAILED' to step_status enum (if not exists)
  
  2. Security
    - No security changes needed
*/

-- Add FAILED to task_status enum
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'FAILED' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'task_status')
  ) THEN
    ALTER TYPE task_status ADD VALUE 'FAILED';
  END IF;
END $$;

-- Add FAILED to step_status enum
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'FAILED' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'step_status')
  ) THEN
    ALTER TYPE step_status ADD VALUE 'FAILED';
  END IF;
END $$;
