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