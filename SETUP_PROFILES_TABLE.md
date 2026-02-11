# Setup Profiles Table in Supabase

The dashboard is unable to load because the `profiles` table doesn't exist in your Supabase database. Follow these steps to create it:

## Quick Setup (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to: https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/sql
   - Or navigate to your project → SQL Editor in the left sidebar

2. **Run the Migration:**
   - Click "New Query"
   - Copy the contents of `supabase/migrations/001_create_profiles_table.sql`
   - Paste into the SQL editor
   - Click "Run" or press `Ctrl+Enter`

3. **Create Profile for Existing User:**
   Since you already have a user account (ID: `1cad0354-425e-4f30-8f85-5b77786851cd`), you need to manually create a profile:

   ```sql
   -- Create profile for existing user and make them super admin
   INSERT INTO public.profiles (user_id, role, full_name)
   VALUES (
     '1cad0354-425e-4f30-8f85-5b77786851cd'::uuid,
     'super_admin',
     'Admin User'
   );
   ```

4. **Refresh your browser** at `http://localhost:3002/dashboard`

## What This Creates

- **profiles table**: Stores user profile information (role, tenant_id, etc.)
- **RLS policies**: Ensures users can only access their own profile
- **Auto-creation trigger**: Automatically creates profiles for new users
- **First user = super_admin**: The first user to sign up becomes a super admin

## Verify Setup

After running the SQL, verify the table was created:

```sql
-- Check if profiles table exists
SELECT * FROM public.profiles;

-- Should show your user profile with super_admin role
```

## Alternative: Using Supabase CLI

If you have Supabase CLI installed:

```bash
cd d:\LexCorworkAi
supabase db push
```

## Troubleshooting

**If you see "permission denied":**
- Make sure you're logged into the correct Supabase project
- Check that you have admin access to the project

**If the table already exists:**
- The SQL uses `IF NOT EXISTS`, so it's safe to run again
- Just run the INSERT statement for your existing user

**If you still see 404 errors:**
- Clear your browser cache
- Hard refresh (Ctrl+Shift+R)
- Check browser console for any other errors

## Need Help?

If you encounter any issues, provide the error message and I'll help you fix it.
