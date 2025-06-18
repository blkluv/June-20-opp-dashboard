#!/usr/bin/env python3
"""
Sync real data to Supabase database
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

import requests
from datetime import datetime
from src.config.supabase import get_supabase_admin_client

def fetch_usa_spending_data():
    """Fetch real data from USASpending.gov API"""
    print("🔍 Fetching data from USASpending.gov...")
    
    try:
        # USASpending.gov API endpoint for recent awards
        url = "https://api.usaspending.gov/api/v2/search/spending_by_award/"
        
        payload = {
            "filters": {
                "time_period": [
                    {
                        "start_date": "2024-01-01",
                        "end_date": "2024-12-31"
                    }
                ],
                "award_type_codes": ["A", "B", "C", "D"],  # Contract types
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
            "sort": "Award Amount",
            "order": "desc",
            "limit": 10
        }
        
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        print(f"✅ Fetched {len(data.get('results', []))} records from USASpending.gov")
        
        return data.get('results', [])
        
    except Exception as e:
        print(f"❌ Failed to fetch USASpending data: {e}")
        return []

def sync_to_supabase(usa_spending_data):
    """Sync data to Supabase"""
    print("📤 Syncing data to Supabase...")
    
    try:
        supabase = get_supabase_admin_client()
        synced_count = 0
        
        for record in usa_spending_data:
            # Convert USASpending data to our schema
            opportunity_data = {
                'external_id': record.get('internal_id', f"usa-{synced_count}"),
                'title': f"Federal Contract - {record.get('Recipient Name', 'Unknown Recipient')}",
                'description': f"Contract awarded to {record.get('Recipient Name')}. Award amount: ${record.get('Award Amount', 0):,.2f}",
                'agency_name': record.get('Awarding Agency', 'Federal Agency'),
                'opportunity_number': record.get('Award ID', ''),
                'estimated_value': float(record.get('Award Amount', 0)) if record.get('Award Amount') else None,
                'posted_date': record.get('Award Date'),
                'source_type': 'federal_contract_award',
                'source_name': 'USASpending.gov',
                'total_score': 80,  # Default score
                'status': 'awarded'
            }
            
            try:
                result = supabase.table('opportunities').upsert(opportunity_data).execute()
                synced_count += 1
                print(f"  ✅ Synced: {opportunity_data['title'][:50]}...")
            except Exception as e:
                print(f"  ❌ Failed to sync record: {e}")
        
        print(f"🎉 Successfully synced {synced_count} opportunities to Supabase!")
        return synced_count
        
    except Exception as e:
        print(f"❌ Supabase sync failed: {e}")
        return 0

def test_supabase_data():
    """Test that data was synced correctly"""
    try:
        supabase = get_supabase_admin_client()
        
        # Get count of opportunities
        response = supabase.table('opportunities').select('*').execute()
        opportunities = response.data
        
        print(f"\n📊 Supabase Database Status:")
        print(f"   🎯 Total Opportunities: {len(opportunities)}")
        
        if opportunities:
            total_value = sum(float(opp.get('estimated_value', 0)) for opp in opportunities if opp.get('estimated_value'))
            print(f"   💰 Total Value: ${total_value:,.2f}")
            
            print(f"\n🔝 Recent Opportunities:")
            for opp in opportunities[:5]:
                value = opp.get('estimated_value', 0)
                print(f"   • {opp['title'][:50]}... (${value:,.0f})")
        
        return True
    except Exception as e:
        print(f"❌ Failed to check Supabase data: {e}")
        return False

if __name__ == "__main__":
    print("🚀 REAL DATA SYNC TO SUPABASE")
    print("=" * 40)
    
    # Fetch real data
    usa_data = fetch_usa_spending_data()
    
    if usa_data:
        # Sync to Supabase
        synced = sync_to_supabase(usa_data)
        
        if synced > 0:
            # Test the results
            test_supabase_data()
            print("\n✅ Real data sync complete!")
            print("🎯 Your Supabase database now contains live federal contract data!")
        else:
            print("\n❌ Sync failed")
    else:
        print("\n❌ No data to sync")