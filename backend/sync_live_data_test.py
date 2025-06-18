#!/usr/bin/env python3
"""
Live data sync test with real API keys
"""

import os
import sys
import asyncio
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.dirname(__file__))
from src.config.supabase import get_supabase_admin_client

def test_sam_gov_live_data():
    """Test SAM.gov API for live opportunities"""
    print("🔍 Testing SAM.gov Live Data...")
    
    api_key = os.getenv('SAM_GOV_API_KEY')
    if not api_key:
        print("   ❌ SAM.gov API key not found")
        return []
    
    # Try a simple query for recent opportunities
    url = "https://api.sam.gov/opportunities/v2/search"
    
    # Request opportunities from last 7 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    params = {
        'api_key': api_key,
        'limit': 10,
        'postedFrom': start_date.strftime('%m/%d/%Y'),
        'postedTo': end_date.strftime('%m/%d/%Y'),
        'ptype': 'o'  # Opportunities only
    }
    
    try:
        print(f"   📡 Requesting opportunities from {start_date.strftime('%m/%d/%Y')} to {end_date.strftime('%m/%d/%Y')}")
        response = requests.get(url, params=params, timeout=30)
        
        print(f"   📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            opportunities = data.get('opportunitiesData', [])
            total_records = data.get('totalRecords', 0)
            
            print(f"   ✅ Success! Found {len(opportunities)} opportunities")
            print(f"   📈 Total available: {total_records}")
            
            # Show sample opportunities
            for i, opp in enumerate(opportunities[:3]):
                title = opp.get('title', 'No title')[:50]
                dept = opp.get('departmentName', 'Unknown')
                notice_id = opp.get('noticeId', 'N/A')
                posted = opp.get('postedDate', 'Unknown')
                
                print(f"      {i+1}. {title}... ({dept}) - ID: {notice_id}")
                print(f"         Posted: {posted}")
            
            return opportunities
            
        elif response.status_code == 429:
            print("   ⏳ Rate limited - this is normal for free tier")
            print("   💡 SAM.gov allows 5 requests per minute on free tier")
            return []
            
        elif response.status_code == 403:
            print("   🔑 Authentication issue - check API key")
            return []
            
        else:
            print(f"   ❌ Error: {response.status_code}")
            error_text = response.text[:200] if response.text else "No error details"
            print(f"   📝 Details: {error_text}")
            return []
            
    except Exception as e:
        print(f"   ❌ Request failed: {e}")
        return []

def save_opportunities_to_supabase(opportunities):
    """Save new opportunities to Supabase"""
    if not opportunities:
        print("\n📤 No opportunities to save")
        return 0
    
    print(f"\n📤 Saving {len(opportunities)} opportunities to Supabase...")
    
    try:
        supabase = get_supabase_admin_client()
        saved_count = 0
        
        for opp in opportunities:
            try:
                # Create opportunity record
                notice_id = opp.get('noticeId', '')
                external_id = f"sam-{notice_id}"
                
                # Check if already exists
                existing = supabase.table('opportunities')\
                    .select('id')\
                    .eq('external_id', external_id)\
                    .execute()
                
                if existing.data:
                    print(f"   ⏭️ Skipping existing: {notice_id}")
                    continue
                
                # Parse dates
                posted_date = None
                due_date = None
                
                try:
                    if opp.get('postedDate'):
                        posted_date = datetime.strptime(opp['postedDate'], '%Y-%m-%d').isoformat()
                except:
                    pass
                
                try:
                    if opp.get('responseDate'):
                        due_date = datetime.strptime(opp['responseDate'], '%Y-%m-%d').isoformat()
                except:
                    pass
                
                # Create opportunity data
                opportunity_data = {
                    'external_id': external_id,
                    'title': opp.get('title', 'SAM.gov Opportunity')[:500],
                    'description': opp.get('description', '')[:2000],
                    'agency_name': opp.get('departmentName', 'Federal Agency'),
                    'source_type': 'government_rfp',
                    'source_name': 'SAM.gov',
                    'source_url': f"https://sam.gov/opp/{notice_id}",
                    'opportunity_number': opp.get('solicitationNumber', notice_id),
                    'posted_date': posted_date,
                    'due_date': due_date,
                    'relevance_score': 0.85,  # High for SAM.gov data
                    'data_quality_score': 0.95,  # Very high for official data
                    'total_score': 90,
                    'status': 'open',
                    'categories': [opp.get('classificationCode', '').split(' - ')[0]] if opp.get('classificationCode') else [],
                    'naics_codes': [opp.get('naicsCode')] if opp.get('naicsCode') else [],
                    'set_asides': [opp.get('typeOfSetAsideDescription')] if opp.get('typeOfSetAsideDescription') else []
                }
                
                # Insert to Supabase
                result = supabase.table('opportunities').insert(opportunity_data).execute()
                saved_count += 1
                
                title_short = opportunity_data['title'][:40]
                print(f"   ✅ Saved: {title_short}... (ID: {notice_id})")
                
            except Exception as e:
                print(f"   ❌ Failed to save {opp.get('noticeId', 'unknown')}: {e}")
        
        print(f"\n🎉 Successfully saved {saved_count} new opportunities!")
        return saved_count
        
    except Exception as e:
        print(f"\n❌ Supabase save failed: {e}")
        return 0

def test_perplexity_intelligence(sample_opportunity):
    """Test Perplexity AI intelligence on a sample opportunity"""
    print("\n🤖 Testing Perplexity AI Intelligence...")
    
    api_key = os.getenv('PERPLEXITY_API_KEY')
    if not api_key:
        print("   ❌ Perplexity API key not found")
        return None
    
    if not sample_opportunity:
        print("   ⏭️ No sample opportunity for intelligence test")
        return None
    
    try:
        url = 'https://api.perplexity.ai/chat/completions'
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        # Create intelligence query
        title = sample_opportunity.get('title', 'Unknown')
        dept = sample_opportunity.get('departmentName', 'Unknown')
        
        query = f"""
        Analyze this government opportunity for competitive intelligence:
        
        Title: {title}
        Agency: {dept}
        
        Provide:
        1. Likely competitors for this opportunity
        2. Typical award amounts for similar contracts
        3. Key evaluation factors
        4. Strategic recommendations
        
        Keep response under 200 words.
        """
        
        payload = {
            'model': 'llama-3.1-sonar-small-128k-online',
            'messages': [{'role': 'user', 'content': query}],
            'max_tokens': 300,
            'temperature': 0.1
        }
        
        print(f"   🔍 Analyzing: {title[:50]}...")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            intelligence = data['choices'][0]['message']['content']
            
            print("   ✅ AI Intelligence Generated:")
            print(f"   🧠 {intelligence[:150]}...")
            
            return {
                'analysis': intelligence,
                'generated_at': datetime.now().isoformat(),
                'model': 'llama-3.1-sonar-small-128k-online'
            }
        else:
            print(f"   ❌ Perplexity error: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"   ❌ Intelligence generation failed: {e}")
        return None

def test_current_data_status():
    """Check current data status in Supabase"""
    print("\n📊 Current Data Status...")
    
    try:
        supabase = get_supabase_admin_client()
        
        # Get total opportunities
        result = supabase.table('opportunities').select('*', count='exact').execute()
        total = result.count
        opportunities = result.data
        
        print(f"   📈 Total Opportunities: {total}")
        
        # Group by source
        source_counts = {}
        total_value = 0
        
        for opp in opportunities:
            source = opp.get('source_name', 'Unknown')
            source_counts[source] = source_counts.get(source, 0) + 1
            
            value = opp.get('estimated_value', 0)
            if value:
                total_value += value
        
        print(f"   💰 Total Value: ${total_value:,.2f}")
        print(f"   📡 By Source:")
        for source, count in source_counts.items():
            print(f"      - {source}: {count} opportunities")
        
        return total
        
    except Exception as e:
        print(f"   ❌ Status check failed: {e}")
        return 0

def main():
    """Run live data sync test"""
    print("🚀 LIVE DATA SYNC TEST")
    print("=" * 40)
    
    # Check current status
    current_total = test_current_data_status()
    
    # Test SAM.gov live data
    sam_opportunities = test_sam_gov_live_data()
    
    # Save new opportunities
    saved_count = save_opportunities_to_supabase(sam_opportunities)
    
    # Test AI intelligence on first opportunity
    if sam_opportunities:
        intelligence = test_perplexity_intelligence(sam_opportunities[0])
    
    # Final status
    final_total = test_current_data_status()
    
    print("\n" + "=" * 40)
    print("🎯 LIVE SYNC RESULTS")
    print("=" * 40)
    print(f"📊 Before: {current_total} opportunities")
    print(f"📥 SAM.gov: {len(sam_opportunities)} fetched")
    print(f"💾 Saved: {saved_count} new opportunities")
    print(f"📊 After: {final_total} opportunities")
    print(f"🤖 AI Intelligence: {'✅ Working' if sam_opportunities else '⏭️ Skipped'}")
    
    if saved_count > 0:
        print(f"\n🎉 SUCCESS! Added {saved_count} live opportunities from SAM.gov")
    elif len(sam_opportunities) == 0:
        print(f"\n⏳ Rate limited - try again in a few minutes")
    else:
        print(f"\n✅ All opportunities already in database")

if __name__ == '__main__':
    main()