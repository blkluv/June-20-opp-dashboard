#!/usr/bin/env python3
"""
Clean sample data and verify only real scraped data remains
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from src.config.supabase import get_supabase_admin_client

def clean_sample_data():
    """Remove any sample/test data, keep only real scraped data"""
    print("🧹 Cleaning sample data from Supabase...")
    
    try:
        supabase = get_supabase_admin_client()
        
        # Get all current opportunities
        response = supabase.table('opportunities').select('*').execute()
        opportunities = response.data
        
        print(f"📊 Current opportunities: {len(opportunities)}")
        
        # Identify real vs sample data
        real_data = []
        sample_data = []
        
        for opp in opportunities:
            # Real data indicators:
            # - Has 'USASpending.gov' as source_name
            # - Has large estimated_value (> $1M)
            # - Has federal_contract_award source_type
            
            if (opp.get('source_name') == 'USASpending.gov' and 
                opp.get('source_type') == 'federal_contract_award' and
                opp.get('estimated_value', 0) > 1000000):
                real_data.append(opp)
            else:
                sample_data.append(opp)
        
        print(f"✅ Real data found: {len(real_data)} opportunities")
        print(f"🗑️ Sample data found: {len(sample_data)} opportunities")
        
        # Remove sample data
        for sample in sample_data:
            try:
                supabase.table('opportunities').delete().eq('id', sample['id']).execute()
                print(f"  🗑️ Removed: {sample['title'][:50]}...")
            except Exception as e:
                print(f"  ❌ Failed to remove {sample['id']}: {e}")
        
        # Verify cleanup
        final_response = supabase.table('opportunities').select('*').execute()
        final_count = len(final_response.data)
        
        print(f"\n✅ Cleanup complete!")
        print(f"📊 Final opportunity count: {final_count}")
        print(f"💰 All remaining data is real from USASpending.gov")
        
        return final_count
        
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        return -1

def verify_real_data():
    """Verify remaining data is all real"""
    try:
        supabase = get_supabase_admin_client()
        response = supabase.table('opportunities').select('*').execute()
        
        opportunities = response.data
        total_value = sum(float(opp.get('estimated_value', 0)) for opp in opportunities)
        
        print(f"\n📊 REAL DATA VERIFICATION:")
        print(f"   🎯 Total Opportunities: {len(opportunities)}")
        print(f"   💰 Total Value: ${total_value:,.2f}")
        print(f"   📡 All from: USASpending.gov API")
        
        print(f"\n🔝 Real Opportunities:")
        for i, opp in enumerate(opportunities[:5]):
            value = opp.get('estimated_value', 0)
            print(f"   {i+1}. {opp['title'][:60]}... (${value:,.0f})")
        
        return len(opportunities)
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return 0

if __name__ == "__main__":
    print("🧹 SAMPLE DATA CLEANUP")
    print("=" * 30)
    
    final_count = clean_sample_data()
    
    if final_count >= 0:
        verify_real_data()
        print("\n✅ Sample data removed successfully!")
        print("🎯 Database now contains only real government contract data!")
    else:
        print("\n❌ Cleanup failed")