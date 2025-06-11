# Deployment Instructions

## Option 1: Separate Repositories (Recommended)

### Backend Repository
1. Create new GitHub repository: `opportunity-dashboard-backend`
2. Upload contents of `/backend` folder
3. Deploy to Vercel from this repository

### Frontend Repository  
1. Create new GitHub repository: `opportunity-dashboard-frontend`
2. Upload contents of `/frontend` folder
3. Deploy to Vercel from this repository

## Option 2: Monorepo

1. Create single GitHub repository: `opportunity-dashboard`
2. Upload entire project structure
3. Configure Vercel to deploy from subdirectories:
   - Backend: `/backend` directory
   - Frontend: `/frontend` directory

## Quick Commands

```bash
# For separate repos
git clone <your-backend-repo>
cd opportunity-dashboard-backend
# Copy backend files here
git add .
git commit -m "Initial backend commit"
git push

git clone <your-frontend-repo>  
cd opportunity-dashboard-frontend
# Copy frontend files here
git add .
git commit -m "Initial frontend commit"
git push
```

## Vercel Deployment

1. Connect GitHub repositories to Vercel
2. Configure environment variables
3. Deploy automatically on push

See `docs/vercel_deployment_guide.md` for detailed instructions.

