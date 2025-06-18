#!/usr/bin/env python3
"""
Quick setup script for the enhanced opportunity dashboard
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

def run_quick_setup():
    """Run a quick setup to get the system working"""
    print("🚀 Quick Enhanced System Setup")
    print("=" * 50)
    
    load_dotenv()
    
    # Test connection
    print("1. Testing Supabase connection...")
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        
        # Test if our tables exist
        result = supabase.table('data_sources').select('count').execute()
        print("✅ Database connection successful!")
        
        # Check if we have any data sources
        sources = supabase.table('data_sources').select('*').execute()
        print(f"✅ Found {len(sources.data)} data sources")
        
        # Test opportunities table
        opportunities = supabase.table('opportunities').select('count').execute()
        print("✅ Opportunities table accessible")
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    # Deploy enhanced API
    print("\n2. Deploying enhanced API...")
    try:
        # Copy enhanced API over the original
        enhanced_api_path = os.path.join(os.path.dirname(__file__), 'backend', 'api', 'enhanced_index.py')
        current_api_path = os.path.join(os.path.dirname(__file__), 'backend', 'api', 'index.py')
        
        if os.path.exists(enhanced_api_path):
            # Backup current API
            backup_path = current_api_path + '.backup'
            if os.path.exists(current_api_path):
                os.rename(current_api_path, backup_path)
                print(f"✅ Backed up current API to {backup_path}")
            
            # Copy enhanced API
            with open(enhanced_api_path, 'r') as f:
                enhanced_content = f.read()
            
            with open(current_api_path, 'w') as f:
                f.write(enhanced_content)
            
            print("✅ Enhanced API deployed!")
        else:
            print("❌ Enhanced API file not found")
            return False
            
    except Exception as e:
        print(f"❌ API deployment failed: {e}")
        return False
    
    # Test the enhanced API locally
    print("\n3. Testing enhanced API...")
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
        from src.services.database_service import DatabaseService
        from src.services.background_jobs import BackgroundJobManager
        
        # Test database service
        db_service = DatabaseService()
        print("✅ Database service initialized")
        
        # Test background jobs
        job_manager = BackgroundJobManager()
        print("✅ Background job manager initialized")
        
        print("✅ All services working!")
        
    except Exception as e:
        print(f"❌ Service test failed: {e}")
        return False
    
    print("\n4. System Ready!")
    print("=" * 50)
    print("🎉 Enhanced Opportunity Dashboard Setup Complete!")
    print("\n📊 Next Steps:")
    print("1. Deploy to Vercel: vercel --prod")
    print("2. Visit your dashboard to see cached data")
    print("3. Background jobs will sync data every 30 minutes")
    print("\n🔗 API Endpoints:")
    print("- GET /api/ - System information")
    print("- GET /api/opportunities - Cached opportunities")
    print("- GET /api/jobs/status - Background job status")
    print("- POST /api/sync - Manual sync trigger")
    
    return True

if __name__ == "__main__":
    success = run_quick_setup()
    sys.exit(0 if success else 1)