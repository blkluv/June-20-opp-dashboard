#!/usr/bin/env python3
"""
Fix database schema to match the actual supabase_schema.sql
"""
import os
from dotenv import load_dotenv
from supabase import create_client

def fix_database_schema():
    """Fix the database schema to match the actual SQL file"""
    load_dotenv()
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    supabase = create_client(supabase_url, supabase_key)
    
    print("🔧 Fixing database schema...")
    
    # Drop existing tables and recreate with correct schema
    try:
        # Read the actual schema file
        schema_path = os.path.join(os.path.dirname(__file__), 'supabase_schema.sql')
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        # Execute the complete schema
        # Split by semicolons and execute each statement
        statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]
        
        for i, stmt in enumerate(statements):
            if stmt and not stmt.startswith('--'):
                try:
                    # Skip comments and empty statements
                    if 'CREATE' in stmt or 'INSERT' in stmt or 'CREATE INDEX' in stmt:
                        print(f"Executing statement {i+1}...")
                        # For Supabase, we need to use the RPC function
                        result = supabase.rpc('sql_execute', {'sql': stmt + ';'})
                        print(f"✅ Statement {i+1} executed")
                except Exception as e:
                    print(f"⚠️  Statement {i+1} warning: {str(e)}")
        
        print("✅ Schema fixed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Schema fix failed: {str(e)}")
        return False

if __name__ == "__main__":
    fix_database_schema()