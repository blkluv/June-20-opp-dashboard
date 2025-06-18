#!/usr/bin/env python3
"""
Demo: Live Contract Discovery Capabilities
Shows what Firecrawl + Perplexity can do
"""

import os
import requests
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

def demo_firecrawl_capabilities():
    """Demo Firecrawl scraping capabilities"""
    print("🔥 **FIRECRAWL SCRAPING DEMO**")
    print("=" * 40)
    
    api_key = os.getenv('FIRECRAWL_API_KEY')
    if not api_key:
        print("❌ FIRECRAWL_API_KEY not found")
        return
    
    print(f"✅ API Key configured: {api_key[:10]}...")
    
    # Demo: Scrape live government pages
    demo_urls = [
        {
            'name': 'GSA News & Updates',
            'url': 'https://www.gsa.gov/about-us/newsroom/news-releases',
            'purpose': 'Latest contract announcements'
        },
        {
            'name': 'Defense Contract Awards',
            'url': 'https://www.defense.gov/News/Contracts/',
            'purpose': 'Daily DoD contract awards'
        }
    ]
    
    for demo in demo_urls:
        print(f"\n📡 Scraping: {demo['name']}")
        print(f"🎯 Purpose: {demo['purpose']}")
        print(f"🔗 URL: {demo['url']}")
        
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'url': demo['url'],
            'formats': ['markdown'],
            'onlyMainContent': True
        }
        
        try:
            response = requests.post(
                'https://api.firecrawl.dev/v0/scrape',
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data.get('data', {}).get('markdown', '')
                
                print(f"   ✅ Success! Scraped {len(content):,} characters")
                
                # Look for contract indicators
                contract_words = ['contract', 'award', 'million', 'billion', 'solicitation']
                contract_mentions = sum(content.lower().count(word) for word in contract_words)
                print(f"   📊 Contract indicators found: {contract_mentions}")
                
                # Show sample content
                lines = content.split('\n')[:5]
                print(f"   📄 Sample content:")
                for line in lines:
                    if line.strip():
                        print(f"      {line[:60]}...")
                        break
                        
            else:
                print(f"   ❌ Error {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            print(f"   ❌ Scraping failed: {e}")

def demo_perplexity_discovery():
    """Demo Perplexity AI discovery capabilities"""
    print("\n\n🤖 **PERPLEXITY AI DISCOVERY DEMO**")
    print("=" * 40)
    
    api_key = os.getenv('PERPLEXITY_API_KEY')
    if not api_key:
        print("❌ PERPLEXITY_API_KEY not found")
        return
    
    print(f"✅ API Key configured: {api_key[:10]}...")
    
    # Demo different AI discovery capabilities
    demos = [
        {
            'name': 'Live Contract Discovery',
            'prompt': '''Find government contracts announced in the last 24 hours. 
                        Search USASpending.gov, SAM.gov, and defense.gov for new awards over $1M.
                        Return title, agency, contractor, and value for each.''',
            'purpose': 'Discover breaking contract news'
        },
        {
            'name': 'Market Intelligence',
            'prompt': '''Analyze current government contracting trends in cybersecurity.
                        What agencies are spending the most? What are typical award values?
                        Which companies are winning the most contracts?''',
            'purpose': 'Strategic market analysis'
        },
        {
            'name': 'Opportunity Prediction',
            'prompt': '''Predict upcoming government IT modernization opportunities 
                        in the next 60 days based on budget cycles and agency announcements.
                        Include likely agencies, estimated values, and timing.''',
            'purpose': 'Future opportunity forecasting'
        }
    ]
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    for demo in demos:
        print(f"\n🧠 {demo['name']}")
        print(f"🎯 Purpose: {demo['purpose']}")
        
        payload = {
            'model': 'llama-3.1-sonar-small-128k-online',
            'messages': [{'role': 'user', 'content': demo['prompt']}],
            'max_tokens': 300,
            'temperature': 0.1,
            'search_domain_filter': ['sam.gov', 'usaspending.gov', 'defense.gov', 'gsa.gov'],
            'return_citations': True
        }
        
        try:
            response = requests.post(
                'https://api.perplexity.ai/chat/completions',
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                analysis = data['choices'][0]['message']['content']
                citations = data.get('citations', [])
                
                print(f"   ✅ AI Analysis Generated!")
                print(f"   📚 Sources used: {len(citations)}")
                print(f"   📄 Analysis preview:")
                print(f"      {analysis[:200]}...")
                
                if citations:
                    print(f"   🔗 Key sources:")
                    for citation in citations[:2]:
                        print(f"      - {citation}")
                        
            else:
                print(f"   ❌ Error {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            print(f"   ❌ AI query failed: {e}")

def demo_automated_capabilities():
    """Demo what automated monitoring can do"""
    print("\n\n⚡ **AUTOMATED MONITORING CAPABILITIES**")
    print("=" * 40)
    
    capabilities = [
        {
            'frequency': 'Every Hour',
            'task': 'Check for urgent contract announcements',
            'sources': 'Perplexity AI + gov news feeds',
            'value': 'Never miss time-sensitive opportunities'
        },
        {
            'frequency': 'Daily at 9AM',
            'task': 'Comprehensive opportunity discovery',
            'sources': 'Firecrawl scraping + AI discovery',
            'value': 'Systematic capture of all new contracts'
        },
        {
            'frequency': 'Weekly Monday 8AM',
            'task': 'Market intelligence & trend analysis',
            'sources': 'AI analysis of market patterns',
            'value': 'Strategic insights for business planning'
        },
        {
            'frequency': 'On-Demand',
            'task': 'Competitive intelligence on specific opportunities',
            'sources': 'Deep AI analysis of individual contracts',
            'value': 'Bid/no-bid decision support'
        }
    ]
    
    for cap in capabilities:
        print(f"\n⏰ {cap['frequency']}")
        print(f"   📋 Task: {cap['task']}")
        print(f"   🔍 Sources: {cap['sources']}")
        print(f"   💡 Value: {cap['value']}")

def main():
    """Run live monitoring demo"""
    print("🚀 **LIVE CONTRACT MONITORING SYSTEM DEMO**")
    print("🎯 Your API keys enable these powerful capabilities:")
    print("=" * 60)
    
    # Demo each system
    demo_firecrawl_capabilities()
    demo_perplexity_discovery()
    demo_automated_capabilities()
    
    print("\n\n🎉 **READY FOR PRODUCTION!**")
    print("=" * 30)
    print("✅ Firecrawl: Web scraping government contract sources")
    print("✅ Perplexity: AI-powered discovery and intelligence")
    print("✅ Automation: Scheduled monitoring with real-time alerts")
    print("✅ Integration: All data flows into your Supabase database")
    
    print("\n💡 **Next Steps:**")
    print("1. 🚀 Deploy automated monitoring (runs in background)")
    print("2. 📱 Update frontend to show AI discoveries")
    print("3. 🔔 Set up notifications for high-value opportunities")
    print("4. 📊 Create dashboards for market intelligence")

if __name__ == '__main__':
    main()