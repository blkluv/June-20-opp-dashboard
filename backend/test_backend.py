#!/usr/bin/env python3
"""
Test script for the Opportunity Dashboard Backend with Firecrawl
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000/api"

def test_api_endpoint(endpoint, method='GET', data=None):
    """Test an API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, timeout=10)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data, timeout=10)
        else:
            print(f"❌ Unsupported method: {method}")
            return False
        
        if response.status_code == 200:
            print(f"✅ {method} {endpoint} - Status: {response.status_code}")
            return True
        else:
            print(f"❌ {method} {endpoint} - Status: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {method} {endpoint} - Connection failed (server not running?)")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ {method} {endpoint} - Request timeout")
        return False
    except Exception as e:
        print(f"❌ {method} {endpoint} - Error: {str(e)}")
        return False

def test_backend():
    """Run comprehensive backend tests"""
    print("🚀 Testing Opportunity Dashboard Backend with Firecrawl")
    print("=" * 60)
    
    # Test basic endpoints
    tests = [
        ("Basic Health Check", "/", "GET"),
        ("Opportunities List", "/opportunities", "GET"),
        ("Opportunities Stats", "/opportunities/stats", "GET"),
        ("Sync Status", "/sync/status", "GET"),
        ("Scraping Sources", "/scraping/sources", "GET"),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, endpoint, method in tests:
        print(f"\n📋 Testing: {test_name}")
        if test_api_endpoint(endpoint, method):
            passed += 1
    
    # Test search functionality
    print(f"\n📋 Testing: Advanced Search")
    search_data = {
        "keywords": ["software", "development"],
        "min_score": 50,
        "due_within_days": 90
    }
    
    if test_api_endpoint("/opportunities/search", "POST", search_data):
        passed += 1
    total += 1
    
    # Test with query parameters
    print(f"\n📋 Testing: Filtered Opportunities")
    if test_api_endpoint("/opportunities?status=active&per_page=5", "GET"):
        passed += 1
    total += 1
    
    # Test Firecrawl functionality
    print(f"\n📋 Testing: Firecrawl Test")
    firecrawl_test_data = {"url": "https://example.com"}
    if test_api_endpoint("/scraping/test", "POST", firecrawl_test_data):
        passed += 1
    total += 1
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend with Firecrawl is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the server logs for details.")
    
    return passed == total

def test_firecrawl_scraping():
    """Test Firecrawl scraping functionality (requires API key)"""
    print("\n🕷️  Testing Firecrawl Scraping")
    print("Note: This requires FIRECRAWL_API_KEY to be set")
    
    try:
        # Test getting available sources
        response = requests.get(f"{BASE_URL}/scraping/sources", timeout=30)
        if response.status_code == 200:
            sources = response.json()
            print("✅ Available scraping sources retrieved")
            print(f"   Found {sources.get('total', 0)} sources")
            
            # Test scraping a custom URL
            test_url_data = {
                "url": "https://www.grants.gov/",
                "source_name": "Test Grants.gov"
            }
            
            print("\n📋 Testing: Custom URL Scraping")
            scrape_response = requests.post(f"{BASE_URL}/scraping/scrape-url", 
                                          json=test_url_data, timeout=60)
            
            if scrape_response.status_code == 200:
                result = scrape_response.json()
                print("✅ Custom URL scraping completed")
                print(f"   Found {result.get('result', {}).get('total_found', 0)} opportunities")
            else:
                print(f"❌ Custom URL scraping failed - Status: {scrape_response.status_code}")
                print(f"   Response: {scrape_response.text}")
                
        else:
            print(f"❌ Failed to get scraping sources - Status: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Firecrawl scraping test error: {str(e)}")

def test_data_sync():
    """Test data synchronization (requires API keys)"""
    print("\n🔄 Testing Data Synchronization")
    print("Note: This requires valid API keys to be set")
    
    try:
        response = requests.post(f"{BASE_URL}/sync", timeout=120)
        if response.status_code == 200:
            result = response.json()
            print("✅ Data sync completed successfully")
            print(f"   Results: {json.dumps(result['results'], indent=2)}")
        else:
            print(f"❌ Data sync failed - Status: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Data sync error: {str(e)}")

if __name__ == "__main__":
    print(f"Starting backend tests at {datetime.now()}")
    
    # Wait a moment for server to be ready
    print("⏳ Waiting for server to be ready...")
    time.sleep(2)
    
    # Run tests
    success = test_backend()
    
    # Test Firecrawl functionality
    print("\n" + "="*60)
    test_firecrawl_scraping()
    
    # Optionally test data sync (commented out by default)
    # print("\n" + "="*60)
    # test_data_sync()
    
    print(f"\n✨ Testing completed at {datetime.now()}")
    exit(0 if success else 1)

