# 🛠️ Development Setup Guide

## Disable Email Confirmation for Development

For faster development, you can disable email confirmation in Supabase.

### 📋 Steps to Disable Email Confirmation:

#### 1. **Go to Supabase Dashboard**
   - Navigate to: [https://app.supabase.com/project/uonziowbfkqanjmuzccb/auth/providers](https://app.supabase.com/project/uonziowbfkqanjmuzccb/auth/providers)
   - Or manually: Dashboard → Authentication → Providers

#### 2. **Configure Email Provider**
   
   **Option A: Disable Confirmation Entirely (Recommended for Dev)**
   
   1. Click on **"Email"** provider
   2. Scroll to **"Confirm email"** section
   3. **Uncheck** "Enable email confirmations"
   4. Click **"Save"**

   **Result:** Users can sign up and log in immediately without email verification.

   **Option B: Use Development Email Settings**
   
   1. Go to **Authentication → Settings → Email Templates**
   2. Set up a development SMTP server (like Mailtrap)
   3. This allows you to see emails without sending real ones

#### 3. **Configure URL Settings (Optional)**
   
   Go to: **Authentication → URL Configuration**
   
   ```
   Site URL: http://localhost:3000
   Redirect URLs: http://localhost:3000/**
   ```

#### 4. **Test Sign Up**
   
   ```bash
   # Start dev server
   pnpm dev
   
   # Go to: http://localhost:3000
   # Try signing up with any email
   # You should be logged in immediately!
   ```

---

## ⚠️ Important Notes

### For Development:
- ✅ **Disable email confirmation** for faster testing
- ✅ Use test emails like `test@example.com`
- ✅ No need to check email inbox
- ✅ Immediate login after sign up

### For Production:
- ⚠️ **Re-enable email confirmation** before deploying
- ⚠️ Set up proper SMTP (SendGrid, AWS SES, etc.)
- ⚠️ Configure production redirect URLs
- ⚠️ Test email delivery

---

## 🔧 Alternative: Auto-Confirm Users (SQL Trigger)

If you need more control, you can auto-confirm users via SQL:

### Create SQL Function:

```sql
-- Run this in Supabase SQL Editor
-- This auto-confirms users on signup

CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm email for development
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id 
  AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();
```

### Remove Trigger (For Production):

```sql
-- Remove auto-confirm trigger before production
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_user();
```

---

## 📝 Quick Reference

### Current Settings:

| Setting | Development | Production |
|---------|-------------|------------|
| Email Confirmation | ❌ Disabled | ✅ Enabled |
| Email Provider | Supabase (default) | Custom SMTP |
| Site URL | `http://localhost:3000` | `https://yourdomain.com` |
| Auto-confirm | ✅ Yes (optional) | ❌ No |

### To Switch Modes:

**Enable Dev Mode:**
```bash
# 1. Disable email confirmation in Supabase dashboard
# 2. Use localhost URLs
# 3. Start dev server: pnpm dev
```

**Enable Production Mode:**
```bash
# 1. Enable email confirmation in Supabase dashboard
# 2. Configure production SMTP
# 3. Update redirect URLs to production domain
# 4. Remove auto-confirm trigger (if using)
```

---

## 🚀 Quick Start Checklist

For immediate development:

- [ ] Disable email confirmation in Supabase dashboard
- [ ] Set Site URL to `http://localhost:3000`
- [ ] Add redirect URL: `http://localhost:3000/**`
- [ ] Test sign up with `test@example.com`
- [ ] Verify immediate login works

---

## 🔗 Useful Links

- **Supabase Auth Dashboard:** [https://app.supabase.com/project/uonziowbfkqanjmuzccb/auth/providers](https://app.supabase.com/project/uonziowbfkqanjmuzccb/auth/providers)
- **Email Templates:** [https://app.supabase.com/project/uonziowbfkqanjmuzccb/auth/templates](https://app.supabase.com/project/uonziowbfkqanjmuzccb/auth/templates)
- **URL Configuration:** [https://app.supabase.com/project/uonziowbfkqanjmuzccb/auth/url-configuration](https://app.supabase.com/project/uonziowbfkqanjmuzccb/auth/url-configuration)

---

## ⚡ Pro Tips

1. **Use Mailtrap for Testing Emails:**
   - Sign up at [mailtrap.io](https://mailtrap.io)
   - Configure SMTP in Supabase
   - See all emails without sending real ones

2. **Create Test Accounts:**
   ```
   test@example.com
   admin@example.com
   user1@example.com
   ```

3. **Reset Password in Dev:**
   - Go to Supabase → Authentication → Users
   - Click on user → "Send Password Recovery"
   - Or use SQL: `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'test@example.com';`

---

## 🎯 Remember Before Production!

```bash
# Checklist before deploying:
☐ Re-enable email confirmation
☐ Configure production SMTP
☐ Update redirect URLs
☐ Remove auto-confirm trigger
☐ Test email delivery
☐ Set proper Site URL
```

Happy coding! 🚀
