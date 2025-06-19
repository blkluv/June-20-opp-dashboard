#!/usr/bin/env python3
"""
Test script for cron endpoints
Tests the serverless cron job functionality locally and remotely
"""

import requests
import json
import os
import sys
from datetime import datetime

def test_endpoint(url, headers=None, description=""):
    """Test a single endpoint and return results"""
    try:
        print(f"\n🔍 Testing: {description}")
        print(f"   URL: {url}")
        
        response = requests.get(url, headers=headers or {}, timeout=30)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"   ✅ Success")
                
                # Print key information based on endpoint type
                if 'status' in data:
                    print(f"   Status: {data['status']}")
                
                if 'total_processed' in data:
                    print(f"   Processed: {data['total_processed']}")
                    print(f"   Added: {data.get('total_added', 0)}")
                    print(f"   Updated: {data.get('total_updated', 0)}")
                
                if 'enhanced_services' in data:
                    print(f"   Enhanced Services: {data['enhanced_services']}")
                
                if 'duration_ms' in data:
                    print(f"   Duration: {data['duration_ms']}ms")
                
                # Show first few lines of response for debugging
                print(f"   Response preview: {json.dumps(data, indent=2)[:200]}...")
                
                return True, data
            except json.JSONDecodeError:
                print(f"   ❌ Invalid JSON response")
                print(f"   Response: {response.text[:200]}...")
                return False, None
        else:
            print(f"   ❌ HTTP Error {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request failed: {e}")
        return False, None

def main():
    """Main test function"""
    print("🚀 Testing Cron Endpoints for Opportunity Dashboard")
    print("=" * 60)
    
    # Configuration
    LOCAL_BASE_URL = "http://localhost:8000/api/cron"
    REMOTE_BASE_URL = "https://backend-6i3jb9rfr-jacobs-projects-cf4c7bdb.vercel.app/api/cron"
    
    # Get cron secret from environment
    cron_secret = os.getenv('CRON_SECRET', 'opportunity-dashboard-cron-secret-2024')
    headers = {
        'Authorization': f'Bearer {cron_secret}',
        'Content-Type': 'application/json'
    }
    
    # Test mode selection
    if len(sys.argv) > 1 and sys.argv[1] == 'remote':
        base_url = REMOTE_BASE_URL
        print("📡 Testing REMOTE endpoints")
    else:
        base_url = LOCAL_BASE_URL
        print("🏠 Testing LOCAL endpoints")
        print("   (Use 'python test_cron_endpoints.py remote' for remote testing)")
    
    print(f"   Base URL: {base_url}")
    print(f"   Auth: Bearer {cron_secret[:10]}...")
    
    # Test endpoints
    test_results = []
    
    # 1. Health check
    success, data = test_endpoint(
        f"{base_url}/health",
        headers,
        "Health Check"
    )
    test_results.append(('Health', success))
    
    # 2. Root endpoint
    success, data = test_endpoint(
        f"{base_url}/",
        headers,
        "Root Endpoint"
    )
    test_results.append(('Root', success))
    
    # 3. Sync all (intelligent rotation)
    success, data = test_endpoint(
        f"{base_url}/sync-all",
        headers,
        "Sync All Sources (Intelligent Rotation)"
    )
    test_results.append(('Sync All', success))
    
    # 4. Individual source tests (only if sync-all worked)
    if success:
        success, data = test_endpoint(
            f"{base_url}/sync-sam",
            headers,
            "Sync SAM.gov"
        )
        test_results.append(('Sync SAM', success))
        
        success, data = test_endpoint(
            f"{base_url}/sync-grants",
            headers,
            "Sync Grants.gov"
        )
        test_results.append(('Sync Grants', success))
        
        success, data = test_endpoint(
            f"{base_url}/sync-usa-spending",
            headers,
            "Sync USASpending.gov"
        )
        test_results.append(('Sync USA Spending', success))
    
    # 5. Cleanup (be careful with this one)
    if '--include-cleanup' in sys.argv:
        success, data = test_endpoint(
            f"{base_url}/cleanup",
            headers,
            "Database Cleanup (⚠️  Deletes old records)"
        )
        test_results.append(('Cleanup', success))
    else:
        print(f"\n🔍 Skipping cleanup test (use --include-cleanup to test)")
        test_results.append(('Cleanup', 'skipped'))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    failed = 0
    skipped = 0
    
    for test_name, result in test_results:
        if result is True:
            print(f"   ✅ {test_name}: PASSED")
            passed += 1
        elif result is False:
            print(f"   ❌ {test_name}: FAILED")
            failed += 1
        else:
            print(f"   ⏭️  {test_name}: SKIPPED")
            skipped += 1
    
    print(f"\n   Total: {len(test_results)} tests")
    print(f"   Passed: {passed}")
    print(f"   Failed: {failed}")
    print(f"   Skipped: {skipped}")
    
    if failed > 0:
        print(f"\n❌ Some tests failed. Check the logs above for details.")
        sys.exit(1)
    else:
        print(f"\n✅ All tests passed! Cron endpoints are working correctly.")

if __name__ == "__main__":
    main()