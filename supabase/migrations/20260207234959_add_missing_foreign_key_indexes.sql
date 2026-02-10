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