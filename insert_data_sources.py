#!/usr/bin/env python3
"""
Insert initial data sources into the database
"""
import os
from dotenv import load_dotenv
from supabase import create_client

def insert_data_sources():
    """Insert initial data sources"""
    load_dotenv()
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    supabase = create_client(supabase_url, supabase_key)
    
    # Check current table structure
    try:
        result = supabase.table('data_sources').select('*').limit(1).execute()
        print("✅ Table data_sources is accessible")
    except Exception as e:
        print(f"❌ Table access error: {e}")
        return False
    
    # Insert initial data sources with correct structure
    initial_sources = [
        {
            'name': 'sam_gov',
            'type': 'federal_contract',
            'rate_limit_per_hour': 450,
            'priority_score': 90
        },
        {
            'name': 'grants_gov', 
            'type': 'federal_grant',
            'rate_limit_per_hour': 1000,
            'priority_score': 85
        },
        {
            'name': 'usa_spending',
            'type': 'federal_spending',
            'rate_limit_per_hour': 1000,
            'priority_score': 80
        }
    ]
    
    try:
        for source in initial_sources:
            # Use upsert to avoid duplicates
            result = supabase.table('data_sources').upsert(source, on_conflict='name').execute()
            print(f"✅ Inserted/updated source: {source['name']}")
        
        print("✅ All data sources inserted successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to insert data sources: {e}")
        return False

if __name__ == "__main__":
    insert_data_sources()