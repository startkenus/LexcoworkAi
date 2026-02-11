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
-- EXTENSIONS
-- ============================================

-- Enable vector extension for RAG embeddings
CREATE EXTENSION IF NOT EXISTS vector;

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
-- ENUMS
-- ============================================

-- Task status enum
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled',
    'error',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Task step status enum
DO $$ BEGIN
  CREATE TYPE step_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed',
    'skipped'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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
  status task_status NOT NULL DEFAULT 'pending',
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
  status step_status NOT NULL DEFAULT 'pending',
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
  task_step_id UUID REFERENCES public.task_steps(id) ON DELETE CASCADE NOT NULL,
  source_id TEXT,
  chunk_id TEXT,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  citation_text TEXT NOT NULL,
  page_number INTEGER,
  section TEXT,
  relevance_score REAL CHECK (relevance_score >= 0 AND relevance_score <= 1),
  confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  context_used TEXT,
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
CREATE INDEX IF NOT EXISTS idx_citations_task_step_id ON public.citations(task_step_id);
CREATE INDEX IF NOT EXISTS idx_citations_source_id ON public.citations(source_id);
CREATE INDEX IF NOT EXISTS idx_citations_chunk_id ON public.citations(chunk_id);
CREATE INDEX IF NOT EXISTS idx_citations_document_id ON public.citations(document_id);
CREATE INDEX IF NOT EXISTS idx_citations_confidence ON public.citations(confidence_score);
CREATE INDEX IF NOT EXISTS idx_citations_relevance ON public.citations(relevance_score);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for audit_logs
DROP POLICY IF EXISTS "Users can view audit logs in their tenant" ON public.audit_logs;
CREATE POLICY "Users can view audit logs in their tenant"
  ON public.audit_logs FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ============================================
-- DOCUMENT VERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  changes_summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Policies for document_versions
DROP POLICY IF EXISTS "Users can view document versions in their tenant" ON public.document_versions;
CREATE POLICY "Users can view document versions in their tenant"
  ON public.document_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_versions.document_id
      AND d.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Indexes for document_versions
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_by ON public.document_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_document_versions_version ON public.document_versions(document_id, version_number);

-- ============================================
-- RAG SOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.rag_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('document', 'url', 'text', 'api')),
  source_url TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.rag_sources ENABLE ROW LEVEL SECURITY;

-- Policies for rag_sources
DROP POLICY IF EXISTS "Users can view rag sources in their tenant" ON public.rag_sources;
CREATE POLICY "Users can view rag sources in their tenant"
  ON public.rag_sources FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert rag sources in their tenant" ON public.rag_sources;
CREATE POLICY "Users can insert rag sources in their tenant"
  ON public.rag_sources FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Indexes for rag_sources
CREATE INDEX IF NOT EXISTS idx_rag_sources_tenant_id ON public.rag_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rag_sources_status ON public.rag_sources(status);
CREATE INDEX IF NOT EXISTS idx_rag_sources_uploaded_by ON public.rag_sources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_rag_sources_approved_by ON public.rag_sources(approved_by);

-- ============================================
-- RAG CHUNKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.rag_sources(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;

-- Policies for rag_chunks
DROP POLICY IF EXISTS "Users can view rag chunks in their tenant" ON public.rag_chunks;
CREATE POLICY "Users can view rag chunks in their tenant"
  ON public.rag_chunks FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Indexes for rag_chunks
CREATE INDEX IF NOT EXISTS idx_rag_chunks_source_id ON public.rag_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_tenant_id ON public.rag_chunks(tenant_id);

-- ============================================
-- RECIPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  workflow_definition JSONB NOT NULL,
  input_schema JSONB,
  output_schema JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Policies for recipes
DROP POLICY IF EXISTS "Users can view recipes in their tenant" ON public.recipes;
CREATE POLICY "Users can view recipes in their tenant"
  ON public.recipes FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR is_public = TRUE
  );

DROP POLICY IF EXISTS "Users can insert recipes in their tenant" ON public.recipes;
CREATE POLICY "Users can insert recipes in their tenant"
  ON public.recipes FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their tenant recipes" ON public.recipes;
CREATE POLICY "Users can update their tenant recipes"
  ON public.recipes FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Indexes for recipes
CREATE INDEX IF NOT EXISTS idx_recipes_tenant_id ON public.recipes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON public.recipes(created_by);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON public.recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON public.recipes(is_public);

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

DROP TRIGGER IF EXISTS set_updated_at_rag_sources ON public.rag_sources;
CREATE TRIGGER set_updated_at_rag_sources
  BEFORE UPDATE ON public.rag_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_recipes ON public.recipes;
CREATE TRIGGER set_updated_at_recipes
  BEFORE UPDATE ON public.recipes
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
