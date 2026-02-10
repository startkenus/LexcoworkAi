/*
  # Fix Function Search Paths

  1. Security Improvements
    - Set secure search paths for functions to prevent schema injection attacks
    - Functions: user_tenant_ids, is_super_admin, update_updated_at_column
    
  2. Changes
    - All functions now have explicit search_path = public
    - Prevents malicious schema manipulation
*/

CREATE OR REPLACE FUNCTION public.user_tenant_ids(user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(tenant_id)
  FROM public.profiles
  WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
    AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;