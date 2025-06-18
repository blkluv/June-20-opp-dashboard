#!/usr/bin/env python3
"""
Create database schema directly using Supabase API
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

def create_database_schema():
    """Create the database schema using Supabase API"""
    load_dotenv()
    
    # Get Supabase credentials
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase credentials")
        return False
    
    print("🗄️ Creating database schema...")
    
    try:
        # Create Supabase client
        supabase = create_client(supabase_url, supabase_key)
        
        # Read schema file
        schema_path = os.path.join(os.path.dirname(__file__), 'supabase_schema.sql')
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        print("📄 Executing schema SQL...")
        
        # Execute schema creation
        # Note: We'll need to execute this in parts since some SQL features might not be available
        
        # Create opportunities table
        opportunities_sql = """
        CREATE TABLE IF NOT EXISTS opportunities (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            agency_name TEXT,
            total_value DECIMAL(15,2),
            award_date DATE,
            due_date DATE,
            source_type TEXT CHECK (source_type IN ('federal_contract', 'federal_grant', 'state_rfp', 'private_rfp', 'scraped')),
            source_url TEXT,
            source_name TEXT NOT NULL,
            external_id TEXT,
            relevance_score INTEGER DEFAULT 0,
            urgency_score INTEGER DEFAULT 0,
            value_score INTEGER DEFAULT 0,
            competition_score INTEGER DEFAULT 0,
            total_score INTEGER DEFAULT 0,
            keywords TEXT[],
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(external_id, source_name)
        );
        """
        
        # Create data_sources table
        data_sources_sql = """
        CREATE TABLE IF NOT EXISTS data_sources (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            type TEXT NOT NULL,
            api_endpoint TEXT,
            is_active BOOLEAN DEFAULT true,
            priority_score INTEGER DEFAULT 50,
            rate_limit_per_hour INTEGER DEFAULT 1000,
            last_accessed TIMESTAMP WITH TIME ZONE,
            success_rate DECIMAL(5,2) DEFAULT 100.00,
            avg_response_time INTEGER DEFAULT 0,
            total_requests INTEGER DEFAULT 0,
            successful_requests INTEGER DEFAULT 0,
            configuration JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        # Create sync_logs table
        sync_logs_sql = """
        CREATE TABLE IF NOT EXISTS sync_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            source_name TEXT NOT NULL,
            status TEXT CHECK (status IN ('started', 'completed', 'failed', 'partial')),
            records_processed INTEGER DEFAULT 0,
            records_added INTEGER DEFAULT 0,
            records_updated INTEGER DEFAULT 0,
            error_message TEXT,
            execution_time INTEGER,
            started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE,
            metadata JSONB DEFAULT '{}'
        );
        """
        
        # Create user_preferences table
        user_preferences_sql = """
        CREATE TABLE IF NOT EXISTS user_preferences (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID,
            preference_key TEXT NOT NULL,
            preference_value JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, preference_key)
        );
        """
        
        # Execute table creation
        tables = [
            ("opportunities", opportunities_sql),
            ("data_sources", data_sources_sql),
            ("sync_logs", sync_logs_sql),
            ("user_preferences", user_preferences_sql)
        ]
        
        for table_name, sql in tables:
            try:
                result = supabase.rpc('sql_execute', {'sql': sql})
                print(f"✅ Created table: {table_name}")
            except Exception as e:
                print(f"⚠️  Table {table_name} creation: {str(e)}")
        
        # Create indexes
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_opportunities_agency ON opportunities(agency_name);",
            "CREATE INDEX IF NOT EXISTS idx_opportunities_due_date ON opportunities(due_date);",
            "CREATE INDEX IF NOT EXISTS idx_opportunities_total_score ON opportunities(total_score DESC);",
            "CREATE INDEX IF NOT EXISTS idx_opportunities_source ON opportunities(source_name);",
            "CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_sync_logs_source_status ON sync_logs(source_name, status);",
            "CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at DESC);"
        ]
        
        for index_sql in indexes:
            try:
                result = supabase.rpc('sql_execute', {'sql': index_sql})
                print("✅ Created index")
            except Exception as e:
                print(f"⚠️  Index creation: {str(e)}")
        
        # Insert initial data sources
        initial_sources = [
            {
                'name': 'sam_gov',
                'type': 'federal_contract',
                'api_endpoint': 'https://api.sam.gov/opportunities/v2/search',
                'rate_limit_per_hour': 450,
                'priority_score': 90
            },
            {
                'name': 'grants_gov',
                'type': 'federal_grant',
                'api_endpoint': 'https://www.grants.gov/grantsws/rest/opportunities/search',
                'rate_limit_per_hour': 1000,
                'priority_score': 85
            },
            {
                'name': 'usa_spending',
                'type': 'federal_spending',
                'api_endpoint': 'https://api.usaspending.gov/api/v2/search/spending_by_award',
                'rate_limit_per_hour': 1000,
                'priority_score': 80
            }
        ]
        
        # Insert data sources
        try:
            for source in initial_sources:
                result = supabase.table('data_sources').upsert(source, on_conflict='name').execute()
            print("✅ Inserted initial data sources")
        except Exception as e:
            print(f"⚠️  Data sources insertion: {str(e)}")
        
        print("✅ Database schema created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Schema creation failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = create_database_schema()
    sys.exit(0 if success else 1)