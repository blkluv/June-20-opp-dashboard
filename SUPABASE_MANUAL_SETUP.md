# Supabase Manual Database Setup Guide

Since the automated schema deployment encountered network connectivity issues, here's how to manually set up the database schema in Supabase.

## Step 1: Access Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: `opportunity-dashboard`
4. Click on "SQL Editor" in the left sidebar
5. Click "New query" to create a new SQL query

## Step 2: Execute Database Schema

Copy and paste the following SQL schema into the SQL editor and run it:

```sql
-- Opportunity Dashboard - Supabase Database Schema
-- Created for PostgreSQL/Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Data Sources table
CREATE TABLE IF NOT EXISTS data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    base_url VARCHAR(500),
    api_key_required BOOLEAN DEFAULT FALSE,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunities table (main data)
CREATE TABLE IF NOT EXISTS opportunities (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(100) UNIQUE, -- Original ID from source
    title VARCHAR(500) NOT NULL,
    description TEXT,
    agency_name VARCHAR(200),
    opportunity_number VARCHAR(100),
    estimated_value DECIMAL(15,2),
    posted_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'open',
    source_type VARCHAR(50) NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    source_url VARCHAR(500),
    location VARCHAR(200),
    contact_info TEXT,
    keywords JSONB,
    
    -- Scoring fields
    relevance_score INTEGER DEFAULT 0,
    urgency_score INTEGER DEFAULT 0,
    value_score INTEGER DEFAULT 0,
    competition_score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    
    -- Metadata
    data_source_id INTEGER REFERENCES data_sources(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync Logs table
CREATE TABLE IF NOT EXISTS sync_logs (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL,
    sync_type VARCHAR(50) NOT NULL,
    records_processed INTEGER DEFAULT 0,
    records_added INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    sync_duration_ms INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- User Preferences table (for future user system)
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID DEFAULT uuid_generate_v4(),
    keywords JSONB,
    notification_settings JSONB,
    scoring_weights JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Step 3: Create Indexes

Run this query to create performance indexes:

```sql
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_source_type ON opportunities(source_type);
CREATE INDEX IF NOT EXISTS idx_opportunities_total_score ON opportunities(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_due_date ON opportunities(due_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_posted_date ON opportunities(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_external_id ON opportunities(external_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_keywords ON opportunities USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_sync_logs_source_name ON sync_logs(source_name);
```

## Step 4: Set Up Row Level Security (Optional)

```sql
-- RLS (Row Level Security) policies - Optional for multi-user
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Allow public read access for now (can be restricted later)
CREATE POLICY "Allow public read on opportunities" ON opportunities FOR SELECT USING (true);
CREATE POLICY "Allow public read on data_sources" ON data_sources FOR SELECT USING (true);
CREATE POLICY "Allow public read on sync_logs" ON sync_logs FOR SELECT USING (true);
```

## Step 5: Insert Initial Data

```sql
-- Insert initial data sources
INSERT INTO data_sources (name, type, base_url, api_key_required, rate_limit_per_hour) VALUES
('USASpending.gov', 'federal_contract', 'https://api.usaspending.gov/api/v2/', FALSE, 1000),
('Grants.gov', 'federal_grant', 'https://www.grants.gov/web/grants/search-grants.html', FALSE, 1000),
('SAM.gov', 'federal_contract', 'https://api.sam.gov/prod/opportunities/v1/', TRUE, 450),
('Firecrawl', 'web_scraping', 'https://api.firecrawl.dev/', TRUE, 100)
ON CONFLICT (name) DO NOTHING;
```

## Step 6: Create Update Triggers

```sql
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_sources_updated_at ON data_sources;
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

## Step 7: Verify Setup

Run this query to verify the tables were created successfully:

```sql
-- Check if all tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('opportunities', 'data_sources', 'sync_logs', 'user_preferences')
ORDER BY table_name;

-- Check data sources
SELECT * FROM data_sources;

-- Check table counts
SELECT 
    'opportunities' as table_name, COUNT(*) as record_count FROM opportunities
UNION ALL
SELECT 
    'data_sources' as table_name, COUNT(*) as record_count FROM data_sources
UNION ALL
SELECT 
    'sync_logs' as table_name, COUNT(*) as record_count FROM sync_logs;
```

## Step 8: Test Enhanced API

After setting up the database, test the enhanced functionality:

1. **Test database connection**:
   ```bash
   curl -s "https://backend-6i3jb9rfr-jacobs-projects-cf4c7bdb.vercel.app/api/db/test" | jq '.'
   ```

2. **Test cron sync with database**:
   ```bash
   curl -s -H "Authorization: Bearer opportunity-dashboard-cron-secret-2024" \
        "https://backend-6i3jb9rfr-jacobs-projects-cf4c7bdb.vercel.app/api/cron/sync-all" | jq '.'
   ```

3. **Check cached opportunities**:
   ```bash
   curl -s "https://backend-6i3jb9rfr-jacobs-projects-cf4c7bdb.vercel.app/api/db/opportunities" | jq '.'
   ```

## Expected Results

After successful setup, you should see:
- ✅ 4 tables created (opportunities, data_sources, sync_logs, user_preferences)
- ✅ 4 initial data sources inserted
- ✅ All indexes and triggers created
- ✅ Database connection tests pass
- ✅ Cron jobs can sync data to database
- ✅ API returns cached opportunities from database

## Troubleshooting

**Error: "relation does not exist"**
- Make sure you're running queries in the correct schema (usually 'public')
- Check that all CREATE TABLE statements completed successfully

**Error: "permission denied"**
- Ensure you're using the service role key for admin operations
- Check RLS policies if data is not visible

**Connection timeouts**
- Verify SUPABASE_URL and keys are correct
- Check if Supabase project is active and not paused

## Next Steps

Once the database is set up:
1. ✅ Enable GitHub Actions for automated syncing
2. ✅ Monitor sync logs in Supabase dashboard  
3. ✅ Set up alerts for sync failures
4. ✅ Customize scoring algorithms as needed
5. ✅ Add user authentication when ready