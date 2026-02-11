# Deployment Guide

## Current Deployment Status

- **Production Branch**: `main`
- **Development Branch**: `dev`

## Vercel Deployment

This project is deployed on Vercel with automatic deployments:

- **Production**: Deployments from `main` branch → https://lexcoworkai.vercel.app
- **Preview**: Deployments from `dev` branch → Automatic preview URLs

## Environment Variables Required

Make sure to set these in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Branch Strategy

- `main` - Production-ready code
- `dev` - Active development

## Deployment Workflow

1. Develop on `dev` branch
2. Push to GitHub: `git push origin dev`
3. Vercel automatically creates preview deployment
4. Test preview deployment
5. Merge to `main` when ready: `git checkout main && git merge dev && git push origin main`
6. Vercel automatically deploys to production
