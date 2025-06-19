#!/usr/bin/env python3
"""
Test enhanced system integration for Opportunity Dashboard
Tests all components of the enhanced system in isolation and together
"""

import os
import sys
import json
import requests
from datetime import datetime

# Add src directory to path
sys.path.insert(0, '.')

from dotenv import load_dotenv
load_dotenv()

def test_environment_setup():
    """Test environment configuration"""
    print("🌍 Testing Environment Setup")
    print("-" * 50)
    
    required_vars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY', 
        'SAM_API_KEY',
        'FIRECRAWL_API_KEY'
    ]
    
    optional_vars = [
        'SUPABASE_SERVICE_ROLE_KEY',
        'PERPLEXITY_API_KEY',
        'CRON_SECRET'
    ]
    
    missing_required = []
    present_optional = []
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"   ✅ {var}: {value[:20]}...")
        else:
            print(f"   ❌ {var}: Missing")
            missing_required.append(var)
    
    for var in optional_vars:
        value = os.getenv(var)
        if value:
            print(f"   ✅ {var}: {value[:20]}...")
            present_optional.append(var)
        else:
            print(f"   ⚠️  {var}: Not set (optional)")
    
    print(f"\n   Required: {len(required_vars) - len(missing_required)}/{len(required_vars)}")
    print(f"   Optional: {len(present_optional)}/{len(optional_vars)}")
    
    return len(missing_required) == 0

def test_enhanced_imports():
    """Test importing enhanced services"""
    print("\n📦 Testing Enhanced Service Imports")
    print("-" * 50)
    
    import_results = {}
    
    # Test Supabase config
    try:
        from src.config.supabase import get_supabase_client, get_supabase_admin_client
        print("   ✅ Supabase config imported successfully")
        import_results['supabase_config'] = True
    except Exception as e:
        print(f"   ❌ Supabase config import failed: {e}")
        import_results['supabase_config'] = False
    
    # Test database service
    try:
        from src.services.database_service import get_database_service
        print("   ✅ Database service imported successfully")
        import_results['database_service'] = True
    except Exception as e:
        print(f"   ❌ Database service import failed: {e}")
        import_results['database_service'] = False
    
    # Test data fetcher
    try:
        from src.api.data_fetcher import DataFetcher
        print("   ✅ Data fetcher imported successfully")
        import_results['data_fetcher'] = True
    except Exception as e:
        print(f"   ❌ Data fetcher import failed: {e}")
        import_results['data_fetcher'] = False
    
    # Test background jobs
    try:
        from src.services.background_jobs import get_job_manager, get_rotation_manager
        print("   ✅ Background jobs imported successfully")
        import_results['background_jobs'] = True
    except Exception as e:
        print(f"   ❌ Background jobs import failed: {e}")
        import_results['background_jobs'] = False
    
    successful_imports = sum(import_results.values())
    total_imports = len(import_results)
    
    print(f"\n   Import Success Rate: {successful_imports}/{total_imports}")
    
    return import_results

def test_service_initialization():
    """Test initializing enhanced services"""
    print("\n🔧 Testing Service Initialization")
    print("-" * 50)
    
    init_results = {}
    
    # Test database service initialization
    try:
        from src.services.database_service import get_database_service
        db_service = get_database_service()
        print("   ✅ Database service initialized")
        init_results['database_service'] = True
        
        # Try to test connection (may fail without network)
        try:
            connected = db_service.test_connection()
            if connected:
                print("   ✅ Database connection successful")
                init_results['database_connection'] = True
            else:
                print("   ⚠️  Database connection failed (network/config issue)")
                init_results['database_connection'] = False
        except Exception as e:
            print(f"   ⚠️  Database connection test error: {e}")
            init_results['database_connection'] = False
            
    except Exception as e:
        print(f"   ❌ Database service initialization failed: {e}")
        init_results['database_service'] = False
        init_results['database_connection'] = False
    
    # Test data fetcher initialization
    try:
        from src.api.data_fetcher import DataFetcher
        data_fetcher = DataFetcher()
        print("   ✅ Data fetcher initialized")
        init_results['data_fetcher'] = True
    except Exception as e:
        print(f"   ❌ Data fetcher initialization failed: {e}")
        init_results['data_fetcher'] = False
    
    return init_results

def test_api_endpoints():
    """Test API endpoints locally and remotely"""
    print("\n🌐 Testing API Endpoints")
    print("-" * 50)
    
    # Test remote endpoints
    base_url = "https://backend-6i3jb9rfr-jacobs-projects-cf4c7bdb.vercel.app/api"
    
    endpoint_results = {}
    
    # Test main API
    try:
        response = requests.get(f"{base_url}/", timeout=30)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Main API: {data.get('message', 'OK')} (v{data.get('version', 'unknown')})")
            endpoint_results['main_api'] = True
        else:
            print(f"   ❌ Main API: HTTP {response.status_code}")
            endpoint_results['main_api'] = False
    except Exception as e:
        print(f"   ❌ Main API: {e}")
        endpoint_results['main_api'] = False
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=30)
        if response.status_code == 200:
            print("   ✅ Health endpoint working")
            endpoint_results['health'] = True
        else:
            print(f"   ❌ Health endpoint: HTTP {response.status_code}")
            endpoint_results['health'] = False
    except Exception as e:
        print(f"   ❌ Health endpoint: {e}")
        endpoint_results['health'] = False
    
    # Test opportunities endpoint
    try:
        response = requests.get(f"{base_url}/opportunities", timeout=60)
        if response.status_code == 200:
            data = response.json()
            opp_count = len(data.get('opportunities', []))
            print(f"   ✅ Opportunities endpoint: {opp_count} opportunities")
            endpoint_results['opportunities'] = True
        else:
            print(f"   ❌ Opportunities endpoint: HTTP {response.status_code}")
            endpoint_results['opportunities'] = False
    except Exception as e:
        print(f"   ❌ Opportunities endpoint: {e}")
        endpoint_results['opportunities'] = False
    
    return endpoint_results

def main():
    """Main test function"""
    print("🧪 Enhanced Opportunity Dashboard - Integration Testing")
    print("=" * 70)
    
    # Run all tests
    env_success = test_environment_setup()
    import_results = test_enhanced_imports()
    init_results = test_service_initialization()
    api_results = test_api_endpoints()
    
    # Calculate scores
    def calculate_score(results):
        if isinstance(results, dict):
            total = len(results)
            if total == 0:
                return 0, 0
            passed = sum(1 for v in results.values() if v is True)
            return passed, total
        return (1, 1) if results else (0, 1)
    
    env_score = (1, 1) if env_success else (0, 1)
    import_score = calculate_score(import_results)
    init_score = calculate_score(init_results)
    api_score = calculate_score(api_results)
    
    # Generate report
    print("\n" + "=" * 70)
    print("📋 INTEGRATION TEST SUMMARY")
    print("=" * 70)
    print(f"🌍 Environment Setup: {env_score[0]}/{env_score[1]} ({'✅' if env_score[0] == env_score[1] else '❌'})")
    print(f"📦 Service Imports: {import_score[0]}/{import_score[1]} ({'✅' if import_score[0] == import_score[1] else '⚠️ '})")
    print(f"🔧 Service Initialization: {init_score[0]}/{init_score[1]} ({'✅' if init_score[0] == init_score[1] else '⚠️ '})")
    print(f"🌐 API Endpoints: {api_score[0]}/{api_score[1]} ({'✅' if api_score[0] == api_score[1] else '⚠️ '})")
    
    # Overall assessment
    total_passed = env_score[0] + import_score[0] + init_score[0] + api_score[0]
    total_possible = env_score[1] + import_score[1] + init_score[1] + api_score[1]
    
    success_rate = (total_passed / total_possible) * 100 if total_possible > 0 else 0
    
    print(f"\n📊 Overall Success Rate: {total_passed}/{total_possible} ({success_rate:.1f}%)")
    
    if success_rate >= 80:
        print("🎉 Enhanced system integration: EXCELLENT")
        status = "excellent"
    elif success_rate >= 60:
        print("✅ Enhanced system integration: GOOD") 
        status = "good"
    elif success_rate >= 40:
        print("⚠️  Enhanced system integration: NEEDS WORK")
        status = "needs_work"
    else:
        print("❌ Enhanced system integration: CRITICAL ISSUES")
        status = "critical"
    
    return success_rate >= 60

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)