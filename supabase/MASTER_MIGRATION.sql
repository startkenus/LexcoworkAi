-- ============================================
-- LexCoworkAI - Complete Database Migration
-- ============================================
-- This file combines all migrations in the correct order
-- Run this in Supabase SQL Editor to set up your database
-- 
-- Project ID: idgfbmvfqyirgdowsxrm
-- SQL Editor: https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/sql/new
-- 
-- Generated: 2026-02-11T20:42:35.410Z
-- Total Migrations: 17
-- ============================================


-- ============================================
-- Migration 1/17: 000_create_base_schema.sql
-- ============================================

/*
  # LexCoworkAI Base Schema
  
  ## Overview
  Creates the foundational tables for the LexCoworkAI platform:
  - User profiles with roles (profiles)
  - Multi-tenancy support (tenants)
  - Core task management (tasks, task_steps)
  - Document management (documents)
  - Citation tracking (citations)
  
  ## Dependencies
  - Creates profiles FIRST to avoid circular dependencies
  - All other tables reference profiles and tenants
  
  ## Security
  - RLS enabled on all tables
  - Tenant-scoped policies ensure data isolation
*/

-- ============================================
-- PROFILES TABLE (Must be created FIRST)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID, -- Will be set after tenants table is created
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Basic policies for profiles (will be optimized later)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- ============================================
-- TENANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
  max_users INTEGER DEFAULT 5,
  max_storage_gb INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Policies for tenants
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
CREATE POLICY "Users can view their own tenant"
  ON public.tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update their tenant" ON public.tenants;
CREATE POLICY "Admins can update their tenant"
  ON public.tenants FOR UPDATE
  USING (
    id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'error')),
  jurisdiction JSONB DEFAULT '{}'::jsonb,
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  assigned_worker TEXT,
  recipe_id UUID,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies for tasks
DROP POLICY IF EXISTS "Users can view tasks in their tenant" ON public.tasks;
CREATE POLICY "Users can view tasks in their tenant"
  ON public.tasks FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert tasks in their tenant" ON public.tasks;
CREATE POLICY "Users can insert tasks in their tenant"
  ON public.tasks FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update tasks in their tenant" ON public.tasks;
CREATE POLICY "Users can update tasks in their tenant"
  ON public.tasks FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete tasks in their tenant" ON public.tasks;
CREATE POLICY "Users can delete tasks in their tenant"
  ON public.tasks FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON public.tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- ============================================
-- TASK_STEPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.task_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  worker_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')),
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.task_steps ENABLE ROW LEVEL SECURITY;

-- Policies for task_steps (inherit from tasks)
DROP POLICY IF EXISTS "Users can view task steps in their tenant" ON public.task_steps;
CREATE POLICY "Users can view task steps in their tenant"
  ON public.task_steps FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert task steps in their tenant" ON public.task_steps;
CREATE POLICY "Users can insert task steps in their tenant"
  ON public.task_steps FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM public.tasks WHERE tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update task steps in their tenant" ON public.task_steps;
CREATE POLICY "Users can update task steps in their tenant"
  ON public.task_steps FOR UPDATE
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Indexes for task_steps
CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON public.task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_task_steps_status ON public.task_steps(status);
CREATE INDEX IF NOT EXISTS idx_task_steps_step_number ON public.task_steps(step_number);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  storage_bucket TEXT DEFAULT 'documents',
  metadata JSONB DEFAULT '{}'::jsonb,
  processed BOOLEAN DEFAULT FALSE,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policies for documents
DROP POLICY IF EXISTS "Users can view documents in their tenant" ON public.documents;
CREATE POLICY "Users can view documents in their tenant"
  ON public.documents FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert documents in their tenant" ON public.documents;
CREATE POLICY "Users can insert documents in their tenant"
  ON public.documents FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update documents in their tenant" ON public.documents;
CREATE POLICY "Users can update documents in their tenant"
  ON public.documents FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete documents in their tenant" ON public.documents;
CREATE POLICY "Users can delete documents in their tenant"
  ON public.documents FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_task_id ON public.documents(task_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

-- ============================================
-- CITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  citation_text TEXT NOT NULL,
  page_number INTEGER,
  section TEXT,
  confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  context TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;

-- Policies for citations (inherit from tasks)
DROP POLICY IF EXISTS "Users can view citations in their tenant" ON public.citations;
CREATE POLICY "Users can view citations in their tenant"
  ON public.citations FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert citations in their tenant" ON public.citations;
CREATE POLICY "Users can insert citations in their tenant"
  ON public.citations FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM public.tasks WHERE tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update citations in their tenant" ON public.citations;
CREATE POLICY "Users can update citations in their tenant"
  ON public.citations FOR UPDATE
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Indexes for citations
CREATE INDEX IF NOT EXISTS idx_citations_task_id ON public.citations(task_id);
CREATE INDEX IF NOT EXISTS idx_citations_document_id ON public.citations(document_id);
CREATE INDEX IF NOT EXISTS idx_citations_confidence ON public.citations(confidence_score);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers (drop first to make idempotent)
DROP TRIGGER IF EXISTS set_updated_at_tenants ON public.tenants;
CREATE TRIGGER set_updated_at_tenants
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_tasks ON public.tasks;
CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_task_steps ON public.task_steps;
CREATE TRIGGER set_updated_at_task_steps
  BEFORE UPDATE ON public.task_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_documents ON public.documents;
CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- AUTO-PROFILE CREATION TRIGGER
-- ============================================

-- Function to automatically create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  default_tenant_id UUID;
BEGIN
  -- Get or create default tenant
  SELECT id INTO default_tenant_id
  FROM public.tenants
  WHERE domain = 'default.lexcoworkai.com';
  
  IF default_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, domain, subscription_tier)
    VALUES ('Default Organization', 'default.lexcoworkai.com', 'pro')
    RETURNING id INTO default_tenant_id;
  END IF;
  
  -- Create profile for new user
  INSERT INTO public.profiles (user_id, full_name, role, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'super_admin'
      ELSE 'user'
    END,
    default_tenant_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- DEFAULT TENANT & PROFILE SETUP
-- ============================================

-- Create default tenant
INSERT INTO public.tenants (id, name, domain, subscription_tier)
VALUES (
  gen_random_uuid(),
  'Default Organization',
  'default.lexcoworkai.com',
  'pro'
)
ON CONFLICT DO NOTHING;

-- Update existing profiles to use default tenant (if any)
UPDATE public.profiles
SET tenant_id = (SELECT id FROM public.tenants WHERE domain = 'default.lexcoworkai.com')
WHERE tenant_id IS NULL;

-- Add foreign key constraint now that tenants exist
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_tenant_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_tenant_id_fkey
FOREIGN KEY (tenant_id)
REFERENCES public.tenants(id)
ON DELETE CASCADE;

-- Create profile for existing user if not exists
INSERT INTO public.profiles (user_id, role, full_name, tenant_id)
VALUES (
  '1cad0354-425e-4f30-8f85-5b77786851cd'::uuid,
  'super_admin',
  'Admin User',
  (SELECT id FROM public.tenants WHERE domain = 'default.lexcoworkai.com')
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'super_admin',
  tenant_id = (SELECT id FROM public.tenants WHERE domain = 'default.lexcoworkai.com'),
  updated_at = NOW();



-- ============================================
-- Migration 2/17: 001_create_profiles_table.sql
-- ============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies (idempotent - safe to run multiple times)
-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow insert for authenticated users (for profile creation)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- NOTE: Auto-profile creation function and trigger are now in 000_create_base_schema.sql
-- Keeping this here for reference and backward compatibility

-- Create or replace function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  default_tenant_id UUID;
BEGIN
  -- Get or create default tenant
  SELECT id INTO default_tenant_id
  FROM public.tenants
  WHERE domain = 'default.lexcoworkai.com';
  
  IF default_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, domain, subscription_tier)
    VALUES ('Default Organization', 'default.lexcoworkai.com', 'pro')
    RETURNING id INTO default_tenant_id;
  END IF;
  
  -- Create profile for new user
  INSERT INTO public.profiles (user_id, full_name, role, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'super_admin'
      ELSE 'user'
    END,
    default_tenant_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (will replace if already exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();



-- ============================================
-- Migration 3/17: 20260206012125_fix_user_creation_logic.sql
-- ============================================

/*
  # Fix User Profile Creation Logic

  ## Changes
  1. **Fixed handle_new_user function**
     - Corrected the is_first_user check to properly detect when creating the first user
     - Since this is an AFTER INSERT trigger, COUNT(*) includes the newly inserted user
     - Changed logic from `COUNT(*) = 0` to `COUNT(*) <= 1` to properly make first user a super_admin
  
  ## Security
  - Function maintains SECURITY DEFINER to bypass RLS for profile creation
  - First user automatically becomes super_admin
  - Subsequent users default to regular 'user' role
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  default_tenant_id uuid;
  is_first_user boolean;
BEGIN
  -- Check if this is the first user (since trigger is AFTER INSERT, new user is included in count)
  SELECT COUNT(*) <= 1 INTO is_first_user FROM auth.users;
  
  -- Get or create default tenant
  SELECT id INTO default_tenant_id FROM tenants WHERE slug = 'acme-legal';
  
  IF default_tenant_id IS NULL THEN
    INSERT INTO tenants (name, slug, is_active)
    VALUES ('Acme Legal', 'acme-legal', true)
    RETURNING id INTO default_tenant_id;
  END IF;
  
  -- Insert profile (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.profiles (
    user_id,
    tenant_id,
    email,
    full_name,
    role
  ) VALUES (
    NEW.id,
    default_tenant_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE WHEN is_first_user THEN 'super_admin'::user_role ELSE 'user'::user_role END
  );
  
  RETURN NEW;
END;
$$;


-- ============================================
-- Migration 4/17: 20260206152936_add_v31_features_final.sql
-- ============================================

/*
  # LexCoworkAI v3.1 Feature Additions

  ## Overview
  Adds critical features for Cowork parity:
  - Risk Assessment with scoring
  - Vendor Intelligence tracking
  - Meeting Briefing system
  - Response Templates
  - Command History analytics

  ## New Tables
  1. risk_assessments - Risk scoring and assessment tracking
  2. vendors - Counterparty/vendor entity management
  3. vendor_agreements - Links vendors to documents
  4. vendor_key_terms - Extracted terms from agreements
  5. briefings - Meeting preparation summaries
  6. response_templates - Pre-approved response templates
  7. command_history - Command usage analytics

  ## Security
  All tables have RLS enabled with tenant-scoped policies
*/

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Risk Assessments Table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  document_id UUID,
  risk_score INTEGER CHECK (risk_score BETWEEN 1 AND 10),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_factors JSONB DEFAULT '[]'::jsonb,
  mitigations JSONB DEFAULT '[]'::jsonb,
  assessed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  escalated BOOLEAN DEFAULT FALSE,
  escalated_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  escalated_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  aliases TEXT[] DEFAULT ARRAY[]::TEXT[],
  jurisdiction TEXT,
  risk_profile TEXT CHECK (risk_profile IN ('low', 'medium', 'high', 'unknown')) DEFAULT 'unknown',
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  notes TEXT,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor Agreements Junction Table
CREATE TABLE IF NOT EXISTS vendor_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  document_id UUID NOT NULL,
  agreement_type TEXT,
  signed_date DATE,
  expiry_date DATE,
  status TEXT CHECK (status IN ('draft', 'pending', 'active', 'expired', 'terminated')) DEFAULT 'draft',
  renewal_terms TEXT,
  value_amount DECIMAL(15, 2),
  value_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor Key Terms Table
CREATE TABLE IF NOT EXISTS vendor_key_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_agreement_id UUID REFERENCES vendor_agreements(id) ON DELETE CASCADE NOT NULL,
  term_type TEXT NOT NULL,
  term_value TEXT NOT NULL,
  term_section TEXT,
  is_standard BOOLEAN DEFAULT FALSE,
  is_negotiated BOOLEAN DEFAULT FALSE,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Briefings Table
CREATE TABLE IF NOT EXISTS briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  meeting_date DATE,
  meeting_time TIME,
  attendees TEXT[],
  content JSONB DEFAULT '{}'::jsonb,
  document_ids UUID[] DEFAULT ARRAY[]::UUID[],
  task_ids UUID[] DEFAULT ARRAY[]::UUID[],
  status TEXT CHECK (status IN ('draft', 'final', 'archived')) DEFAULT 'draft',
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Response Templates Table
CREATE TABLE IF NOT EXISTS response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  jurisdiction TEXT,
  tone TEXT CHECK (tone IN ('formal', 'internal', 'friendly')) DEFAULT 'formal',
  status TEXT CHECK (status IN ('draft', 'approved', 'archived')) DEFAULT 'draft',
  variables JSONB DEFAULT '[]'::jsonb,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Command History Table
CREATE TABLE IF NOT EXISTS command_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  command TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  worker_id TEXT,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  execution_time_ms INTEGER,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_risk_assessments_document ON risk_assessments(document_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk_level ON risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_task ON risk_assessments(task_id);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendor_agreements_vendor ON vendor_agreements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_agreements_status ON vendor_agreements(status);
CREATE INDEX IF NOT EXISTS idx_vendor_agreements_expiry ON vendor_agreements(expiry_date);
CREATE INDEX IF NOT EXISTS idx_vendor_key_terms_agreement ON vendor_key_terms(vendor_agreement_id);
CREATE INDEX IF NOT EXISTS idx_vendor_key_terms_type ON vendor_key_terms(term_type);
CREATE INDEX IF NOT EXISTS idx_briefings_user ON briefings(user_id);
CREATE INDEX IF NOT EXISTS idx_briefings_meeting_date ON briefings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_response_templates_category ON response_templates(category);
CREATE INDEX IF NOT EXISTS idx_response_templates_status ON response_templates(status);
CREATE INDEX IF NOT EXISTS idx_command_history_user ON command_history(user_id);
CREATE INDEX IF NOT EXISTS idx_command_history_executed ON command_history(executed_at DESC);

-- Enable RLS
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_key_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for risk_assessments
DROP POLICY IF EXISTS "Users can view risk assessments in their tenant" ON risk_assessments;
CREATE POLICY "Users can view risk assessments in their tenant"
  ON risk_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.tenant_id = p2.tenant_id
      WHERE p1.user_id = auth.uid()
      AND p2.id = risk_assessments.assessed_by
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Users can create risk assessments" ON risk_assessments;
CREATE POLICY "Users can create risk assessments"
  ON risk_assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = risk_assessments.assessed_by
      AND profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own risk assessments" ON risk_assessments;
CREATE POLICY "Users can update their own risk assessments"
  ON risk_assessments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = risk_assessments.assessed_by
      AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = risk_assessments.assessed_by
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for vendors
DROP POLICY IF EXISTS "Users can view vendors in their tenant" ON vendors;
CREATE POLICY "Users can view vendors in their tenant"
  ON vendors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = vendors.tenant_id
    )
  );

DROP POLICY IF EXISTS "Users can create vendors in their tenant" ON vendors;
CREATE POLICY "Users can create vendors in their tenant"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = vendors.tenant_id
    )
  );

DROP POLICY IF EXISTS "Users can update vendors in their tenant" ON vendors;
CREATE POLICY "Users can update vendors in their tenant"
  ON vendors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = vendors.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = vendors.tenant_id
    )
  );

-- RLS Policies for vendor_agreements
DROP POLICY IF EXISTS "Users can view vendor agreements in their tenant" ON vendor_agreements;
CREATE POLICY "Users can view vendor agreements in their tenant"
  ON vendor_agreements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN profiles ON profiles.tenant_id = vendors.tenant_id
      WHERE vendors.id = vendor_agreements.vendor_id
      AND profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create vendor agreements in their tenant" ON vendor_agreements;
CREATE POLICY "Users can create vendor agreements in their tenant"
  ON vendor_agreements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN profiles ON profiles.tenant_id = vendors.tenant_id
      WHERE vendors.id = vendor_agreements.vendor_id
      AND profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update vendor agreements in their tenant" ON vendor_agreements;
CREATE POLICY "Users can update vendor agreements in their tenant"
  ON vendor_agreements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN profiles ON profiles.tenant_id = vendors.tenant_id
      WHERE vendors.id = vendor_agreements.vendor_id
      AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN profiles ON profiles.tenant_id = vendors.tenant_id
      WHERE vendors.id = vendor_agreements.vendor_id
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for vendor_key_terms
DROP POLICY IF EXISTS "Users can view vendor key terms in their tenant" ON vendor_key_terms;
CREATE POLICY "Users can view vendor key terms in their tenant"
  ON vendor_key_terms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendor_agreements
      JOIN vendors ON vendors.id = vendor_agreements.vendor_id
      JOIN profiles ON profiles.tenant_id = vendors.tenant_id
      WHERE vendor_agreements.id = vendor_key_terms.vendor_agreement_id
      AND profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create vendor key terms" ON vendor_key_terms;
CREATE POLICY "Users can create vendor key terms"
  ON vendor_key_terms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendor_agreements
      JOIN vendors ON vendors.id = vendor_agreements.vendor_id
      JOIN profiles ON profiles.tenant_id = vendors.tenant_id
      WHERE vendor_agreements.id = vendor_key_terms.vendor_agreement_id
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for briefings
DROP POLICY IF EXISTS "Users can view their own briefings" ON briefings;
CREATE POLICY "Users can view their own briefings"
  ON briefings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = briefings.user_id
      AND profiles.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = briefings.tenant_id
      AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Users can create briefings in their tenant" ON briefings;
CREATE POLICY "Users can create briefings in their tenant"
  ON briefings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = briefings.user_id
      AND profiles.user_id = auth.uid()
      AND profiles.tenant_id = briefings.tenant_id
    )
  );

DROP POLICY IF EXISTS "Users can update their own briefings" ON briefings;
CREATE POLICY "Users can update their own briefings"
  ON briefings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = briefings.user_id
      AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = briefings.user_id
      AND profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own briefings" ON briefings;
CREATE POLICY "Users can delete their own briefings"
  ON briefings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = briefings.user_id
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for response_templates
DROP POLICY IF EXISTS "Users can view approved templates in their tenant" ON response_templates;
CREATE POLICY "Users can view approved templates in their tenant"
  ON response_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = response_templates.tenant_id
    )
    AND (
      status = 'approved'
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = response_templates.created_by
        AND profiles.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can create templates in their tenant" ON response_templates;
CREATE POLICY "Users can create templates in their tenant"
  ON response_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = response_templates.created_by
      AND profiles.user_id = auth.uid()
      AND profiles.tenant_id = response_templates.tenant_id
    )
  );

DROP POLICY IF EXISTS "Admins can update templates in their tenant" ON response_templates;
CREATE POLICY "Admins can update templates in their tenant"
  ON response_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = response_templates.tenant_id
      AND (
        profiles.role = 'super_admin'
        OR profiles.id = response_templates.created_by
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = response_templates.tenant_id
      AND (
        profiles.role = 'super_admin'
        OR profiles.id = response_templates.created_by
      )
    )
  );

-- RLS Policies for command_history
DROP POLICY IF EXISTS "Users can view their own command history" ON command_history;
CREATE POLICY "Users can view their own command history"
  ON command_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = command_history.user_id
      AND profiles.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = command_history.tenant_id
      AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Users can create command history" ON command_history;
CREATE POLICY "Users can create command history"
  ON command_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = command_history.user_id
      AND profiles.user_id = auth.uid()
      AND profiles.tenant_id = command_history.tenant_id
    )
  );

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_risk_assessments_updated_at') THEN
    CREATE TRIGGER update_risk_assessments_updated_at
      BEFORE UPDATE ON risk_assessments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vendors_updated_at') THEN
    CREATE TRIGGER update_vendors_updated_at
      BEFORE UPDATE ON vendors
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vendor_agreements_updated_at') THEN
    CREATE TRIGGER update_vendor_agreements_updated_at
      BEFORE UPDATE ON vendor_agreements
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_briefings_updated_at') THEN
    CREATE TRIGGER update_briefings_updated_at
      BEFORE UPDATE ON briefings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_response_templates_updated_at') THEN
    CREATE TRIGGER update_response_templates_updated_at
      BEFORE UPDATE ON response_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;


-- ============================================
-- Migration 5/17: 20260206183259_add_task_type_column.sql
-- ============================================

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


-- ============================================
-- Migration 6/17: 20260207024826_add_deliverable_type_column.sql
-- ============================================

/*
  # Add deliverable_type Column to Tasks Table
  
  ## Summary
  This migration adds support for specific task deliverable types, enabling the system
  to handle all 76 specialized task deliverables defined in the legal operations framework.
  
  ## Changes
  1. **Added deliverable_type column**
     - Stores the specific deliverable type being requested (e.g., 'nda_quick', 'full_analysis')
     - TEXT type for flexibility across all 76 deliverable types
     - Optional field that complements the task_type
  
  2. **Index for performance**
     - Composite index on (task_type, deliverable_type) for efficient filtering
  
  ## Deliverable Types by Worker
  - Contract Review: full_analysis, risk_analysis, redline, playbook, nda_quick, saas_review, 
    msa_review, employment_review, vendor_review, realestate_review
  - Policy Drafting: full_draft, amendment, gap_analysis, multi_jurisdiction, privacy_policy,
    infosec_policy, ethics_policy, remote_work_policy, social_media_policy
  - Compliance Check: audit_report, gap_analysis, remediation_plan, policy_check, gdpr_assessment,
    ccpa_compliance, soc2_iso_compliance, hipaa_compliance, financial_regulations, export_control
  - Legal Research: research_memo, case_law_summary, statutory_analysis, jurisdiction_comparison,
    clause_precedent, ip_research, employment_law, litigation_strategy, regulatory_update
  - Intake: general_intake, categorization, triage, initial_analysis, nda_triage, vendor_intake,
    employment_intake, litigation_intake, privacy_intake, ip_intake, ma_intake, regulatory_intake
  - Risk Assessment: risk_analysis_report, risk_matrix, mitigation_plan, risk_comparison,
    litigation_risk, regulatory_risk, contract_risk, vendor_risk, product_launch_risk
  - Vendor Intelligence: vendor_summary, agreement_comparison, key_terms, amendment_history,
    renewal_analysis, consolidation_analysis, vendor_risk_profile, spend_analysis, competitive_comparison
  - Briefing: executive_brief, document_summary, action_items, decision_log, board_brief,
    negotiation_brief, due_diligence_brief, litigation_brief
  
  ## Important Notes
  - This enables specialization of worker outputs based on specific deliverable types
  - Workers will use deliverable_type to customize their prompts and analysis approaches
  - Backward compatible: NULL deliverable_type defaults to general task handling
*/

-- Add deliverable_type column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'deliverable_type'
  ) THEN
    ALTER TABLE tasks 
    ADD COLUMN deliverable_type TEXT;
  END IF;
END $$;

-- Add composite index for efficient filtering by task_type and deliverable_type
CREATE INDEX IF NOT EXISTS idx_tasks_type_deliverable 
  ON tasks(task_type, deliverable_type);

-- Add comment for documentation
COMMENT ON COLUMN tasks.deliverable_type IS 'Specific deliverable type (e.g., nda_quick, full_analysis) - see task-creator.tsx TASK_DELIVERABLES for full list';


-- ============================================
-- Migration 7/17: 20260207045458_add_failed_status_to_enums.sql
-- ============================================

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



-- ============================================
-- Migration 8/17: 20260207234959_add_missing_foreign_key_indexes.sql
-- ============================================

/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add indexes for all unindexed foreign keys
    - Improves JOIN performance and query optimization
    
  2. Tables Affected
    - briefings, citations, command_history, document_versions
    - documents, rag_chunks, rag_sources, recipes
    - response_templates, risk_assessments, tasks, vendors
*/

CREATE INDEX IF NOT EXISTS idx_briefings_tenant_id ON public.briefings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_citations_chunk_id ON public.citations(chunk_id);
CREATE INDEX IF NOT EXISTS idx_citations_source_id ON public.citations(source_id);
CREATE INDEX IF NOT EXISTS idx_citations_task_step_id ON public.citations(task_step_id);
CREATE INDEX IF NOT EXISTS idx_command_history_tenant_id ON public.command_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_by ON public.document_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON public.documents(created_by);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_tenant_id ON public.rag_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rag_sources_approved_by ON public.rag_sources(approved_by);
CREATE INDEX IF NOT EXISTS idx_rag_sources_uploaded_by ON public.rag_sources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON public.recipes(created_by);
CREATE INDEX IF NOT EXISTS idx_recipes_tenant_id ON public.recipes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_response_templates_approved_by ON public.response_templates(approved_by);
CREATE INDEX IF NOT EXISTS idx_response_templates_created_by ON public.response_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_response_templates_tenant_id ON public.response_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_assessed_by ON public.risk_assessments(assessed_by);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_escalated_to ON public.risk_assessments(escalated_to);
CREATE INDEX IF NOT EXISTS idx_tasks_approved_by ON public.tasks(approved_by);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_vendors_created_by ON public.vendors(created_by);


-- ============================================
-- Migration 9/17: 20260207235054_optimize_rls_profiles_only.sql
-- ============================================

/*
  # Optimize RLS Policies - Profiles Only

  1. Performance Improvements
    - Replace auth function calls with subqueries
    - Table: profiles
*/

-- Profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));


-- ============================================
-- Migration 10/17: 20260207235103_optimize_rls_risk_assessments.sql
-- ============================================

/*
  # Optimize RLS Policies - Risk Assessments

  1. Performance Improvements
    - Replace auth function calls with subqueries
    - Risk assessments link to tasks, not directly to tenants
*/

DROP POLICY IF EXISTS "Users can view risk assessments in their tenant" ON public.risk_assessments;
CREATE POLICY "Users can view risk assessments in their tenant" ON public.risk_assessments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = risk_assessments.task_id
      AND t.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can create risk assessments" ON public.risk_assessments;
CREATE POLICY "Users can create risk assessments" ON public.risk_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = risk_assessments.task_id
      AND t.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own risk assessments" ON public.risk_assessments;
CREATE POLICY "Users can update their own risk assessments" ON public.risk_assessments
  FOR UPDATE
  TO authenticated
  USING (
    assessed_by = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = risk_assessments.task_id
      AND t.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    assessed_by = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = risk_assessments.task_id
      AND t.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  );


-- ============================================
-- Migration 11/17: 20260207235127_optimize_rls_vendors_agreements.sql
-- ============================================

/*
  # Optimize RLS Policies - Vendors and Vendor Agreements

  1. Performance Improvements
    - Replace auth function calls with subqueries
    - Tables: vendors, vendor_agreements
*/

-- Vendors table policies
DROP POLICY IF EXISTS "Users can view vendors in their tenant" ON public.vendors;
CREATE POLICY "Users can view vendors in their tenant" ON public.vendors
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create vendors in their tenant" ON public.vendors;
CREATE POLICY "Users can create vendors in their tenant" ON public.vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update vendors in their tenant" ON public.vendors;
CREATE POLICY "Users can update vendors in their tenant" ON public.vendors
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

-- Vendor agreements table policies
DROP POLICY IF EXISTS "Users can view vendor agreements in their tenant" ON public.vendor_agreements;
CREATE POLICY "Users can view vendor agreements in their tenant" ON public.vendor_agreements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_agreements.vendor_id
      AND v.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can create vendor agreements in their tenant" ON public.vendor_agreements;
CREATE POLICY "Users can create vendor agreements in their tenant" ON public.vendor_agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_agreements.vendor_id
      AND v.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can update vendor agreements in their tenant" ON public.vendor_agreements;
CREATE POLICY "Users can update vendor agreements in their tenant" ON public.vendor_agreements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_agreements.vendor_id
      AND v.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_agreements.vendor_id
      AND v.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  );


-- ============================================
-- Migration 12/17: 20260207235135_optimize_rls_vendor_key_terms.sql
-- ============================================

/*
  # Optimize RLS Policies - Vendor Key Terms

  1. Performance Improvements
    - Replace auth function calls with subqueries
    - Table: vendor_key_terms
*/

-- Vendor key terms table policies
DROP POLICY IF EXISTS "Users can view vendor key terms in their tenant" ON public.vendor_key_terms;
CREATE POLICY "Users can view vendor key terms in their tenant" ON public.vendor_key_terms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_agreements va
      JOIN public.vendors v ON v.id = va.vendor_id
      WHERE va.id = vendor_key_terms.vendor_agreement_id
      AND v.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can create vendor key terms" ON public.vendor_key_terms;
CREATE POLICY "Users can create vendor key terms" ON public.vendor_key_terms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendor_agreements va
      JOIN public.vendors v ON v.id = va.vendor_id
      WHERE va.id = vendor_key_terms.vendor_agreement_id
      AND v.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  );


-- ============================================
-- Migration 13/17: 20260207235202_optimize_rls_briefings_templates.sql
-- ============================================

/*
  # Optimize RLS Policies - Briefings and Templates

  1. Performance Improvements
    - Replace auth function calls with subqueries
    - Tables: briefings, response_templates, command_history
*/

-- Briefings table policies
DROP POLICY IF EXISTS "Users can view their own briefings" ON public.briefings;
CREATE POLICY "Users can view their own briefings" ON public.briefings
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create briefings in their tenant" ON public.briefings;
CREATE POLICY "Users can create briefings in their tenant" ON public.briefings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own briefings" ON public.briefings;
CREATE POLICY "Users can update their own briefings" ON public.briefings
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete their own briefings" ON public.briefings;
CREATE POLICY "Users can delete their own briefings" ON public.briefings
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

-- Response templates table policies
DROP POLICY IF EXISTS "Users can view approved templates in their tenant" ON public.response_templates;
CREATE POLICY "Users can view approved templates in their tenant" ON public.response_templates
  FOR SELECT
  TO authenticated
  USING (
    status = 'APPROVED' AND
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create templates in their tenant" ON public.response_templates;
CREATE POLICY "Users can create templates in their tenant" ON public.response_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can update templates in their tenant" ON public.response_templates;
CREATE POLICY "Admins can update templates in their tenant" ON public.response_templates
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'super_admin'
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'super_admin'
    )
  );

-- Command history table policies
DROP POLICY IF EXISTS "Users can view their own command history" ON public.command_history;
CREATE POLICY "Users can view their own command history" ON public.command_history
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) AND
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create command history" ON public.command_history;
CREATE POLICY "Users can create command history" ON public.command_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()) AND
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );


-- ============================================
-- Migration 14/17: 20260207235217_fix_always_true_rls_policies.sql
-- ============================================

/*
  # Fix Always-True RLS Policies

  1. Security Improvements
    - Strengthen policies that were effectively bypassing row-level security
    - Tables: audit_logs, citations, document_versions, task_steps
    
  2. Changes
    - audit_logs: Restrict to user's tenant
    - citations: Restrict to tasks owned by user's tenant
    - document_versions: Restrict to documents owned by user's tenant
    - task_steps: Restrict to tasks owned by user's tenant
*/

-- Audit logs - restrict to tenant
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;
CREATE POLICY "System can create audit logs" ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

-- Citations - restrict to tasks owned by user's tenant
DROP POLICY IF EXISTS "System can create citations" ON public.citations;
CREATE POLICY "System can create citations" ON public.citations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = citations.task_id
      AND t.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  );

-- Document versions - restrict to documents owned by user's tenant
DROP POLICY IF EXISTS "System can create document versions" ON public.document_versions;
CREATE POLICY "System can create document versions" ON public.document_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_versions.document_id
      AND d.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  );

-- Task steps - restrict to tasks owned by user's tenant
DROP POLICY IF EXISTS "System can manage task steps" ON public.task_steps;
CREATE POLICY "System can manage task steps" ON public.task_steps
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_steps.task_id
      AND t.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_steps.task_id
      AND t.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  );


-- ============================================
-- Migration 15/17: 20260207235237_fix_function_search_paths_v2.sql
-- ============================================

/*
  # Fix Function Search Paths

  1. Security Improvements
    - Set secure search paths for functions to prevent schema injection attacks
    - Functions: user_tenant_ids, is_super_admin, update_updated_at_column
    
  2. Changes
    - All functions now have explicit search_path = public
    - Prevents malicious schema manipulation
*/

CREATE OR REPLACE FUNCTION public.user_tenant_ids(user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(tenant_id)
  FROM public.profiles
  WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
    AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ============================================
-- Migration 16/17: 20260207235250_move_extensions_from_public_schema.sql
-- ============================================

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


-- ============================================
-- Migration 17/17: 20260207235455_remove_duplicate_indexes.sql
-- ============================================

/*
  # Remove Duplicate Indexes

  1. Performance Improvements
    - Remove duplicate indexes to reduce storage overhead
    - Each table had indexes created twice (with and without _fk suffix)
    - Keeping the original indexes, removing the _fk suffixed duplicates
    
  2. Tables Affected
    - briefings, citations, command_history, document_versions
    - documents, rag_chunks, rag_sources, recipes
    - response_templates, risk_assessments, tasks, vendors
*/

-- Drop duplicate indexes (keeping the first ones without _fk suffix)
DROP INDEX IF EXISTS public.idx_briefings_tenant_id_fk;
DROP INDEX IF EXISTS public.idx_citations_chunk_id_fk;
DROP INDEX IF EXISTS public.idx_citations_source_id_fk;
DROP INDEX IF EXISTS public.idx_citations_task_step_id_fk;
DROP INDEX IF EXISTS public.idx_command_history_tenant_id_fk;
DROP INDEX IF EXISTS public.idx_document_versions_created_by_fk;
DROP INDEX IF EXISTS public.idx_documents_created_by_fk;
DROP INDEX IF EXISTS public.idx_rag_chunks_tenant_id_fk;
DROP INDEX IF EXISTS public.idx_rag_sources_approved_by_fk;
DROP INDEX IF EXISTS public.idx_rag_sources_uploaded_by_fk;
DROP INDEX IF EXISTS public.idx_recipes_created_by_fk;
DROP INDEX IF EXISTS public.idx_recipes_tenant_id_fk;
DROP INDEX IF EXISTS public.idx_response_templates_approved_by_fk;
DROP INDEX IF EXISTS public.idx_response_templates_created_by_fk;
DROP INDEX IF EXISTS public.idx_response_templates_tenant_id_fk;
DROP INDEX IF EXISTS public.idx_risk_assessments_assessed_by_fk;
DROP INDEX IF EXISTS public.idx_risk_assessments_escalated_to_fk;
DROP INDEX IF EXISTS public.idx_tasks_approved_by_fk;
DROP INDEX IF EXISTS public.idx_tasks_parent_task_id_fk;
DROP INDEX IF EXISTS public.idx_vendors_created_by_fk;


-- ============================================
-- Final Setup: Create Profile for Existing User
-- ============================================

-- Create or update profile for your existing user
INSERT INTO public.profiles (user_id, role, full_name)
VALUES (
  '1cad0354-425e-4f30-8f85-5b77786851cd'::uuid,
  'super_admin',
  'Admin User'
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'super_admin',
  updated_at = NOW();

-- ============================================
-- Migration Complete! ✅
-- ============================================
-- All 17 migrations have been applied.
-- Your database is now ready to use!
-- ============================================
