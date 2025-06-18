#!/usr/bin/env python3
"""
Test Supabase connection and basic operations
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

def test_connection():
    """Test basic Supabase connection"""
    load_dotenv()
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    print(f"🔗 Testing connection to: {supabase_url}")
    
    try:
        # Create client
        supabase = create_client(supabase_url, supabase_key)
        
        # Test basic connection
        result = supabase.table('data_sources').select('count').execute()
        print("✅ Connection successful!")
        
        # Test if we can create a simple table
        test_sql = """
        CREATE TABLE IF NOT EXISTS test_table (
            id SERIAL PRIMARY KEY,
            name TEXT
        );
        """
        
        try:
            # Try to execute SQL
            result = supabase.rpc('sql_execute', {'sql': test_sql})
            print("✅ SQL execution works!")
            
            # Clean up test table
            cleanup_sql = "DROP TABLE IF EXISTS test_table;"
            result = supabase.rpc('sql_execute', {'sql': cleanup_sql})
            print("✅ SQL cleanup works!")
            
        except Exception as e:
            print(f"⚠️  SQL execution not available: {e}")
            print("💡 You'll need to run the schema manually in Supabase Dashboard")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()