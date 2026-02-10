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