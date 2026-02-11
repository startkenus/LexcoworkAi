-- ============================================
-- LexCoworkAI - Complete Database Setup
-- Run this script in Supabase SQL Editor to create all tables
-- ============================================
-- Project: idgfbmvfqyirgdowsxrm
-- URL: https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/sql/new
-- ============================================

\echo '============================================'
\echo 'Starting LexCoworkAI Database Migration'
\echo 'Total: 16 migrations to execute'
\echo '============================================'

-- ============================================
-- Migration 1: Create Profiles Table
-- ============================================
\echo 'Running: 001_create_profiles_table.sql'

\ir migrations/001_create_profiles_table.sql

-- ============================================
-- Migration 2: Fix User Creation Logic
-- ============================================
\echo 'Running: 20260206012125_fix_user_creation_logic.sql'

\ir migrations/20260206012125_fix_user_creation_logic.sql

-- ============================================
-- Migration 3: Add v3.1 Features
-- ============================================
\echo 'Running: 20260206152936_add_v31_features_final.sql'

\ir migrations/20260206152936_add_v31_features_final.sql

-- ============================================
-- Migration 4: Add Task Type Column
-- ============================================
\echo 'Running: 20260206183259_add_task_type_column.sql'

\ir migrations/20260206183259_add_task_type_column.sql

-- ============================================
-- Migration 5: Add Deliverable Type Column
-- ============================================
\echo 'Running: 20260207024826_add_deliverable_type_column.sql'

\ir migrations/20260207024826_add_deliverable_type_column.sql

-- ============================================
-- Migration 6: Add Failed Status to Enums
-- ============================================
\echo 'Running: 20260207045458_add_failed_status_to_enums.sql'

\ir migrations/20260207045458_add_failed_status_to_enums.sql

-- ============================================
-- Migration 7: Add Missing Foreign Key Indexes
-- ============================================
\echo 'Running: 20260207234959_add_missing_foreign_key_indexes.sql'

\ir migrations/20260207234959_add_missing_foreign_key_indexes.sql

-- ============================================
-- Migration 8: Optimize RLS for Profiles Only
-- ============================================
\echo 'Running: 20260207235054_optimize_rls_profiles_only.sql'

\ir migrations/20260207235054_optimize_rls_profiles_only.sql

-- ============================================
-- Migration 9: Optimize RLS for Risk Assessments
-- ============================================
\echo 'Running: 20260207235103_optimize_rls_risk_assessments.sql'

\ir migrations/20260207235103_optimize_rls_risk_assessments.sql

-- ============================================
-- Migration 10: Optimize RLS for Vendors & Agreements
-- ============================================
\echo 'Running: 20260207235127_optimize_rls_vendors_agreements.sql'

\ir migrations/20260207235127_optimize_rls_vendors_agreements.sql

-- ============================================
-- Migration 11: Optimize RLS for Vendor Key Terms
-- ============================================
\echo 'Running: 20260207235135_optimize_rls_vendor_key_terms.sql'

\ir migrations/20260207235135_optimize_rls_vendor_key_terms.sql

-- ============================================
-- Migration 12: Optimize RLS for Briefings & Templates
-- ============================================
\echo 'Running: 20260207235202_optimize_rls_briefings_templates.sql'

\ir migrations/20260207235202_optimize_rls_briefings_templates.sql

-- ============================================
-- Migration 13: Fix Always True RLS Policies
-- ============================================
\echo 'Running: 20260207235217_fix_always_true_rls_policies.sql'

\ir migrations/20260207235217_fix_always_true_rls_policies.sql

-- ============================================
-- Migration 14: Fix Function Search Paths v2
-- ============================================
\echo 'Running: 20260207235237_fix_function_search_paths_v2.sql'

\ir migrations/20260207235237_fix_function_search_paths_v2.sql

-- ============================================
-- Migration 15: Move Extensions from Public Schema
-- ============================================
\echo 'Running: 20260207235250_move_extensions_from_public_schema.sql'

\ir migrations/20260207235250_move_extensions_from_public_schema.sql

-- ============================================
-- Migration 16: Remove Duplicate Indexes
-- ============================================
\echo 'Running: 20260207235455_remove_duplicate_indexes.sql'

\ir migrations/20260207235455_remove_duplicate_indexes.sql

\echo '============================================'
\echo 'Migration Complete! ✅'
\echo 'All tables and functions have been created.'
\echo '============================================'

-- Create profile for existing user if not exists
INSERT INTO public.profiles (user_id, role, full_name)
VALUES (
  '1cad0354-425e-4f30-8f85-5b77786851cd'::uuid,
  'super_admin',
  'Admin User'
)
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

\echo 'Super admin profile created for user: 1cad0354-425e-4f30-8f85-5b77786851cd'
