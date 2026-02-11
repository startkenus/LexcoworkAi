# 🚀 Vercel Deployment Guide - LexCoworkAI

## 📋 Prerequisites

- [x] Code pushed to GitHub: `https://github.com/startkenus/LexcoworkAi` ✅
- [ ] Vercel account (free tier works): [vercel.com](https://vercel.com)
- [ ] Environment variables ready (from `.env.local`)

---

## 🎯 Quick Deploy Steps

### Step 1: Connect GitHub Repository

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repo: **`startkenus/LexcoworkAi`**
4. If not showing, click "Adjust GitHub App Permissions" to grant access

### Step 2: Configure Project

**Framework Preset:** Next.js (auto-detected)

**Build Settings:**
- **Build Command:** `pnpm build`
- **Output Directory:** `.next` (default)
- **Install Command:** `pnpm install`
- **Development Command:** `pnpm dev`

**Root Directory:** `./` (leave as root)

### Step 3: Add Environment Variables ⚠️ CRITICAL

Click "Environment Variables" and add these:

#### Required for All Environments:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://uonziowbfkqanjmuzccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbnppb3diZmtxYW5qbXV6Y2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjA0ODcsImV4cCI6MjA4NTg5NjQ4N30.E5p3YCrm3t5eCgyqVNxeB38TGAUodki7RXBKJLhEjy8

# Supabase Service Role Key (Get from Supabase Dashboard)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Supabase Project ID
SUPABASE_PROJECT_ID=uonziowbfkqanjmuzccb

# Anthropic Claude API (Get from console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Node Environment
NODE_ENV=production
```

#### For Preview/Dev Deployments:

Select "Preview" environment and use the same variables.

#### For Production:

Select "Production" environment and use the same variables.

### Step 4: Deploy Settings

**Branch Configuration:**
- **Production Branch:** `main`
- **Preview Branch:** `dev` ✅ (your current branch)

Vercel will automatically:
- Deploy `dev` branch → Preview URL (for testing)
- Deploy `main` branch → Production URL (when merged)

### Step 5: Click "Deploy"

Vercel will:
1. Clone your repo
2. Install dependencies with pnpm
3. Run `pnpm build`
4. Deploy to Vercel's edge network

⏱️ First deployment takes ~2-3 minutes

---

## 🔗 After Deployment

### Your URLs:

**Preview (dev branch):**
```
https://lexcoworkai-dev-startkenus.vercel.app
```

**Production (main branch):**
```
https://lexcoworkai.vercel.app
```

### Next Steps:

1. ✅ Test dev deployment thoroughly
2. Configure custom domain (optional)
3. Set up Supabase Edge Functions environment variables
4. Merge `dev` to `main` when ready for production

---

## 🔧 Vercel CLI (Alternative Method)

If you prefer CLI:

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview (dev environment)
vercel

# Add environment variables via CLI
vercel env add ANTHROPIC_API_KEY

# Deploy to production
vercel --prod
```

---

## 📊 Monitoring & Logs

**View Logs:**
1. Go to [https://vercel.com/startkenus/lexcoworkai](https://vercel.com/startkenus/lexcoworkai)
2. Click on a deployment
3. View "Functions" tab for server logs

**Analytics:**
- Vercel Dashboard → Analytics (free tier included)
- Monitor performance, errors, and usage

---

## ⚠️ Important Notes

### Environment Variables

**Never commit these to GitHub:**
- ❌ `SUPABASE_SERVICE_ROLE_KEY`
- ❌ `ANTHROPIC_API_KEY`

These should ONLY exist in:
- ✅ Local `.env.local` file
- ✅ Vercel dashboard environment variables
- ✅ Supabase Edge Functions settings

### Supabase Edge Functions

Your Edge Functions also need environment variables:

1. Go to [Supabase Dashboard](https://app.supabase.com/project/uonziowbfkqanjmuzccb/settings/functions)
2. Add environment variables:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

### Build Errors?

If deployment fails:

1. **Check TypeScript errors:**
   ```bash
   pnpm fixtypescriptbug
   ```

2. **Test build locally:**
   ```bash
   pnpm build
   ```

3. **Check Vercel build logs** in dashboard

---

## 🎯 Quick Checklist

Before deploying to production:

- [ ] All TypeScript errors fixed
- [ ] All tests passing
- [ ] Environment variables configured in Vercel
- [ ] Supabase Service Role Key added
- [ ] Anthropic API Key added
- [ ] Edge Functions environment variables set
- [ ] Test on preview deployment first
- [ ] Custom domain configured (optional)

---

## 🚀 Deploy Now!

**Option 1: Dashboard (Easiest)**
👉 [Deploy on Vercel](https://vercel.com/new/clone?repository-url=https://github.com/startkenus/LexcoworkAi)

**Option 2: CLI**
```bash
vercel
```

**Option 3: Automatic (Already Set Up!)**
- Just push to `dev` branch → Auto-deploys to preview ✅
- Merge to `main` → Auto-deploys to production

---

## 📞 Need Help?

- Vercel Docs: [https://vercel.com/docs](https://vercel.com/docs)
- Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)
- Next.js Docs: [https://nextjs.org/docs](https://nextjs.org/docs)

---

## 🎉 You're Ready!

Your code is on GitHub dev branch and ready to deploy to Vercel!
