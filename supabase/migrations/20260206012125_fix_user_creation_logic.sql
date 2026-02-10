/*
  # Fix User Profile Creation Logic

  ## Changes
  1. **Fixed handle_new_user function**
     - Corrected the is_first_user check to properly detect when creating the first user
     - Since this is an AFTER INSERT trigger, COUNT(*) includes the newly inserted user
     - Changed logic from `COUNT(*) = 0` to `COUNT(*) <= 1` to properly make first user a super_admin
  
  ## Security
  - Function maintains SECURITY DEFINER to bypass RLS for profile creation
  - First user automatically becomes super_admin
  - Subsequent users default to regular 'user' role
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  default_tenant_id uuid;
  is_first_user boolean;
BEGIN
  -- Check if this is the first user (since trigger is AFTER INSERT, new user is included in count)
  SELECT COUNT(*) <= 1 INTO is_first_user FROM auth.users;
  
  -- Get or create default tenant
  SELECT id INTO default_tenant_id FROM tenants WHERE slug = 'acme-legal';
  
  IF default_tenant_id IS NULL THEN
    INSERT INTO tenants (name, slug, is_active)
    VALUES ('Acme Legal', 'acme-legal', true)
    RETURNING id INTO default_tenant_id;
  END IF;
  
  -- Insert profile (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.profiles (
    user_id,
    tenant_id,
    email,
    full_name,
    role
  ) VALUES (
    NEW.id,
    default_tenant_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE WHEN is_first_user THEN 'super_admin'::user_role ELSE 'user'::user_role END
  );
  
  RETURN NEW;
END;
$$;