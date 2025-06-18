#!/usr/bin/env python3
"""
Firecrawl-powered government contract scraper
Scrapes multiple sources for live opportunities
"""

import os
import sys
import requests
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.dirname(__file__))
from src.config.supabase import get_supabase_admin_client

class FirecrawlScraper:
    """Firecrawl-powered web scraper for government contracts"""
    
    def __init__(self):
        self.api_key = os.getenv('FIRECRAWL_API_KEY')
        self.base_url = "https://api.firecrawl.dev/v0"
        self.supabase = get_supabase_admin_client()
        
        if not self.api_key:
            raise ValueError("FIRECRAWL_API_KEY not found in environment")
    
    def scrape_url(self, url: str, extract_schema: Dict = None) -> Dict[str, Any]:
        """Scrape a URL with Firecrawl"""
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'url': url,
            'formats': ['markdown', 'structured'],
            'onlyMainContent': True
        }
        
        if extract_schema:
            payload['extract'] = {
                'schema': extract_schema
            }
        
        try:
            response = requests.post(
                f"{self.base_url}/scrape",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Firecrawl error {response.status_code}: {response.text[:200]}")
                return {}
                
        except Exception as e:
            print(f"❌ Scraping failed for {url}: {e}")
            return {}
    
    def scrape_grants_gov(self) -> List[Dict[str, Any]]:
        """Scrape Grants.gov for opportunities"""
        print("🏛️ Scraping Grants.gov...")
        
        # Grants.gov search URL for recent opportunities
        url = "https://www.grants.gov/web/grants/search-grants.html"
        
        # Schema to extract grant information
        extract_schema = {
            "type": "object",
            "properties": {
                "grants": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "agency": {"type": "string"},
                            "opportunity_number": {"type": "string"},
                            "posted_date": {"type": "string"},
                            "closing_date": {"type": "string"},
                            "award_ceiling": {"type": "string"},
                            "description": {"type": "string"},
                            "eligibility": {"type": "string"}
                        }
                    }
                }
            }
        }
        
        result = self.scrape_url(url, extract_schema)
        
        if result.get('success') and result.get('data', {}).get('extract'):
            grants = result['data']['extract'].get('grants', [])
            print(f"   ✅ Found {len(grants)} grants from Grants.gov")
            return grants
        else:
            print("   ⚠️ No grants extracted - may need different approach")
            return []
    
    def scrape_fbo_daily(self) -> List[Dict[str, Any]]:
        """Scrape FedBizOpps/SAM.gov daily opportunities"""
        print("📋 Scraping Federal Business Opportunities...")
        
        # FBO daily opportunities URL
        url = "https://sam.gov/content/opportunities"
        
        extract_schema = {
            "type": "object",
            "properties": {
                "opportunities": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "agency": {"type": "string"},
                            "solicitation_number": {"type": "string"},
                            "posted_date": {"type": "string"},
                            "response_date": {"type": "string"},
                            "set_aside": {"type": "string"},
                            "naics_code": {"type": "string"},
                            "place_of_performance": {"type": "string"},
                            "description": {"type": "string"}
                        }
                    }
                }
            }
        }
        
        result = self.scrape_url(url, extract_schema)
        
        if result.get('success') and result.get('data', {}).get('extract'):
            opps = result['data']['extract'].get('opportunities', [])
            print(f"   ✅ Found {len(opps)} opportunities from FBO")
            return opps
        else:
            print("   ⚠️ No opportunities extracted")
            return []
    
    def scrape_gsa_opportunities(self) -> List[Dict[str, Any]]:
        """Scrape GSA Schedule opportunities"""
        print("🏢 Scraping GSA Opportunities...")
        
        url = "https://www.gsa.gov/buy-through-us/purchasing-programs/gsa-schedules"
        
        extract_schema = {
            "type": "object",
            "properties": {
                "schedules": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "schedule_name": {"type": "string"},
                            "description": {"type": "string"},
                            "categories": {"type": "array", "items": {"type": "string"}},
                            "ceiling_value": {"type": "string"},
                            "expiration_date": {"type": "string"}
                        }
                    }
                }
            }
        }
        
        result = self.scrape_url(url, extract_schema)
        
        if result.get('success') and result.get('data', {}).get('extract'):
            schedules = result['data']['extract'].get('schedules', [])
            print(f"   ✅ Found {len(schedules)} GSA schedules")
            return schedules
        else:
            print("   ⚠️ No GSA data extracted")
            return []
    
    def scrape_defense_contracts(self) -> List[Dict[str, Any]]:
        """Scrape DoD contract announcements"""
        print("🛡️ Scraping Defense Contract Announcements...")
        
        url = "https://www.defense.gov/News/Contracts/"
        
        extract_schema = {
            "type": "object",
            "properties": {
                "contracts": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "contractor": {"type": "string"},
                            "value": {"type": "string"},
                            "date": {"type": "string"},
                            "location": {"type": "string"},
                            "description": {"type": "string"},
                            "contract_number": {"type": "string"}
                        }
                    }
                }
            }
        }
        
        result = self.scrape_url(url, extract_schema)
        
        if result.get('success') and result.get('data', {}).get('extract'):
            contracts = result['data']['extract'].get('contracts', [])
            print(f"   ✅ Found {len(contracts)} defense contracts")
            return contracts
        else:
            print("   ⚠️ No defense contracts extracted")
            return []
    
    def convert_to_opportunities(self, scraped_data: List[Dict], source_name: str, source_type: str) -> List[Dict]:
        """Convert scraped data to opportunity format"""
        opportunities = []
        
        for item in scraped_data:
            try:
                # Extract value from various formats
                estimated_value = None
                value_text = item.get('value', '') or item.get('award_ceiling', '') or item.get('ceiling_value', '')
                
                if value_text:
                    # Try to extract numerical value
                    import re
                    value_match = re.search(r'[\$]?([0-9,\.]+)\s*(million|billion|M|B)?', value_text, re.IGNORECASE)
                    if value_match:
                        amount = float(value_match.group(1).replace(',', ''))
                        multiplier = value_match.group(2)
                        if multiplier and multiplier.lower() in ['million', 'm']:
                            amount *= 1000000
                        elif multiplier and multiplier.lower() in ['billion', 'b']:
                            amount *= 1000000000
                        estimated_value = amount
                
                # Parse dates
                posted_date = None
                due_date = None
                
                for date_field in ['posted_date', 'date']:
                    if item.get(date_field):
                        try:
                            posted_date = datetime.strptime(item[date_field], '%Y-%m-%d').isoformat()
                        except:
                            pass
                
                for date_field in ['closing_date', 'response_date', 'expiration_date']:
                    if item.get(date_field):
                        try:
                            due_date = datetime.strptime(item[date_field], '%Y-%m-%d').isoformat()
                        except:
                            pass
                
                # Create opportunity
                opportunity = {
                    'external_id': f"firecrawl-{source_name.lower()}-{hash(str(item))}"[:50],
                    'title': item.get('title', item.get('schedule_name', 'Scraped Opportunity'))[:500],
                    'description': item.get('description', '')[:2000],
                    'agency_name': item.get('agency', item.get('contractor', 'Federal Agency')),
                    'source_type': source_type,
                    'source_name': f'Firecrawl-{source_name}',
                    'opportunity_number': item.get('opportunity_number', item.get('solicitation_number', item.get('contract_number', ''))),
                    'estimated_value': estimated_value,
                    'posted_date': posted_date,
                    'due_date': due_date,
                    'relevance_score': 0.75,  # Medium-high for scraped data
                    'data_quality_score': 0.8,  # Good quality from official sites
                    'total_score': 80,
                    'status': 'open',
                    'categories': item.get('categories', []),
                    'naics_codes': [item.get('naics_code')] if item.get('naics_code') else [],
                    'set_asides': [item.get('set_aside')] if item.get('set_aside') else []
                }
                
                opportunities.append(opportunity)
                
            except Exception as e:
                print(f"   ⚠️ Failed to convert item: {e}")
        
        return opportunities
    
    def save_opportunities(self, opportunities: List[Dict]) -> int:
        """Save opportunities to Supabase"""
        saved_count = 0
        
        for opp in opportunities:
            try:
                # Check if already exists
                existing = self.supabase.table('opportunities')\
                    .select('id')\
                    .eq('external_id', opp['external_id'])\
                    .execute()
                
                if existing.data:
                    continue
                
                # Insert new opportunity
                result = self.supabase.table('opportunities').insert(opp).execute()
                saved_count += 1
                
                print(f"   ✅ Saved: {opp['title'][:50]}...")
                
            except Exception as e:
                print(f"   ❌ Failed to save: {e}")
        
        return saved_count
    
    def run_full_scrape(self) -> Dict[str, int]:
        """Run complete scraping across all sources"""
        print("🔥 Starting Firecrawl Full Scrape")
        print("=" * 40)
        
        results = {}
        total_saved = 0
        
        # Scrape each source
        sources = [
            (self.scrape_grants_gov, "Grants.gov", "federal_grant"),
            (self.scrape_fbo_daily, "FBO-Daily", "government_rfp"),
            (self.scrape_gsa_opportunities, "GSA", "gsa_schedule"),
            (self.scrape_defense_contracts, "DoD-Contracts", "defense_contract")
        ]
        
        for scrape_func, source_name, source_type in sources:
            try:
                print(f"\n📡 Scraping {source_name}...")
                scraped_data = scrape_func()
                
                if scraped_data:
                    opportunities = self.convert_to_opportunities(scraped_data, source_name, source_type)
                    saved_count = self.save_opportunities(opportunities)
                    results[source_name] = saved_count
                    total_saved += saved_count
                    print(f"   🎉 {source_name}: {saved_count} new opportunities saved")
                else:
                    results[source_name] = 0
                    print(f"   ⏭️ {source_name}: No new data")
                    
            except Exception as e:
                print(f"   ❌ {source_name} failed: {e}")
                results[source_name] = 0
        
        print(f"\n🎯 Total Scraping Results:")
        print(f"   📊 Sources: {len(sources)}")
        print(f"   💾 Total Saved: {total_saved}")
        for source, count in results.items():
            print(f"   📋 {source}: {count}")
        
        return results

def main():
    """Test Firecrawl integration"""
    try:
        scraper = FirecrawlScraper()
        results = scraper.run_full_scrape()
        
        print(f"\n🔥 Firecrawl scraping complete!")
        print(f"📈 Total opportunities scraped: {sum(results.values())}")
        
    except Exception as e:
        print(f"❌ Firecrawl setup failed: {e}")
        print("💡 Make sure FIRECRAWL_API_KEY is set in .env file")

if __name__ == '__main__':
    main()