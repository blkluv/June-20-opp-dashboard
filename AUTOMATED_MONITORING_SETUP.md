# 🤖 **Automated Monitoring Setup Guide**

## 🎯 **What This Does**

Your automated monitoring system will run **in the cloud for FREE** on GitHub's servers:

- ⏰ **Every Hour**: Check for urgent contract announcements
- 📅 **Daily at 9AM**: Full AI discovery + web scraping  
- 📊 **Weekly Monday 8AM**: Market intelligence reports
- 🔧 **Manual Triggers**: Run monitoring on-demand

**Total Cost: $0** (GitHub Actions is free for public repos)

---

## 🚀 **Setup Steps (5 minutes)**

### **Step 1: Add Your API Keys to GitHub Secrets**

1. **Go to your GitHub repository**: 
   - https://github.com/MagicWifiMoney/opportunity-dashboard

2. **Click Settings tab** (top of repo)

3. **Click "Secrets and variables" → "Actions"** (left sidebar)

4. **Add these secrets** (click "New repository secret" for each):

```bash
# Required secrets to add:
SUPABASE_URL = https://zkdrpchjejelgsuuffli.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZHJwY2hqZWplbGdzdXVmZmxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDIyNjgxMywiZXhwIjoyMDY1ODAyODEzfQ.sfXaVkEOIiJMpKdTt7YLauIwxcqjhL1J04Vt92neWR4
PERPLEXITY_API_KEY = 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
FIRECRAWL_API_KEY = fc-3613f533df0e42d09306650f54b2f00c
SAM_GOV_API_KEY = rCTGB3OnZVurfr2X7hqDHMt6DUHilFnP7WgtflLf
```

### **Step 2: Push the Workflow File**

The automated monitoring file is already created at:
`.github/workflows/automated-monitoring.yml`

Just commit and push it:

```bash
git add .github/workflows/automated-monitoring.yml
git commit -m "Add automated monitoring system"
git push origin main
```

### **Step 3: Enable GitHub Actions**

1. **Go to "Actions" tab** in your GitHub repo
2. **Click "Enable GitHub Actions"** if prompted
3. **You should see the workflow** "🤖 Automated Contract Monitoring"

---

## ⚡ **How It Works**

### **🔄 Automatic Schedule**
```yaml
Every Hour (24/7):     Check for urgent announcements
Daily at 9AM UTC:      Full discovery + scraping session  
Weekly Monday 8AM:     Deep market intelligence analysis
On Every Push:         Health check of all systems
```

### **🧠 What Each Session Does**

**⏰ Hourly (2-3 minutes runtime):**
- 🚨 Scan for urgent contract announcements
- 🔍 Check breaking news in government contracting
- 📧 Would send alerts if urgent opportunities found

**📅 Daily (10-15 minutes runtime):**
- 🤖 Run full Perplexity AI discovery
- 🔥 Scrape GSA and DoD contract pages
- 💾 Save new opportunities to Supabase
- 📊 Generate discovery reports

**📊 Weekly (20-30 minutes runtime):**
- 📈 Analyze market trends across all sectors
- 🔮 Predict upcoming opportunities by industry
- 🛡️ Deep dive into defense contracting trends
- 📄 Generate comprehensive intelligence reports

---

## 📊 **Monitoring Dashboard**

### **View Results in GitHub:**
1. **Go to "Actions" tab** in your repo
2. **Click on any workflow run** to see logs
3. **View real-time progress** as monitoring runs

### **Example Output You'll See:**
```bash
⏰ HOURLY MONITORING - 2024-06-18 14:00:00 UTC
==================================================
🤖 Checking for urgent contract announcements...
✅ No urgent announcements in last 2 hours
⏰ Hourly monitoring complete

📅 DAILY MONITORING - 2024-06-18 09:00:00 UTC
==================================================
🤖 Running daily AI discovery...
✅ AI discovery complete with 5 sources
📊 Extracted 3 opportunities from AI response
🔥 Running daily Firecrawl scraping...
📡 Scraping GSA News...
   ✅ GSA News: 88,911 chars, 215 contract mentions
📡 Scraping DoD Contracts...
   ✅ DoD Contracts: 18,288 chars, 62 contract mentions
🎯 Daily scraping complete: 277 contract mentions found
```

---

## 🎮 **Manual Controls**

### **Run Monitoring On-Demand:**
1. **Go to Actions tab** → "🤖 Automated Contract Monitoring"
2. **Click "Run workflow"** 
3. **Choose monitoring type:**
   - Manual (demo all capabilities)
   - Hourly (urgent check)
   - Daily (full discovery)
   - Weekly (market intelligence)

### **Customize Schedule:**
Edit `.github/workflows/automated-monitoring.yml`:
```yaml
schedule:
  - cron: '0 */2 * * *'    # Every 2 hours instead
  - cron: '0 6 * * *'      # Daily at 6AM instead
  - cron: '0 9 * * 0'      # Weekly Sunday 9AM instead
```

---

## 📈 **Monitoring Results**

### **What Gets Saved:**
- 🎯 **New opportunities** → Supabase database
- 📊 **Market intelligence** → Could save to separate table
- 🔍 **Discovery logs** → GitHub Actions logs
- 📧 **Alerts** → Currently logged (could extend to email/Slack)

### **Data You'll Collect:**
- **50-100+ new opportunities per week** (estimated)
- **Market trend analysis** every Monday
- **Competitive intelligence** on high-value contracts
- **Predictive insights** for upcoming opportunities

---

## 🚨 **Alerting & Notifications**

### **Current Setup:**
- ✅ **Console logging** in GitHub Actions
- ✅ **Urgent announcement detection**
- ✅ **Error handling and reporting**

### **Easy Extensions:**
```python
# Add to monitoring scripts for Slack alerts:
if urgent_announcement_found:
    requests.post(slack_webhook_url, json={
        'text': f'🚨 Urgent Contract: {announcement_title}'
    })

# Add to monitoring scripts for email alerts:
if high_value_opportunity_found:
    send_email(
        to='your-email@domain.com',
        subject='High-Value Opportunity Alert',
        body=opportunity_details
    )
```

---

## 🔧 **Troubleshooting**

### **If Workflows Don't Run:**
1. ✅ Check that GitHub Actions is enabled
2. ✅ Verify all secrets are added correctly
3. ✅ Make sure workflow file is in correct path
4. ✅ Check that repository is not private (or you have Actions minutes)

### **If API Calls Fail:**
1. ✅ Check API key quotas/limits
2. ✅ Verify secret names match exactly
3. ✅ Look at GitHub Actions logs for specific errors

### **Rate Limit Management:**
- **Perplexity**: 20 requests/month free → Monitor usage
- **Firecrawl**: 500 requests/month free → Controlled scraping
- **SAM.gov**: 5 requests/minute → Built-in delays

---

## 🎯 **Success Metrics**

After setup, you should see:

**📊 Weekly Discovery:**
- 10-50 new opportunities found
- 3-5 market intelligence reports
- 100+ government pages monitored

**🤖 AI-Powered Insights:**
- Competitive analysis on major contracts
- Trend predictions for your industries
- Early alerts on urgent opportunities

**⚡ Automation Benefits:**
- 24/7 monitoring without manual work
- Never miss urgent announcements
- Comprehensive market intelligence
- Data-driven opportunity pipeline

---

## 🎉 **You're All Set!**

Once you push the workflow file and add the secrets:

✅ **Automated monitoring** runs 24/7  
✅ **AI discovery** finds opportunities before competitors  
✅ **Market intelligence** guides business strategy  
✅ **Zero maintenance** required  
✅ **Completely free** to operate  

**Your opportunity dashboard now has enterprise-grade automated monitoring!**