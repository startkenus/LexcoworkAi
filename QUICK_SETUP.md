# Quick Database Setup (2 Minutes) ⚡

Since Supabase CLI had issues, let's use the web interface (even easier!):

## Step 1: Open Supabase SQL Editor

Click this link: **https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/sql/new**

## Step 2: Copy & Paste This SQL

Copy the **entire** SQL below and paste it into the SQL Editor:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- Create auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create auto-profile creation for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'super_admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profile for your existing user (make them super admin)
INSERT INTO public.profiles (user_id, role, full_name)
VALUES (
  '1cad0354-425e-4f30-8f85-5b77786851cd'::uuid,
  'super_admin',
  'Admin User'
)
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
```

## Step 3: Run the SQL

Click **"Run"** button or press `Ctrl+Enter`

You should see: ✅ **Success. No rows returned**

## Step 4: Verify

Run this to check your profile was created:

```sql
SELECT * FROM public.profiles;
```

You should see your user with `super_admin` role!

## Step 5: Refresh Your Dashboard

Go back to: **http://localhost:3002/dashboard**

Press `Ctrl+Shift+R` (hard refresh)

**Dashboard should now load!** 🎉

---

## Troubleshooting

**"relation already exists"**: That's fine! Just run this separately:
```sql
INSERT INTO public.profiles (user_id, role, full_name)
VALUES ('1cad0354-425e-4f30-8f85-5b77786851cd'::uuid, 'super_admin', 'Admin User')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
```

**Still getting 404 errors**: 
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check you're logged into the correct Supabase project

**Need help**: Share the error message!
