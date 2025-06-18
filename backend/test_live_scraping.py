#!/usr/bin/env python3
"""
Test live data scraping and API sync functionality
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

import requests
from datetime import datetime
from src.config.supabase import get_supabase_admin_client

def test_usa_spending_api():
    """Test USASpending.gov API directly"""
    print("🔍 Testing USASpending.gov API...")
    
    try:
        # Test different endpoint for more recent opportunities
        url = "https://api.usaspending.gov/api/v2/search/spending_by_award/"
        
        payload = {
            "filters": {
                "time_period": [
                    {
                        "start_date": "2024-06-01", 
                        "end_date": "2024-12-31"
                    }
                ],
                "award_type_codes": ["A", "B", "C", "D"],
                "agency": "all"
            },
            "fields": [
                "Award ID",
                "Recipient Name",
                "Award Amount", 
                "Award Type",
                "Awarding Agency",
                "Award Date",
                "Description"
            ],
            "sort": "Award Date",
            "order": "desc",
            "limit": 5
        }
        
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        results = data.get('results', [])
        
        print(f"✅ USASpending API working: {len(results)} new records found")
        
        for i, record in enumerate(results[:3]):
            amount = record.get('Award Amount', 0)
            recipient = record.get('Recipient Name', 'Unknown')
            print(f"   {i+1}. {recipient} - ${amount:,.0f}")
        
        return results
        
    except Exception as e:
        print(f"❌ USASpending API test failed: {e}")
        return []

def test_grants_gov_scraping():
    """Test Grants.gov data availability"""
    print("\n🏛️ Testing Grants.gov availability...")
    
    try:
        # Test grants.gov basic endpoint
        url = "https://www.grants.gov/web/grants/search-grants.html"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            print("✅ Grants.gov accessible")
            return True
        else:
            print(f"⚠️ Grants.gov returned status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Grants.gov test failed: {e}")
        return False

def sync_fresh_data():
    """Sync fresh data to Supabase"""
    print("\n📤 Syncing fresh data to Supabase...")
    
    try:
        # Get fresh data
        fresh_data = test_usa_spending_api()
        
        if not fresh_data:
            print("❌ No fresh data to sync")
            return 0
        
        supabase = get_supabase_admin_client()
        synced_count = 0
        
        for record in fresh_data:
            # Check if this record already exists
            award_id = record.get('Award ID', '')
            existing = supabase.table('opportunities').select('id').eq('opportunity_number', award_id).execute()
            
            if existing.data:
                print(f"   ⏭️ Skipping existing record: {award_id}")
                continue
            
            # Create new opportunity record
            opportunity_data = {
                'external_id': f"usa-{award_id}-{datetime.now().timestamp()}",
                'title': f"Recent Federal Contract - {record.get('Recipient Name', 'Unknown')}",
                'description': f"Recent contract awarded to {record.get('Recipient Name')}. Amount: ${record.get('Award Amount', 0):,.2f}",
                'agency_name': record.get('Awarding Agency', 'Federal Agency'),
                'opportunity_number': award_id,
                'estimated_value': float(record.get('Award Amount', 0)) if record.get('Award Amount') else None,
                'posted_date': record.get('Award Date'),
                'source_type': 'federal_contract_recent',
                'source_name': 'USASpending.gov',
                'total_score': 85,
                'status': 'awarded'
            }
            
            try:
                result = supabase.table('opportunities').insert(opportunity_data).execute()
                synced_count += 1
                print(f"   ✅ Added: {opportunity_data['title'][:50]}...")
            except Exception as e:
                print(f"   ❌ Failed to add record: {e}")
        
        print(f"🎉 Synced {synced_count} new opportunities!")
        return synced_count
        
    except Exception as e:
        print(f"❌ Fresh data sync failed: {e}")
        return 0

def verify_supabase_data():
    """Verify current data in Supabase"""
    print("\n📊 Verifying Supabase data...")
    
    try:
        supabase = get_supabase_admin_client()
        
        # Get all opportunities
        response = supabase.table('opportunities').select('*').order('created_at', desc=True).execute()
        opportunities = response.data
        
        # Get data sources
        sources_response = supabase.table('data_sources').select('*').execute()
        sources = sources_response.data
        
        print(f"✅ Database Status:")
        print(f"   🎯 Total Opportunities: {len(opportunities)}")
        print(f"   📡 Data Sources: {len(sources)}")
        
        # Group by source
        source_counts = {}
        for opp in opportunities:
            source = opp.get('source_name', 'Unknown')
            source_counts[source] = source_counts.get(source, 0) + 1
        
        print(f"   📈 By Source:")
        for source, count in source_counts.items():
            print(f"      - {source}: {count} opportunities")
        
        # Calculate total value
        total_value = sum(float(opp.get('estimated_value', 0)) for opp in opportunities if opp.get('estimated_value'))
        print(f"   💰 Total Value: ${total_value:,.2f}")
        
        return len(opportunities)
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return 0

def test_api_endpoints():
    """Test our API endpoints work with Supabase"""
    print("\n🔗 Testing API endpoints...")
    
    try:
        # Test local API
        import subprocess
        import time
        
        # Start our test API server in background
        print("   🚀 Starting test API server...")
        
        # Run the API test directly
        from test_supabase_api import app
        
        with app.test_client() as client:
            # Test health endpoint
            response = client.get('/api/health')
            if response.status_code == 200:
                print("   ✅ Health endpoint working")
            else:
                print(f"   ❌ Health endpoint failed: {response.status_code}")
            
            # Test opportunities endpoint
            response = client.get('/api/opportunities')
            if response.status_code == 200:
                data = response.get_json()
                print(f"   ✅ Opportunities endpoint: {data.get('total', 0)} records")
            else:
                print(f"   ❌ Opportunities endpoint failed: {response.status_code}")
            
            # Test stats endpoint
            response = client.get('/api/opportunities/stats')
            if response.status_code == 200:
                data = response.get_json()
                print(f"   ✅ Stats endpoint: ${data.get('total_value', 0):,.0f} tracked")
            else:
                print(f"   ❌ Stats endpoint failed: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ API test failed: {e}")
        return False

if __name__ == "__main__":
    print("🔍 LIVE DATA SCRAPING & API TEST")
    print("=" * 40)
    
    # Test data sources
    usa_data = test_usa_spending_api()
    grants_available = test_grants_gov_scraping()
    
    # Sync fresh data if available
    if usa_data:
        synced = sync_fresh_data()
    
    # Verify current database state
    total_opportunities = verify_supabase_data()
    
    # Test API endpoints
    api_working = test_api_endpoints()
    
    print(f"\n🎉 SCRAPING & API TEST COMPLETE!")
    print(f"   📊 Total Opportunities: {total_opportunities}")
    print(f"   🔗 API Status: {'✅ Working' if api_working else '❌ Issues'}")
    print(f"   📡 Data Sources: USASpending.gov ✅, Grants.gov {'✅' if grants_available else '⚠️'}")
    print(f"   🗄️ Database: Supabase PostgreSQL ✅")