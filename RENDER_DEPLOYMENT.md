# 🚀 Render Deployment Guide (100% FREE)

## Why Render?
- ✅ **Completely Free** for personal projects
- ✅ **750 hours/month** (24/7 uptime)
- ✅ **PostgreSQL database** included
- ✅ **Auto-deploy** from GitHub
- ✅ **Custom domains** & **SSL**
- ✅ **No credit card** required

## Quick Deployment Steps

### Prerequisites
1. GitHub account
2. Render account (free signup at render.com)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### Step 2: Deploy Backend on Render

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `app-release-dashboard-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. Click **"Create Web Service"**

### Step 3: Add PostgreSQL Database

1. From Render dashboard, click **"New"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `app-release-dashboard-db`
   - **Plan**: `Free`
3. Click **"Create Database"**
4. **Copy the Database URL** (you'll need this)

### Step 4: Configure Backend Environment Variables

1. Go to your backend service in Render
2. Click **"Environment"** tab
3. Add these variables:
   ```
   DATABASE_URL = [paste the PostgreSQL URL from step 3]
   FRONTEND_URL = https://your-frontend-name.onrender.com
   ```

### Step 5: Deploy Frontend

1. Click **"New"** → **"Static Site"**
2. Connect same GitHub repository
3. Configure:
   - **Name**: `app-release-dashboard-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `build`
   - **Plan**: `Free`
4. Click **"Create Static Site"**

### Step 6: Configure Frontend Environment Variables

1. Go to your frontend service in Render
2. Click **"Environment"** tab
3. Add:
   ```
   REACT_APP_API_URL = https://your-backend-name.onrender.com
   ```

### Step 7: Get Your Live URLs

After deployment completes:
- **Backend API**: `https://app-release-dashboard-api.onrender.com`
- **Frontend**: `https://app-release-dashboard-frontend.onrender.com`

### Step 8: Update GitLab CI

In your GitLab project, update the CI variable:
```yaml
variables:
  DASHBOARD_URL: "https://app-release-dashboard-api.onrender.com/webhook/gitlab"
```

### Step 9: Test Your Deployment

Test the webhook:
```bash
curl -X POST https://app-release-dashboard-api.onrender.com/webhook/gitlab \
  -H "Content-Type: application/json" \
  -d '{
    "object_kind": "build",
    "build_status": "success",
    "build_id": "test123",
    "variables": {
      "APP_NAME": "froggy-98",
      "PLATFORM": "android",
      "VERSION": "1.0.0"
    }
  }'
```

## Important Notes

### Free Tier Limits:
- **750 hours/month** (enough for 24/7)
- **Services sleep** after 15 minutes of inactivity
- **Cold start time**: ~30 seconds when waking up
- **PostgreSQL**: 1GB storage, 100 connections

### Auto-Deploy:
- Render automatically deploys when you push to GitHub
- Separate deployments for backend and frontend
- Build logs available in dashboard

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check build logs in Render dashboard
2. **CORS Errors**: Verify `FRONTEND_URL` in backend environment
3. **Database Connection**: Ensure `DATABASE_URL` is correctly set
4. **Service Sleep**: First request after sleep takes ~30 seconds

### Monitoring:
- Check service status in Render dashboard
- View logs for debugging
- Set up status page notifications

## Production Checklist

- [ ] Backend service deployed and running
- [ ] PostgreSQL database created and connected
- [ ] Frontend static site deployed
- [ ] Environment variables configured
- [ ] Both services accessible via HTTPS
- [ ] GitLab CI webhook URL updated
- [ ] Test webhook successful
- [ ] Apps appear in dashboard

## Cost: $0/month 🎉

Perfect for your radio app release dashboard!