# Supabase CLI Setup Guide

This guide will help you install Supabase CLI and push your database migrations.

## Step 1: Install Supabase CLI

### Option A: Using Scoop (Recommended for Windows)

```powershell
# Install Scoop if you don't have it
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option B: Using npm (Alternative)

```powershell
npm install -g supabase
```

### Option C: Direct Download

Download from: https://github.com/supabase/cli/releases/latest
- Download `supabase_windows_amd64.zip`
- Extract and add to PATH

## Step 2: Verify Installation

```powershell
supabase --version
```

## Step 3: Login to Supabase

```powershell
supabase login
```

This will open a browser window. Login with your Supabase credentials.

## Step 4: Link Your Project

```powershell
cd d:\LexCorworkAi
supabase link --project-ref idgfbmvfqyirgdowsxrm
```

When prompted, enter your database password (found in Supabase Dashboard → Settings → Database → Connection String).

## Step 5: Push Migrations

```powershell
# Push the profiles table migration
supabase db push

# Or push specific migration
supabase db push --include-all
```

## Step 6: Verify

```powershell
# Check migration status
supabase db status

# Or check in Supabase Dashboard
# Go to: https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/editor
```

## Alternative: Manual SQL Execution (No CLI Required)

If you prefer not to install CLI, you can run the SQL directly:

1. Open Supabase SQL Editor: https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/sql
2. Copy contents from `supabase/migrations/001_create_profiles_table.sql`
3. Paste and click "Run"
4. Then run this to create your user profile:

```sql
INSERT INTO public.profiles (user_id, role, full_name)
VALUES (
  '1cad0354-425e-4f30-8f85-5b77786851cd'::uuid,
  'super_admin',
  'Admin User'
)
ON CONFLICT (user_id) DO NOTHING;
```

## Troubleshooting

### "Command not found" after installation
- Close and reopen PowerShell/Terminal
- Check if CLI is in PATH: `where.exe supabase`

### "Project not found"
- Verify project reference ID: `idgfbmvfqyirgdowsxrm`
- Check you're logged in: `supabase projects list`

### "Permission denied"
- Make sure you have admin access to the Supabase project
- Check your database password is correct

### "Migration already applied"
- This is okay! The migration file uses `IF NOT EXISTS`
- Just manually insert your user profile using the SQL above

## Quick Start (No CLI) - Recommended

The fastest way is to skip CLI and use the Supabase SQL Editor directly:

1. Go to: https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/sql/new
2. Copy and paste the entire contents of `supabase/migrations/001_create_profiles_table.sql`
3. Click "Run" or press Ctrl+Enter
4. Refresh your dashboard at http://localhost:3002/dashboard

Done! ✅
