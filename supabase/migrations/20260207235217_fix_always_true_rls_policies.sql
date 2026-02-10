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