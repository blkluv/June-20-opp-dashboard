# Deployment Checklist for Opportunity Dashboard

## Pre-Deployment Checklist ✅

### Backend Preparation
- [x] `vercel.json` configuration created
- [x] `api/index.py` serverless entry point created
- [x] `requirements.txt` cleaned and optimized
- [x] Sample data script for serverless environment
- [x] CORS configured for production
- [x] Environment variables template created

### Frontend Preparation  
- [x] `vercel.json` configuration created
- [x] API client updated for environment variables
- [x] Production build tested locally
- [x] Environment variables template created
- [x] SPA routing configured

## Deployment Steps

### Step 1: Deploy Backend
```bash
cd opportunity_dashboard_backend
vercel login
vercel
```
**Expected Result**: Backend URL like `https://opportunity-dashboard-backend-xxx.vercel.app`

### Step 2: Configure Frontend Environment
```bash
cd opportunity_dashboard_frontend
echo "VITE_API_BASE_URL=https://your-backend-url.vercel.app/api" > .env.local
```

### Step 3: Deploy Frontend
```bash
cd opportunity_dashboard_frontend
vercel
```
**Expected Result**: Frontend URL like `https://opportunity-dashboard-frontend-xxx.vercel.app`

## Post-Deployment Verification

### Backend API Tests
- [ ] `GET /api` - API info endpoint
- [ ] `GET /api/health` - Health check
- [ ] `GET /api/opportunities` - Opportunities list (should return 5 sample opportunities)
- [ ] `GET /api/opportunities/stats` - Statistics (should show totals and distributions)
- [ ] `GET /api/sync/status` - Sync status

### Frontend Application Tests
- [ ] Dashboard loads without errors
- [ ] Statistics cards show data (8 total opportunities, $68.75M total value)
- [ ] Charts render with sample data
- [ ] Navigation between pages works
- [ ] Opportunities page shows list of opportunities
- [ ] Search page loads
- [ ] Sync status page loads
- [ ] Settings page loads
- [ ] Dark mode toggle works
- [ ] Mobile responsive design works

### Integration Tests
- [ ] Frontend successfully calls backend APIs
- [ ] No CORS errors in browser console
- [ ] Loading states work correctly
- [ ] Error handling works for failed API calls

## Environment Variables Setup

### Backend (Vercel Dashboard)
```
FLASK_ENV=production
SECRET_KEY=your-secure-secret-key-here
SAM_GOV_API_KEY=optional-for-real-data
FIRECRAWL_API_KEY=optional-for-web-scraping
```

### Frontend (Vercel Dashboard)
```
VITE_API_BASE_URL=https://your-backend-url.vercel.app/api
```

## Troubleshooting Guide

### Common Backend Issues
- **Cold start delays**: First request may be slow (normal for serverless)
- **Module import errors**: Check relative imports in `api/index.py`
- **Database resets**: SQLite in `/tmp` resets on cold starts (expected)

### Common Frontend Issues
- **API calls fail**: Verify `VITE_API_BASE_URL` is set correctly
- **Build errors**: Run `npm run build` locally first
- **Routing issues**: Ensure `vercel.json` has SPA configuration

## Performance Expectations

### Backend
- **Cold start**: 2-5 seconds for first request
- **Warm requests**: 100-500ms response time
- **Sample data**: Loads automatically on first run

### Frontend
- **Initial load**: 2-3 seconds (includes large bundle)
- **Navigation**: Instant (SPA routing)
- **API calls**: 100-1000ms depending on backend state

## Success Criteria

✅ **Backend deployed and responding to all API endpoints**
✅ **Frontend deployed and loading without errors**  
✅ **Sample data visible in dashboard (8 opportunities, charts populated)**
✅ **All navigation working**
✅ **No console errors**
✅ **Mobile responsive**

## Next Steps After Successful Deployment

1. **Add Real API Keys**: Configure SAM.gov and Firecrawl API keys for live data
2. **Custom Domain**: Set up your own domain name
3. **Database Upgrade**: Consider persistent database for production use
4. **Monitoring**: Set up error tracking and performance monitoring
5. **Authentication**: Add user authentication if needed
6. **Caching**: Implement API response caching for better performance

## Deployment URLs Template

Fill in after deployment:

- **Backend URL**: `https://_________________________.vercel.app`
- **Frontend URL**: `https://_________________________.vercel.app`
- **Custom Domain** (if configured): `https://_________________________`

## Support and Documentation

- **Vercel Docs**: https://vercel.com/docs
- **Project Repository**: Your GitHub repositories
- **API Documentation**: Available at your backend `/api` endpoint

---

**Deployment Status**: ⏳ Ready for deployment
**Last Updated**: June 2025

