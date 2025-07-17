# 🚀 Render Deployment Guide (100% FREE)

## Quick Deployment Steps

### Prerequisites
1. GitHub account
2. Railway account (free signup at railway.app)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Setup Railway deployment"
git push origin main
```

### Step 2: Deploy Backend
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select `/backend` as the root directory
6. Railway will auto-detect FastAPI and deploy

### Step 3: Add Database
1. In your Railway project dashboard
2. Click "New Service" → "Database" → "PostgreSQL"
3. Railway will automatically set `DATABASE_URL` environment variable

### Step 4: Deploy Frontend
1. In the same Railway project
2. Click "New Service" → "GitHub Repo"
3. Select same repository
4. Select `/frontend` as the root directory
5. Railway will auto-detect React and deploy

### Step 5: Configure Environment Variables

#### Backend Service:
- `PORT` (auto-set by Railway)
- `DATABASE_URL` (auto-set by PostgreSQL addon)
- `FRONTEND_URL` = `https://your-frontend.railway.app`

#### Frontend Service:
- `REACT_APP_API_URL` = `https://your-backend.railway.app`

### Step 6: Get Your URLs
Railway will provide you with:
- **Backend API**: `https://your-backend.railway.app`
- **Frontend Dashboard**: `https://your-frontend.railway.app`

## Update GitLab CI

Update your GitLab CI variable:
```yaml
variables:
  DASHBOARD_URL: "https://your-backend.railway.app/webhook/gitlab"
```

## Custom Domains (Optional)

Railway allows custom domains:
1. Go to service settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Environment Variables Reference

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host:port/db
FRONTEND_URL=https://your-frontend.railway.app
PORT=8000
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend.railway.app
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure `FRONTEND_URL` is set correctly in backend
2. **Database Connection**: Railway auto-provides PostgreSQL connection
3. **Build Failures**: Check logs in Railway dashboard
4. **API Not Found**: Verify `REACT_APP_API_URL` is set correctly

### Checking Logs:
1. Go to Railway dashboard
2. Select your service
3. Click "Logs" tab

## Monitoring

Railway provides:
- ✅ **Automatic SSL certificates**
- ✅ **Custom domains**
- ✅ **Automatic deployments** from GitHub
- ✅ **Database backups**
- ✅ **Usage metrics**
- ✅ **Free tier**: 500 hours/month + $5 credit

## Production Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible  
- [ ] Database connected
- [ ] Environment variables set
- [ ] CORS configured properly
- [ ] GitLab CI webhook URL updated
- [ ] Test webhook with sample request

## Testing Your Deployment

Test the webhook:
```bash
curl -X POST https://your-backend.railway.app/webhook/gitlab \
  -H "Content-Type: application/json" \
  -d '{
    "object_kind": "build",
    "build_status": "success",
    "variables": {
      "APP_NAME": "froggy-98",
      "PLATFORM": "android",
      "VERSION": "1.0.0"
    }
  }'
```

You should see the release appear in your dashboard! 🎉