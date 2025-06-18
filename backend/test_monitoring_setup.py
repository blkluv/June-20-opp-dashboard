#!/usr/bin/env python3
"""
Test automated monitoring setup locally before GitHub Actions
"""

import os
import requests
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

def test_api_keys():
    """Test that all API keys work"""
    print("🔑 Testing API Key Configuration")
    print("=" * 40)
    
    results = {}
    
    # Test Perplexity
    perplexity_key = os.getenv('PERPLEXITY_API_KEY')
    if perplexity_key:
        try:
            headers = {'Authorization': f'Bearer {perplexity_key}', 'Content-Type': 'application/json'}
            payload = {
                'model': 'llama-3.1-sonar-small-128k-online',
                'messages': [{'role': 'user', 'content': 'Test query'}],
                'max_tokens': 10
            }
            response = requests.post('https://api.perplexity.ai/chat/completions', 
                                   headers=headers, json=payload, timeout=10)
            results['Perplexity'] = '✅ Working' if response.status_code == 200 else f'❌ Error {response.status_code}'
        except Exception as e:
            results['Perplexity'] = f'❌ Failed: {str(e)[:50]}'
    else:
        results['Perplexity'] = '❌ Key not found'
    
    # Test Firecrawl
    firecrawl_key = os.getenv('FIRECRAWL_API_KEY')
    if firecrawl_key:
        try:
            headers = {'Authorization': f'Bearer {firecrawl_key}', 'Content-Type': 'application/json'}
            payload = {'url': 'https://example.com', 'formats': ['markdown']}
            response = requests.post('https://api.firecrawl.dev/v0/scrape', 
                                   headers=headers, json=payload, timeout=10)
            results['Firecrawl'] = '✅ Working' if response.status_code == 200 else f'❌ Error {response.status_code}'
        except Exception as e:
            results['Firecrawl'] = f'❌ Failed: {str(e)[:50]}'
    else:
        results['Firecrawl'] = '❌ Key not found'
    
    # Test SAM.gov
    sam_key = os.getenv('SAM_GOV_API_KEY')
    if sam_key:
        try:
            url = f'https://api.sam.gov/opportunities/v2/search?api_key={sam_key}&limit=1'
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                results['SAM.gov'] = '✅ Working'
            elif response.status_code == 429:
                results['SAM.gov'] = '✅ Working (rate limited)'
            else:
                results['SAM.gov'] = f'❌ Error {response.status_code}'
        except Exception as e:
            results['SAM.gov'] = f'❌ Failed: {str(e)[:50]}'
    else:
        results['SAM.gov'] = '❌ Key not found'
    
    # Test Supabase
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if supabase_url and supabase_key:
        try:
            headers = {
                'apikey': supabase_key,
                'Authorization': f'Bearer {supabase_key}',
                'Content-Type': 'application/json'
            }
            response = requests.get(f'{supabase_url}/rest/v1/opportunities?limit=1', 
                                  headers=headers, timeout=10)
            results['Supabase'] = '✅ Working' if response.status_code == 200 else f'❌ Error {response.status_code}'
        except Exception as e:
            results['Supabase'] = f'❌ Failed: {str(e)[:50]}'
    else:
        results['Supabase'] = '❌ Keys not found'
    
    # Print results
    for service, status in results.items():
        print(f"   {service}: {status}")
    
    working_count = sum(1 for status in results.values() if '✅' in status)
    print(f"\n🎯 API Status: {working_count}/{len(results)} services working")
    
    return working_count >= 3  # Need at least 3 working for good monitoring

def test_monitoring_simulation():
    """Simulate what the monitoring system will do"""
    print("\n🤖 Simulating Automated Monitoring")
    print("=" * 40)
    
    try:
        # Simulate hourly check
        print("⏰ Simulating hourly urgent check...")
        perplexity_key = os.getenv('PERPLEXITY_API_KEY')
        if perplexity_key:
            headers = {'Authorization': f'Bearer {perplexity_key}', 'Content-Type': 'application/json'}
            payload = {
                'model': 'llama-3.1-sonar-small-128k-online',
                'messages': [{
                    'role': 'user', 
                    'content': 'Quick test: Any urgent government contract announcements today? One sentence only.'
                }],
                'max_tokens': 50,
                'temperature': 0.1
            }
            
            response = requests.post('https://api.perplexity.ai/chat/completions', 
                                   headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                content = data['choices'][0]['message']['content']
                print(f"   ✅ Hourly check successful")
                print(f"   📄 Sample response: {content[:60]}...")
            else:
                print(f"   ❌ Hourly check failed: {response.status_code}")
        
        # Simulate daily scraping
        print("\n🔥 Simulating daily Firecrawl scraping...")
        firecrawl_key = os.getenv('FIRECRAWL_API_KEY')
        if firecrawl_key:
            headers = {'Authorization': f'Bearer {firecrawl_key}', 'Content-Type': 'application/json'}
            payload = {
                'url': 'https://www.gsa.gov/about-us/newsroom/news-releases',
                'formats': ['markdown'],
                'onlyMainContent': True
            }
            
            response = requests.post('https://api.firecrawl.dev/v0/scrape', 
                                   headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                content = data.get('data', {}).get('markdown', '')
                contract_mentions = content.lower().count('contract')
                print(f"   ✅ Daily scraping successful")
                print(f"   📊 Scraped {len(content):,} characters, {contract_mentions} contract mentions")
            else:
                print(f"   ❌ Daily scraping failed: {response.status_code}")
        
        print("\n✅ Monitoring simulation complete!")
        return True
        
    except Exception as e:
        print(f"\n❌ Monitoring simulation failed: {e}")
        return False

def test_github_actions_readiness():
    """Check if setup is ready for GitHub Actions"""
    print("\n🚀 GitHub Actions Readiness Check")
    print("=" * 40)
    
    required_secrets = [
        'PERPLEXITY_API_KEY',
        'FIRECRAWL_API_KEY', 
        'SAM_GOV_API_KEY',
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
    ]
    
    missing_secrets = []
    for secret in required_secrets:
        if not os.getenv(secret):
            missing_secrets.append(secret)
    
    if missing_secrets:
        print(f"❌ Missing environment variables:")
        for secret in missing_secrets:
            print(f"   - {secret}")
        print(f"\n💡 Add these to GitHub repository secrets")
        return False
    else:
        print(f"✅ All required secrets available locally")
        print(f"📋 Ready for GitHub Actions deployment")
        
        # Check workflow file
        workflow_path = '.github/workflows/automated-monitoring.yml'
        if os.path.exists(workflow_path):
            print(f"✅ Workflow file exists: {workflow_path}")
        else:
            print(f"❌ Workflow file missing: {workflow_path}")
            return False
        
        return True

def main():
    """Run complete monitoring setup test"""
    print("🔧 AUTOMATED MONITORING SETUP TEST")
    print("=" * 50)
    print(f"🕐 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run all tests
    api_ready = test_api_keys()
    monitoring_ready = test_monitoring_simulation()
    github_ready = test_github_actions_readiness()
    
    # Final assessment
    print("\n" + "=" * 50)
    print("🎯 SETUP READINESS ASSESSMENT")
    print("=" * 50)
    
    print(f"🔑 API Keys: {'✅ Ready' if api_ready else '❌ Issues'}")
    print(f"🤖 Monitoring Logic: {'✅ Ready' if monitoring_ready else '❌ Issues'}")
    print(f"🚀 GitHub Actions: {'✅ Ready' if github_ready else '❌ Issues'}")
    
    overall_ready = api_ready and monitoring_ready and github_ready
    
    if overall_ready:
        print(f"\n🎉 SETUP COMPLETE!")
        print(f"✅ Your automated monitoring is ready to deploy")
        print(f"📋 Next steps:")
        print(f"   1. Add secrets to GitHub repository")
        print(f"   2. Push workflow file to trigger first run")
        print(f"   3. Monitor results in GitHub Actions tab")
    else:
        print(f"\n⚠️ SETUP NEEDS ATTENTION")
        print(f"🔧 Fix the issues above before deploying")
    
    return overall_ready

if __name__ == '__main__':
    ready = main()
    exit(0 if ready else 1)