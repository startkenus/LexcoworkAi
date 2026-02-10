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