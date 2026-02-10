# Deploy Fixed Edge Functions to Supabase

## ⚠️ IMPORTANT
The JWT authentication fixes in your Edge Functions code need to be deployed to Supabase before they'll work.

Your local Next.js app (running on http://localhost:3001) calls Edge Functions hosted on **Supabase's cloud**, not locally. So the code changes won't take effect until deployed.

## Option 1: Quick Deploy via Supabase Dashboard (5 minutes)

This is the fastest method since you don't have Supabase CLI installed.

### Steps:

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Log in and select your project: `uonziowbfkqanjmuzccb`

2. **Navigate to Edge Functions**
   - Click "Edge Functions" in the left sidebar

3. **Update Each Function** (repeat for all 9 functions):
   
   For each function below, click on it and click "Edit":
   - orchestrator
   - contract_review
   - vendor_intelligence  
   - compliance
   - briefing
   - risk_assessment
   - research_memo
   - intake_triage
   - policy_drafting

4. **Replace the Code**
   - Delete the old code in the editor
   - Copy the entire contents from your local file:
     - Example: `D:\LexCorworkAi\supabase\functions\orchestrator\index.ts`
   - Paste into the editor
   - Click "Deploy"

5. **Verify Deployment**
   - After deploying all 9 functions, the logs should show successful deployments
   - No additional environment variables needed (`SUPABASE_ANON_KEY` is auto-injected)

## Option 2: Install Supabase CLI and Deploy (Recommended for future)

### Install Supabase CLI on Windows:

**Using Scoop (Recommended):**
```powershell
# Install Scoop (if not already installed)
iex "& {$(irm get.scoop.sh)} -RunAsAdmin"

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Using Direct Download:**
1. Download the Windows binary from: https://github.com/supabase/cli/releases/latest
2. Look for `supabase_windows_amd64.tar.gz`
3. Extract it and add the folder to your PATH

### Deploy All Functions:

Once CLI is installed:

```powershell
# Navigate to your project
cd D:\LexCorworkAi

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref uonziowbfkqanjmuzccb

# Deploy all functions at once
supabase functions deploy orchestrator
supabase functions deploy contract_review
supabase functions deploy vendor_intelligence
supabase functions deploy compliance
supabase functions deploy briefing
supabase functions deploy risk_assessment
supabase functions deploy research_memo
supabase functions deploy intake_triage
supabase functions deploy policy_drafting
```

## What Changed in the Functions

All 9 Edge Functions were updated with the correct JWT authentication pattern:

**Before (❌ Broken):**
```typescript
const supabase = createClient(supabaseUrl, SUPABASE_SERVICE_ROLE_KEY);
const { data: { user } } = await supabase.auth.getUser(token);
// Fails because token was issued with ANON_KEY
```

**After (✅ Fixed):**
```typescript
// 1. Auth client with ANON_KEY + JWT for verification
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } },
});
const { data: { user } } = await supabaseClient.auth.getUser();

// 2. Database client with SERVICE_ROLE_KEY for operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

## Testing After Deployment

1. **Refresh your browser** at http://localhost:3001
2. **Log in** to your application
3. **Click any AI Worker** card (e.g., "Contract Review")
4. **Fill in task details** and submit
5. **Check browser DevTools** (F12 → Network tab):
   - The `orchestrator` request should return **200 OK**
   - You should see task execution results, not JWT errors

## Environment Variables

No action needed! The `SUPABASE_ANON_KEY` is automatically available in all Supabase Edge Functions.

## Summary

- ✅ Fixed all 9 Edge Functions locally
- ⏳ **Need to deploy** to Supabase for changes to take effect
- 🚀 Use Dashboard method for quick deployment
- 📋 Created detailed documentation of the fix

## Questions?

If you encounter any issues during deployment, check:
1. Are you logged into the correct Supabase project?
2. Did you deploy all 9 functions?
3. Did you refresh your browser after deployment?
