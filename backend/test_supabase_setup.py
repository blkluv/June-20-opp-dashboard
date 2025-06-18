#!/usr/bin/env python3
"""
Test Supabase connection and set up database schema
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from src.config.supabase import get_supabase_admin_client

def test_connection():
    """Test Supabase connection"""
    try:
        supabase = get_supabase_admin_client()
        
        # Test basic connection with a simple query
        response = supabase.rpc('version').execute()
        print("✅ Supabase connection successful!")
        return True
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False

def create_schema():
    """Create database schema using SQL"""
    try:
        supabase = get_supabase_admin_client()
        
        # Read the schema file
        with open('supabase_schema.sql', 'r') as f:
            schema_sql = f.read()
        
        # Execute the schema
        response = supabase.rpc('exec_sql', {'sql': schema_sql}).execute()
        print("✅ Database schema created successfully!")
        return True
    except Exception as e:
        print(f"❌ Schema creation failed: {e}")
        return False

def test_tables():
    """Test that tables were created successfully"""
    try:
        supabase = get_supabase_admin_client()
        
        # Test each table
        tables = ['data_sources', 'opportunities', 'sync_logs', 'user_preferences']
        
        for table in tables:
            response = supabase.table(table).select('*').limit(1).execute()
            print(f"✅ Table '{table}' created and accessible")
        
        return True
    except Exception as e:
        print(f"❌ Table test failed: {e}")
        return False

if __name__ == "__main__":
    print("🗄️ SUPABASE SETUP TEST")
    print("=" * 30)
    
    if test_connection():
        print("\n📊 Creating database schema...")
        if create_schema():
            print("\n🔍 Testing tables...")
            if test_tables():
                print("\n🎉 Supabase setup complete!")
            else:
                print("\n❌ Table test failed")
        else:
            print("\n❌ Schema creation failed")
    else:
        print("\n❌ Connection failed")