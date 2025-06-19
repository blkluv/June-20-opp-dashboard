# Webhook-Based Scheduler Setup

Since Vercel cron jobs require a Pro plan, here are alternative scheduling options for the enhanced opportunity dashboard:

## Option 1: GitHub Actions (Recommended)

Create `.github/workflows/scheduled-sync.yml` in your repository:

```yaml
name: Scheduled Data Sync
on:
  schedule:
    # Run every 30 minutes
    - cron: '0,30 * * * *'
  workflow_dispatch: # Allow manual triggering

jobs:
  sync-data:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync All
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "https://your-backend-url.vercel.app/api/cron/sync-all"

  cleanup:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 2 * * *' # Only run cleanup at 2 AM
    steps:
      - name: Trigger Cleanup
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "https://your-backend-url.vercel.app/api/cron/cleanup"
```

### Setup Instructions:
1. Add `CRON_SECRET` to your GitHub repository secrets
2. Replace `your-backend-url.vercel.app` with your actual Vercel deployment URL
3. Commit the workflow file to enable scheduled runs

## Option 2: External Cron Services

### Using cron-job.org (Free)
1. Sign up at https://cron-job.org
2. Create jobs with these configurations:

**Sync All (Every 30 minutes):**
- URL: `https://your-backend-url.vercel.app/api/cron/sync-all`
- Schedule: `*/30 * * * *`
- HTTP Method: GET
- Headers: `Authorization: Bearer opportunity-dashboard-cron-secret-2024`

**Cleanup (Daily at 2 AM):**
- URL: `https://your-backend-url.vercel.app/api/cron/cleanup`
- Schedule: `0 2 * * *`
- HTTP Method: GET
- Headers: `Authorization: Bearer opportunity-dashboard-cron-secret-2024`

### Using EasyCron (Free tier available)
1. Sign up at https://www.easycron.com
2. Create HTTP cron jobs with the same URLs and headers

## Option 3: Manual Trigger via API

You can manually trigger sync operations by calling:

```bash
# Sync all sources (intelligent rotation)
curl -X GET \
  -H "Authorization: Bearer opportunity-dashboard-cron-secret-2024" \
  "https://your-backend-url.vercel.app/api/cron/sync-all"

# Sync specific source
curl -X GET \
  -H "Authorization: Bearer opportunity-dashboard-cron-secret-2024" \
  "https://your-backend-url.vercel.app/api/cron/sync-sam"

# Run cleanup
curl -X GET \
  -H "Authorization: Bearer opportunity-dashboard-cron-secret-2024" \
  "https://your-backend-url.vercel.app/api/cron/cleanup"
```

## Security Notes

1. **Change the CRON_SECRET**: Update the default secret in your environment variables
2. **Use HTTPS**: All webhook URLs use HTTPS for security
3. **Monitor logs**: Check Vercel function logs for sync results and errors
4. **Rate limiting**: The system includes intelligent source rotation to respect API limits

## Testing

Test your cron endpoints locally:
```bash
# Start local server
cd backend
python -m http.server 8000

# Test endpoints (in another terminal)
curl -X GET \
  -H "Authorization: Bearer opportunity-dashboard-cron-secret-2024" \
  "http://localhost:8000/api/cron/health"
```

## Monitoring

The cron endpoints return detailed JSON responses with:
- Execution status and timing
- Records processed/added/updated
- Error messages if any issues occur
- Timestamps for audit trails

Monitor these responses to ensure your scheduled jobs are working correctly.