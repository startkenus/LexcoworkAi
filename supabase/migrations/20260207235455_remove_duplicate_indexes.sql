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
DROP INDEX IF EXISTS public.idx_documents_uploaded_by_fk;
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