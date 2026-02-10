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