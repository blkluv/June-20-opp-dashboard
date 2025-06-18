#!/usr/bin/env python3
"""
Test enhanced RFP integration features
"""

import os
import sys
import asyncio
import requests
import json
from datetime import datetime
sys.path.insert(0, os.path.dirname(__file__))

# Load environment
from dotenv import load_dotenv
load_dotenv()

from rfp_integration_hub import EnhancedRFPPipeline

def test_api_endpoints():
    """Test the new API endpoints"""
    base_url = "https://backend-bn42qj3a9-jacobs-projects-cf4c7bdb.vercel.app/api"
    
    print("🔗 Testing Enhanced API Endpoints...")
    
    endpoints_to_test = [
        ('/rfp/sources', 'GET', None),
        ('/rfp/stats', 'GET', None),
        ('/rfp/search', 'POST', {
            'min_relevance_score': 0.5,
            'limit': 5
        }),
        ('/rfp/track', 'POST', {
            'user_id': 'test_user',
            'opportunity_id': 1,
            'notes': 'Test tracking'
        }),
        ('/rfp/save-search', 'POST', {
            'user_id': 'test_user',
            'name': 'High Value Contracts',
            'search_params': {
                'min_value': 1000000,
                'agency_name': 'Department'
            }
        })
    ]
    
    results = {}
    
    for endpoint, method, data in endpoints_to_test:
        try:
            url = f"{base_url}{endpoint}"
            
            if method == 'GET':
                response = requests.get(url, timeout=10)
            else:
                response = requests.post(url, json=data, timeout=10)
            
            if response.status_code == 200:
                result_data = response.json()
                results[endpoint] = {
                    'status': 'success',
                    'data_keys': list(result_data.keys())
                }
                print(f"✅ {method} {endpoint} - Working")
                
                # Print key info for some endpoints
                if endpoint == '/rfp/sources':
                    sources = result_data.get('sources', [])
                    active_count = len([s for s in sources if s.get('status') == 'active'])
                    print(f"   📡 {active_count}/{len(sources)} data sources active")
                
                elif endpoint == '/rfp/stats':
                    total = result_data.get('total_opportunities', 0)
                    high_score = result_data.get('high_score_opportunities', 0)
                    print(f"   📊 {total} total, {high_score} high-score opportunities")
                
                elif endpoint == '/rfp/search':
                    opportunities = result_data.get('opportunities', [])
                    print(f"   🔍 Found {len(opportunities)} matching opportunities")
                
            else:
                results[endpoint] = {
                    'status': 'failed',
                    'code': response.status_code,
                    'error': response.text[:100]
                }
                print(f"❌ {method} {endpoint} - Status {response.status_code}")
                
        except Exception as e:
            results[endpoint] = {
                'status': 'error',
                'error': str(e)
            }
            print(f"❌ {method} {endpoint} - Error: {e}")
    
    return results

async def test_pipeline_directly():
    """Test the enhanced pipeline directly"""
    print("\n🔧 Testing Enhanced Pipeline...")
    
    try:
        pipeline = EnhancedRFPPipeline()
        
        # Test search functionality
        print("   🔍 Testing search...")
        search_results = await pipeline.search_opportunities({
            'min_relevance_score': 0.3,
            'limit': 3
        })
        print(f"   ✅ Search returned {len(search_results)} results")
        
        if search_results:
            for i, opp in enumerate(search_results):
                score = opp.get('relevance_score', 0)
                value = opp.get('estimated_value', 0)
                print(f"      {i+1}. {opp['title'][:40]}... (Score: {score:.2f}, ${value:,.0f})")
        
        # Test tracking (if we have opportunities)
        if search_results:
            print("   📌 Testing opportunity tracking...")
            track_result = await pipeline.track_opportunity(
                user_id='test_user_' + str(int(datetime.now().timestamp())),
                opportunity_id=search_results[0]['id'],
                notes='Test tracking from enhanced integration'
            )
            print(f"   ✅ Tracking created: {track_result.get('id', 'N/A')}")
        
        # Test save search
        print("   💾 Testing save search...")
        save_result = await pipeline.save_search(
            user_id='test_user_' + str(int(datetime.now().timestamp())),
            name='Test High-Value Search',
            params={
                'min_value': 5000000,
                'agency_name': 'Department of Defense'
            }
        )
        print(f"   ✅ Search saved: {save_result.get('id', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Pipeline test failed: {e}")
        return False

def test_schema_extensions():
    """Test that schema extensions are working"""
    print("\n📊 Testing Schema Extensions...")
    
    try:
        from src.config.supabase import get_supabase_admin_client
        supabase = get_supabase_admin_client()
        
        # Test new columns exist
        result = supabase.table('opportunities')\
            .select('id, relevance_score, categories, intelligence')\
            .limit(1)\
            .execute()
        
        if result.data:
            opp = result.data[0]
            print("   ✅ Enhanced columns accessible:")
            print(f"      - relevance_score: {opp.get('relevance_score', 'N/A')}")
            print(f"      - categories: {opp.get('categories', 'N/A')}")
            print(f"      - intelligence: {'present' if opp.get('intelligence') else 'empty'}")
        
        # Test new tables exist
        tables_to_check = ['saved_searches', 'opportunity_tracking', 'rate_limits']
        for table in tables_to_check:
            try:
                result = supabase.table(table).select('*').limit(1).execute()
                print(f"   ✅ Table '{table}' accessible")
            except Exception as e:
                print(f"   ⚠️ Table '{table}' issue: {e}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Schema test failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("=" * 60)
    print("ENHANCED RFP INTEGRATION TEST")
    print("=" * 60)
    
    # Test API endpoints
    api_results = test_api_endpoints()
    
    # Test pipeline directly
    pipeline_success = await test_pipeline_directly()
    
    # Test schema extensions
    schema_success = test_schema_extensions()
    
    # Generate report
    print("\n" + "=" * 60)
    print("🎯 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    # API Results
    api_success_count = len([r for r in api_results.values() if r['status'] == 'success'])
    api_total = len(api_results)
    print(f"\n🔗 API Endpoints: {api_success_count}/{api_total} working")
    
    for endpoint, result in api_results.items():
        status_icon = "✅" if result['status'] == 'success' else "❌"
        print(f"   {status_icon} {endpoint}")
    
    # Overall Status
    overall_score = (
        (api_success_count / api_total) * 0.5 +
        (1 if pipeline_success else 0) * 0.3 +
        (1 if schema_success else 0) * 0.2
    )
    
    print(f"\n📊 Pipeline Test: {'✅ Success' if pipeline_success else '❌ Failed'}")
    print(f"🗄️ Schema Test: {'✅ Success' if schema_success else '❌ Failed'}")
    
    if overall_score >= 0.8:
        status = "🎉 EXCELLENT - Enhanced features ready!"
    elif overall_score >= 0.6:
        status = "✅ GOOD - Most features working"
    else:
        status = "⚠️ NEEDS WORK - Issues found"
    
    print(f"\n🎯 Overall Status: {status}")
    print(f"📈 Score: {overall_score*100:.1f}%")
    
    # Next steps
    print(f"\n💡 Next Steps:")
    if overall_score >= 0.8:
        print("   🚀 Deploy enhanced schema to Supabase")
        print("   🔑 Add SAM.gov API key for more data sources")
        print("   📱 Update frontend to use new features")
    else:
        print("   🔧 Fix failing tests above")
        print("   📋 Apply enhanced schema to database")
        print("   🔍 Check API endpoint configurations")

if __name__ == '__main__':
    asyncio.run(main())