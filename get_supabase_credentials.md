# 🔑 Get Your Supabase Credentials

## Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your opportunity-dashboard project

## Step 2: Get API Credentials
1. Go to **Settings** → **API** (in left sidebar)
2. Copy these three values:

### Project URL
```
https://your-project-id.supabase.co
```

### anon/public Key (starts with eyJ...)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### service_role Key (starts with eyJ...)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Update .env File
Replace the placeholder values in `.env` with your actual credentials:

```bash
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
```

## Step 4: Create Database Schema
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase_schema.sql`
4. Paste and click **Run**

This will create all the necessary tables, indexes, and policies.

---

**Once you've done these steps, let me know and I'll continue with the automated setup!**