# 🚀 Run Migration NOW - Simple 5-Step Guide

## Your Project: `idgfbmvfqyirgdowsxrm`

---

## ⚡ Quick Start (Copy & Paste This):

### 1️⃣ Open This Link:
```
https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/sql/new
```

### 2️⃣ Copy This SQL:

Open the file in Cursor: `supabase\migrations\001_create_profiles_table.sql`

Press `Ctrl+A` then `Ctrl+C`

### 3️⃣ Paste in Supabase SQL Editor:

- Click in the SQL editor
- Press `Ctrl+V`
- Click **"RUN"** button (green button top-right)

### 4️⃣ Wait for Success Message:

You should see: ✅ **"Success. No rows returned"**

### 5️⃣ Refresh Dashboard:

Go to: `http://localhost:3002/dashboard`

Press `Ctrl+Shift+R`

**Done!** Dashboard should load! 🎉

---

## 🎯 What You're Creating:

- ✅ **profiles** table (stores user info)
- ✅ **Your super admin account**
- ✅ **Security policies** (Row Level Security)
- ✅ **Auto-creation for new users**

---

## 📝 Alternative: Copy-Paste Ready SQL (If File Won't Open)

If you can't access the migration file, here's the complete SQL:

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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

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

INSERT INTO public.profiles (user_id, role, full_name)
VALUES (
  '1cad0354-425e-4f30-8f85-5b77786851cd'::uuid,
  'super_admin',
  'Admin User'
)
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
```

---

## ❓ Common Issues:

**"Can't find SQL Editor"**
- Use direct link: https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/sql/new
- Or: Left sidebar → SQL Editor → New Query

**"Permission denied"**
- Make sure you're logged into the right Supabase account
- Check you have admin access to project `idgfbmvfqyirgdowsxrm`

**"Syntax error"**
- Make sure you copied the ENTIRE SQL (all 75 lines)
- Don't modify anything

**"Already exists"**
- That's fine! Just run the INSERT statement at the end separately

---

## ✅ Verify It Worked:

Run this query in SQL Editor:
```sql
SELECT * FROM public.profiles;
```

You should see:
- Your user_id: `1cad0354-425e-4f30-8f85-5b77786851cd`
- Role: `super_admin`
- Full name: `Admin User`

---

**Questions?** Let me know which step you're stuck on!
