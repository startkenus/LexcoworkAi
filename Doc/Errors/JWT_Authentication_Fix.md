# JWT Authentication Fix - All Supabase Edge Functions

## Problem
All Supabase Edge Functions were returning 401 "Invalid JWT" errors because they were incorrectly verifying JWT tokens.

## Root Cause
The Edge Functions were creating a Supabase client using the `SERVICE_ROLE_KEY` and then trying to verify JWT tokens that were issued using the `ANON_KEY`. This mismatch caused all authentication attempts to fail.

```typescript
// ❌ INCORRECT - This pattern fails
const supabase = createClient(supabaseUrl, SUPABASE_SERVICE_ROLE_KEY);
const { data: { user } } = await supabase.auth.getUser(token);
// This fails because the token was issued with ANON_KEY, not SERVICE_ROLE_KEY
```

## Solution
Create two separate Supabase clients:
1. **Authentication Client**: Uses `ANON_KEY` with the user's JWT token for authentication
2. **Database Client**: Uses `SERVICE_ROLE_KEY` for privileged database operations (bypasses RLS)

```typescript
// ✅ CORRECT - This pattern works
// 1. Create client with ANON_KEY + user's JWT for authentication
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } },
});
const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

// 2. Create separate client with SERVICE_ROLE_KEY for database operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// Use this for database queries that need to bypass RLS
```

## Files Fixed

### 1. Orchestrator Function
- **File**: `supabase/functions/orchestrator/index.ts`
- **Status**: ✅ Fixed
- **Changes**: 
  - Added `SUPABASE_ANON_KEY` environment variable
  - Created separate clients for auth and database operations
  - Added better error logging with `console.error()`
  - Added detailed error messages in responses

### 2. Contract Review Worker
- **File**: `supabase/functions/contract_review/index.ts`
- **Status**: ✅ Fixed
- **Changes**: Same pattern as orchestrator

### 3. Vendor Intelligence Worker
- **File**: `supabase/functions/vendor_intelligence/index.ts`
- **Status**: ✅ Fixed
- **Changes**: Same pattern as orchestrator

### 4. Compliance Check Worker
- **File**: `supabase/functions/compliance/index.ts`
- **Status**: ✅ Fixed
- **Changes**: Same pattern as orchestrator

### 5. Briefing Worker
- **File**: `supabase/functions/briefing/index.ts`
- **Status**: ✅ Fixed
- **Changes**: Same pattern as orchestrator

### 6. Risk Assessment Worker
- **File**: `supabase/functions/risk_assessment/index.ts`
- **Status**: ✅ Fixed
- **Changes**: Same pattern as orchestrator

### 7. Research Memo Worker
- **File**: `supabase/functions/research_memo/index.ts`
- **Status**: ✅ Fixed
- **Changes**: Same pattern as orchestrator

### 8. Intake Triage Worker
- **File**: `supabase/functions/intake_triage/index.ts`
- **Status**: ✅ Fixed
- **Changes**: Same pattern as orchestrator

### 9. Policy Drafting Worker
- **File**: `supabase/functions/policy_drafting/index.ts`
- **Status**: ✅ Fixed
- **Changes**: Same pattern as orchestrator

## Environment Variables Required

All Edge Functions now require these environment variables:
- `SUPABASE_URL` - Already configured ✅
- `SUPABASE_SERVICE_ROLE_KEY` - Already configured ✅
- `SUPABASE_ANON_KEY` - **AUTOMATICALLY AVAILABLE** in Supabase Edge Functions ✅

> **Note**: The `SUPABASE_ANON_KEY` is automatically injected by Supabase into all Edge Functions. You don't need to manually configure it.

## Testing Instructions

1. **Restart the dev server** (if running locally):
   ```bash
   # Stop current server (Ctrl+C)
   # Start fresh
   pnpm dev
   ```

2. **Refresh your browser** to load updated code

3. **Log in** to your application

4. **Create a task**:
   - Click any AI Worker card
   - Fill in task details
   - Submit

5. **Expected Result**: Task should be created successfully without JWT errors

## Verification

To verify the fix is working:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Create a task
4. Check the orchestrator request:
   - Should return **200 OK** (not 401)
   - Response should contain task execution results

## Additional Improvements Made

1. **Better Error Messages**: All functions now return detailed error messages including:
   - "Missing authorization token" when no token is provided
   - "Unauthorized" with error details when token is invalid
   - Console logging of auth errors for debugging

2. **Consistent Pattern**: All 9 Edge Functions now follow the same authentication pattern

3. **Security**: The pattern maintains security by:
   - Verifying JWT tokens properly
   - Using service role only for database operations
   - Checking user authorization for each task

## Summary

All Supabase Edge Functions have been updated with the correct JWT authentication pattern. The key insight is that **you must use the same key (ANON_KEY) to verify a JWT token that was used to issue it**. The SERVICE_ROLE_KEY is only for privileged database operations, not for JWT verification.
