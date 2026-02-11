# Connect to Supabase and Run Migration

## Your Project Details:
- **Project ID**: `idgfbmvfqyirgdowsxrm`
- **Project URL**: https://idgfbmvfqyirgdowsxrm.supabase.co

---

## Step-by-Step Guide:

### Step 1: Login to Supabase Dashboard

1. Go to: **https://app.supabase.com/sign-in**
2. Login with your credentials

### Step 2: Access Your Project

Click this direct link to your project:
**https://app.supabase.com/project/idgfbmvfqyirgdowsxrm**

### Step 3: Open SQL Editor

Click this direct link to open SQL Editor:
**https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/sql/new**

Or manually:
- Click **"SQL Editor"** in the left sidebar
- Click **"New Query"** button

### Step 4: Copy the Migration SQL

In Cursor, you have the file already open:
`d:\LexCorworkAi\supabase\migrations\001_create_profiles_table.sql`

1. **Select All**: Press `Ctrl+A` in the file
2. **Copy**: Press `Ctrl+C`

### Step 5: Paste and Run in Supabase

1. Go back to the Supabase SQL Editor (the link from Step 3)
2. **Paste**: Press `Ctrl+V` in the SQL editor
3. **Run**: Click the **"RUN"** button (or press `Ctrl+Enter`)

You should see:
```
Success. No rows returned
```

### Step 6: Verify Table Was Created

Click this link to see your tables:
**https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/editor**

You should see a **"profiles"** table in the left sidebar!

### Step 7: Verify Your Profile

In the SQL Editor, run this query:

```sql
SELECT * FROM public.profiles;
```

You should see your user profile with:
- **user_id**: `1cad0354-425e-4f30-8f85-5b77786851cd`
- **role**: `super_admin`

### Step 8: Test Your Dashboard

1. Go to: **http://localhost:3002/dashboard**
2. Hard refresh: Press `Ctrl+Shift+R`
3. The dashboard should now load! 🎉

---

## Quick Links Summary:

| Action | Link |
|--------|------|
| 🏠 Project Home | https://app.supabase.com/project/idgfbmvfqyirgdowsxrm |
| 📝 SQL Editor | https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/sql/new |
| 📊 Table Editor | https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/editor |
| ⚙️ Settings | https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/settings/general |
| 🔑 API Keys | https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/settings/api |

---

## Troubleshooting:

### "Project not found"
- Make sure you're logged into the correct Supabase account
- Check if you have access to project `idgfbmvfqyirgdowsxrm`

### "Permission denied"
- You need owner or admin access to run SQL
- Contact the project owner to grant you access

### "Table already exists"
- That's okay! Just run this separately to create your profile:
```sql
INSERT INTO public.profiles (user_id, role, full_name)
VALUES (
  '1cad0354-425e-4f30-8f85-5b77786851cd'::uuid,
  'super_admin',
  'Admin User'
)
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
```

### Still seeing 404 errors in console?
- Wait 5 seconds and refresh
- Clear browser cache
- Try opening dashboard in incognito mode

---

## Next Steps After Setup:

✅ Dashboard is now accessible  
✅ You have super admin role  
✅ New users will automatically get profiles  
✅ Ready to create tasks and use AI features!

Need help? Let me know what error you're seeing!
