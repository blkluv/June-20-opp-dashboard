#!/usr/bin/env python3
"""Test script to verify Firecrawl integration works locally"""

import sys
import os
sys.path.append('src')

# Mock a simple opportunity to test the integration
def test_firecrawl_integration():
    try:
        from services.firecrawl_service import FirecrawlScrapeService
        
        # Test with environment variable
        firecrawl_api_key = os.environ.get('FIRECRAWL_API_KEY')
        if not firecrawl_api_key:
            print("❌ FIRECRAWL_API_KEY not found in environment")
            return False
        
        print(f"✅ Found Firecrawl API key: {firecrawl_api_key[:8]}...")
        
        # Initialize service
        firecrawl_service = FirecrawlScrapeService(firecrawl_api_key)
        print("✅ Firecrawl service initialized successfully")
        
        # Test scraping a simple source
        test_source = 'california_procurement'
        print(f"🔄 Testing scrape of {test_source}...")
        
        result = firecrawl_service.scrape_source(test_source)
        
        if result['success']:
            print(f"✅ Scrape successful! Found {len(result.get('opportunities', []))} opportunities")
            
            # Show first opportunity if available
            if result.get('opportunities'):
                first_opp = result['opportunities'][0]
                print("📋 First opportunity:")
                print(f"  Title: {first_opp.get('title', 'N/A')}")
                print(f"  Agency: {first_opp.get('agency_name', 'N/A')}")
                print(f"  Value: {first_opp.get('estimated_value', 'N/A')}")
            
            return True
        else:
            print(f"❌ Scrape failed: {result.get('error', 'Unknown error')}")
            return False
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_parse_value():
    """Test the value parsing function"""
    try:
        from api.index import handler
        
        # Create a handler instance to test parse_value method
        test_handler = handler()
        
        test_values = [
            "$1,000,000",
            "2.5 million",
            "$500,000.00",
            "1 billion",
            "invalid"
        ]
        
        print("🔄 Testing value parsing:")
        for test_val in test_values:
            parsed = test_handler.parse_value(test_val)
            print(f"  '{test_val}' -> {parsed}")
        
        return True
        
    except Exception as e:
        print(f"❌ Parse value test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Firecrawl Integration")
    print("=" * 50)
    
    # Test 1: Firecrawl integration
    print("\n1. Testing Firecrawl Service...")
    firecrawl_works = test_firecrawl_integration()
    
    # Test 2: Value parsing
    print("\n2. Testing Value Parsing...")
    parse_works = test_parse_value()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    print(f"  Firecrawl Integration: {'✅ PASS' if firecrawl_works else '❌ FAIL'}")
    print(f"  Value Parsing: {'✅ PASS' if parse_works else '❌ FAIL'}")
    
    if firecrawl_works and parse_works:
        print("\n🎉 All tests passed! Integration is ready.")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")