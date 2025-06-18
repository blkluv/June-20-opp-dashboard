#!/usr/bin/env python3
"""
Quick setup checker for the Enhanced Opportunity Dashboard
"""
import os
import sys
from dotenv import load_dotenv

def check_setup():
    """Check if the system is properly configured"""
    print("🔍 Checking Enhanced System Setup...")
    
    # Load environment variables
    load_dotenv()
    
    # Check critical environment variables
    required_vars = {
        'SUPABASE_URL': os.getenv('SUPABASE_URL'),
        'SUPABASE_ANON_KEY': os.getenv('SUPABASE_ANON_KEY'),
        'SUPABASE_SERVICE_ROLE_KEY': os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    }
    
    missing_vars = []
    placeholder_vars = []
    
    for var_name, var_value in required_vars.items():
        if not var_value:
            missing_vars.append(var_name)
        elif 'your-project-id' in var_value or 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' in var_value:
            placeholder_vars.append(var_name)
    
    # Report status
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
        
    if placeholder_vars:
        print(f"⚠️  Placeholder values detected: {', '.join(placeholder_vars)}")
        print("\n📋 To complete setup:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Select your project")
        print("3. Go to Settings → API")
        print("4. Copy your Project URL, anon key, and service_role key")
        print("5. Update the .env file with your actual values")
        print("\n🔧 Then run: python setup_complete_system.py")
        return False
    
    print("✅ Environment variables are properly configured!")
    
    # Check if we can import our services
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
        from src.services.database_service import DatabaseService
        print("✅ Database service is available")
        
        from src.services.background_jobs import BackgroundJobManager
        print("✅ Background job manager is available")
        
        print("\n🚀 System appears ready! Run: python setup_complete_system.py")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

if __name__ == "__main__":
    success = check_setup()
    sys.exit(0 if success else 1)