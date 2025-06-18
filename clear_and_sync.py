#!/usr/bin/env python3
"""
Clear old data and sync fresh live RFP opportunities
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from backend.src.config.supabase import get_supabase_admin_client
from dotenv import load_dotenv
load_dotenv('backend/.env')

def clear_and_sync():
    print("🧹 Clearing old contract award data...")
    
    try:
        supabase = get_supabase_admin_client()
        
        # Clear all old opportunities
        result = supabase.table('opportunities').delete().neq('id', '').execute()
        print(f"   ✅ Cleared database")
        
        # Now sync fresh live data
        print("\n🔄 Syncing fresh live RFP data...")
        
        # Import the API client to force fresh data fetch
        from backend.api.index import OpportunityAPI
        api = OpportunityAPI()
        
        # Get live opportunities from all sources
        opportunities = api.get_all_opportunities()
        print(f"   📥 Fetched {len(opportunities)} live opportunities")
        
        if opportunities:
            # Save to database
            for opp in opportunities:
                try:
                    result = supabase.table('opportunities').insert(opp).execute()
                    print(f"   ✅ Saved: {opp['title'][:50]}...")
                except Exception as e:
                    print(f"   ❌ Failed to save: {e}")
        
        print(f"\n🎉 Sync complete! {len(opportunities)} live opportunities ready")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    clear_and_sync()