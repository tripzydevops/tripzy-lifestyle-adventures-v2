# Deployment Guide

## Overview

This guide covers the deployment procedures for the **Tripzy Lifestyle Adventures** platform, consisting of a valid React frontend and a Python backend.

- **Frontend**: React 19 + Vite (Deployed on Vercel)
- **Backend**: Python FastAPI (Deployed on Google Cloud Run)
- **Database**: Supabase (PostgreSQL)

---

## 🚀 Frontend Deployment (Vercel)

### Prerequisites

- Vercel Account linked to the GitHub repository.
- Environment variables configured in Vercel project settings.

### Configuration

Ensure the following environment variables are set in Vercel:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Build Settings

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Triggering a Deploy

Pushing to the `main` branch will automatically trigger a deployment.

---

## 🛠️ Backend Deployment (Google Cloud Run)

### Prerequisites

- Google Cloud Project with Cloud Run API enabled.
- `gcloud` CLI installed and authenticated.

### Docker Configuration

Ensure the `Dockerfile` in the `backend/` directory is optimized for production.

### Deployment Steps

1. **Build and Tag Container**

   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT-ID]/tripzy-backend
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy tripzy-backend \
     --image gcr.io/[PROJECT-ID]/tripzy-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars SUPABASE_URL=[URL],SUPABASE_KEY=[KEY],GEMINI_API_KEY=[KEY]
   ```

### Verification

- Check the service URL returned by Cloud Run.
- Verify health endpoints: `/health` or `/api/status`.

---

## 🔍 Pre-Deployment Checklist

- [ ] **Linting**: Run `npm run lint` to catch code style issues.
- [ ] **Type Checking**: Run `npm run type-check` (if script exists) or `tsc --noEmit`.
- [ ] **Build Verification**: Run `npm run build` locally to ensure no build errors.
- [ ] **Environment Variables**: Verify all secrets are updated in Vercel and Cloud Run.

## 🔄 Post-Deployment Verification

1. **Frontend**:
   - Verify homepage loads.
   - Check navigation links.
   - Test "AI Trip Planner" functionality.

2. **Backend**:
   - Run `check_models_rest.py` against the _production_ URL (if applicable).
   - Check Cloud Run logs for startup errors.

## 🚨 Rollback Plan

- **Frontend**: Use Vercel's "Instant Rollback" feature to revert to the previous deployment.
- **Backend**: Use Cloud Run "Revisions" to route 100% of traffic to the previous healthy revision.
