/*
  # Add task_type Column to Tasks Table

  ## Changes
  1. **Added task_type column**
     - Stores the type of legal task/worker being executed
     - Enum with values for all 8 worker types
     - Required field (NOT NULL) with default value
  
  ## Task Types
  - contract_review
  - policy_drafting
  - compliance_check
  - legal_research
  - intake
  - risk_assessment
  - vendor_intelligence
  - briefing
*/

-- Create enum for task types
DO $$ BEGIN
  CREATE TYPE task_type AS ENUM (
    'contract_review',
    'policy_drafting',
    'compliance_check',
    'legal_research',
    'intake',
    'risk_assessment',
    'vendor_intelligence',
    'briefing'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add task_type column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'task_type'
  ) THEN
    ALTER TABLE tasks 
    ADD COLUMN task_type task_type DEFAULT 'contract_review'::task_type;
  END IF;
END $$;

-- Add index for task_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);

-- Add columns for jurisdiction at task level (replacing the jsonb field)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'jurisdiction_country'
  ) THEN
    ALTER TABLE tasks 
    ADD COLUMN jurisdiction_country TEXT DEFAULT 'US';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'jurisdiction_state'
  ) THEN
    ALTER TABLE tasks 
    ADD COLUMN jurisdiction_state TEXT;
  END IF;
END $$;

-- Add columns for task approvals (for review workflow)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE tasks 
    ADD COLUMN approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE tasks 
    ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'error'
  ) THEN
    ALTER TABLE tasks 
    ADD COLUMN error TEXT;
  END IF;
END $$;