# Vercel Deployment Guide for Opportunity Dashboard

## Overview
This guide will walk you through deploying both the frontend (React) and backend (Flask) of the Opportunity Dashboard on Vercel.

## Prerequisites
- Vercel account (free tier available at https://vercel.com)
- GitHub account
- Git installed locally
- Node.js and npm installed

## Deployment Strategy
We'll deploy:
1. **Backend**: Flask API as serverless functions
2. **Frontend**: React app as a static site

---

## Step 1: Prepare Your Code for Deployment

### 1.1 Backend Preparation ✅
The backend has been configured for Vercel serverless deployment:
- `vercel.json` - Vercel configuration
- `api/index.py` - Serverless function entry point
- `requirements.txt` - Python dependencies
- Sample data automatically loads on first run

### 1.2 Frontend Preparation ✅
The frontend has been configured for Vercel static deployment:
- `vercel.json` - Vercel configuration
- Environment variable support for API URL
- Production build ready

---

## Step 2: Deploy Backend to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy Backend**:
   ```bash
   cd opportunity_dashboard_backend
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project? **N**
   - Project name: `opportunity-dashboard-backend`
   - Directory: `./` (current directory)
   - Override settings? **N**

4. **Note the Backend URL**: After deployment, Vercel will provide a URL like:
   `https://opportunity-dashboard-backend.vercel.app`

### Option B: Deploy via GitHub Integration

1. **Push Backend to GitHub**:
   ```bash
   cd opportunity_dashboard_backend
   git init
   git add .
   git commit -m "Initial backend commit"
   git remote add origin https://github.com/yourusername/opportunity-dashboard-backend.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to https://vercel.com/dashboard
   - Click "New Project"
   - Import from GitHub
   - Select your backend repository
   - Deploy

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Configure Environment Variables

Before deploying the frontend, you need to set the backend API URL:

1. **Create `.env.local`** in the frontend directory:
   ```bash
   cd opportunity_dashboard_frontend
   echo "VITE_API_BASE_URL=https://your-backend-url.vercel.app/api" > .env.local
   ```
   Replace `your-backend-url` with your actual backend URL from Step 2.

### 3.2 Deploy Frontend

**Via Vercel CLI**:
```bash
cd opportunity_dashboard_frontend
vercel
```

**Via GitHub Integration**:
1. Push frontend to GitHub (separate repository)
2. Import and deploy via Vercel dashboard

---

## Step 4: Configure Environment Variables in Vercel

### 4.1 Backend Environment Variables
In your Vercel dashboard for the backend project:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:
   ```
   FLASK_ENV=production
   SECRET_KEY=your-secure-secret-key-here
   SAM_GOV_API_KEY=your_sam_gov_api_key (optional)
   FIRECRAWL_API_KEY=your_firecrawl_api_key (optional)
   ```

### 4.2 Frontend Environment Variables
In your Vercel dashboard for the frontend project:

1. Go to **Settings** → **Environment Variables**
2. Add:
   ```
   VITE_API_BASE_URL=https://your-backend-url.vercel.app/api
   ```

---

## Step 5: Test the Deployment

### 5.1 Test Backend API
Visit your backend URL and test these endpoints:
- `https://your-backend-url.vercel.app/api` - API info
- `https://your-backend-url.vercel.app/api/health` - Health check
- `https://your-backend-url.vercel.app/api/opportunities` - Opportunities list
- `https://your-backend-url.vercel.app/api/opportunities/stats` - Statistics

### 5.2 Test Frontend Application
Visit your frontend URL and verify:
- Dashboard loads with sample data
- Navigation works between pages
- API calls are successful
- Charts and statistics display correctly

---

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain
1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records as instructed
4. Update CORS settings in backend if needed

---

## Troubleshooting Common Issues

### Backend Issues

**Issue**: "Module not found" errors
**Solution**: Ensure all imports use relative paths and `src/` directory structure is maintained

**Issue**: Database connection errors
**Solution**: Vercel uses ephemeral storage. Database resets on each cold start (expected behavior)

**Issue**: CORS errors
**Solution**: Ensure `CORS(app, origins=['*'])` is set in `api/index.py`

### Frontend Issues

**Issue**: API calls failing
**Solution**: Check `VITE_API_BASE_URL` environment variable is set correctly

**Issue**: Build errors
**Solution**: Run `npm run build` locally first to identify issues

**Issue**: Routing issues
**Solution**: Ensure `vercel.json` has the SPA routing configuration

---

## Production Considerations

### 1. Database
- Current setup uses SQLite in `/tmp` (resets on each deployment)
- For production, consider:
  - Vercel Postgres (paid)
  - External database (PlanetScale, Supabase, etc.)
  - Persistent storage solution

### 2. API Keys
- Add real API keys for SAM.gov, Grants.gov, Firecrawl
- Use Vercel environment variables (encrypted)
- Never commit API keys to code

### 3. Performance
- Enable Vercel Analytics
- Monitor function execution times
- Consider caching strategies for API responses

### 4. Security
- Use strong SECRET_KEY
- Implement rate limiting
- Add authentication if needed
- Configure proper CORS origins

---

## Deployment Commands Summary

```bash
# Backend deployment
cd opportunity_dashboard_backend
vercel

# Frontend deployment  
cd opportunity_dashboard_frontend
vercel

# Check deployments
vercel ls
```

---

## Next Steps After Deployment

1. **Monitor Performance**: Use Vercel Analytics and logs
2. **Add Real Data**: Configure API keys for live data sources
3. **Custom Domain**: Set up your own domain
4. **Database**: Upgrade to persistent database solution
5. **Authentication**: Add user authentication if needed
6. **Monitoring**: Set up error tracking and monitoring

---

## Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Flask on Vercel**: https://vercel.com/docs/functions/serverless-functions/runtimes/python
- **React on Vercel**: https://vercel.com/docs/frameworks/vite

Your Opportunity Dashboard is now ready for production use! 🚀

