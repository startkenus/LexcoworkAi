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