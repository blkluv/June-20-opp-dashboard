from http.server import BaseHTTPRequestHandler
import json
import os
import requests
from datetime import datetime, timedelta
import urllib.parse

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        try:
            # Get API keys from environment
            sam_api_key = os.environ.get('SAM_API_KEY')
            firecrawl_api_key = os.environ.get('FIRECRAWL_API_KEY')
            
            results = {
                'total_processed': 0,
                'total_added': 0,
                'total_updated': 0,
                'sources': {},
                'errors': []
            }
            
            # Sync SAM.gov if API key is available
            if sam_api_key:
                try:
                    sam_result = self.sync_sam_gov(sam_api_key)
                    results['sources']['sam_gov'] = sam_result
                    results['total_processed'] += sam_result.get('processed', 0)
                    results['total_added'] += sam_result.get('added', 0)
                except Exception as e:
                    results['sources']['sam_gov'] = {'status': 'failed', 'error': str(e)}
                    results['errors'].append(f"SAM.gov sync failed: {str(e)}")
            else:
                results['sources']['sam_gov'] = {'status': 'no_api_key', 'message': 'SAM API key not configured'}
            
            # Sync Grants.gov (no API key required)
            try:
                grants_result = self.sync_grants_gov()
                results['sources']['grants_gov'] = grants_result
                results['total_processed'] += grants_result.get('processed', 0)
                results['total_added'] += grants_result.get('added', 0)
            except Exception as e:
                results['sources']['grants_gov'] = {'status': 'failed', 'error': str(e)}
                results['errors'].append(f"Grants.gov sync failed: {str(e)}")
            
            # Sync with Firecrawl if API key is available
            if firecrawl_api_key:
                try:
                    firecrawl_result = self.sync_firecrawl(firecrawl_api_key)
                    results['sources']['firecrawl'] = firecrawl_result
                    results['total_processed'] += firecrawl_result.get('processed', 0)
                    results['total_added'] += firecrawl_result.get('added', 0)
                except Exception as e:
                    results['sources']['firecrawl'] = {'status': 'failed', 'error': str(e)}
                    results['errors'].append(f"Firecrawl sync failed: {str(e)}")
            else:
                results['sources']['firecrawl'] = {'status': 'no_api_key', 'message': 'Firecrawl API key not configured'}
            
            response = {
                'success': True,
                'message': f'Sync completed - {results["total_added"]} new opportunities added',
                'results': results
            }
            
        except Exception as e:
            response = {
                'success': False,
                'message': f'Sync failed: {str(e)}',
                'error': str(e)
            }
        
        self.wfile.write(json.dumps(response).encode())
    
    def sync_sam_gov(self, api_key):
        """Fetch opportunities from SAM.gov API"""
        url = "https://api.sam.gov/opportunities/v2/search"
        
        params = {
            "limit": 25,
            "offset": 0,
            "postedFrom": (datetime.now() - timedelta(days=30)).strftime("%m/%d/%Y"),
            "postedTo": datetime.now().strftime("%m/%d/%Y"),
            "ptype": "o"  # Solicitation
        }
        
        headers = {
            "X-API-Key": api_key,
            "Accept": "application/json"
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        opportunities = data.get('opportunitiesData', [])
        
        # Transform data (simplified for this demo)
        processed_opps = []
        for opp in opportunities[:10]:  # Limit to 10 for demo
            processed_opps.append({
                'id': opp.get('noticeId'),
                'title': opp.get('title'),
                'description': opp.get('description', ''),
                'agency_name': opp.get('department'),
                'estimated_value': opp.get('award', {}).get('amount'),
                'due_date': opp.get('responseDeadLine'),
                'posted_date': opp.get('postedDate'),
                'status': 'active',
                'source_type': 'federal_contract',
                'source_name': 'SAM.gov',
                'total_score': 85,
                'opportunity_number': opp.get('solicitationNumber')
            })
        
        return {
            'status': 'completed',
            'processed': len(opportunities),
            'added': len(processed_opps),
            'opportunities': processed_opps
        }
    
    def sync_grants_gov(self):
        """Fetch opportunities from Grants.gov API"""
        url = "https://api.grants.gov/v1/api/search2"
        
        payload = {
            "rows": 25,
            "offset": 0,
            "oppStatuses": ["forecasted", "posted"],
            "sortBy": "openDate|desc"
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        opportunities = data.get('oppHits', [])
        
        # Transform data
        processed_opps = []
        for opp in opportunities[:10]:  # Limit to 10 for demo
            processed_opps.append({
                'id': opp.get('id'),
                'title': opp.get('title'),
                'description': opp.get('description', ''),
                'agency_name': opp.get('agencyName'),
                'estimated_value': opp.get('awardCeiling'),
                'due_date': opp.get('closeDate'),
                'posted_date': opp.get('openDate'),
                'status': 'active',
                'source_type': 'federal_grant',
                'source_name': 'Grants.gov',
                'total_score': 80,
                'opportunity_number': opp.get('number')
            })
        
        return {
            'status': 'completed',
            'processed': len(opportunities),
            'added': len(processed_opps),
            'opportunities': processed_opps
        }
    
    def sync_firecrawl(self, api_key):
        """Sync with Firecrawl (placeholder for your implementation)"""
        # This is a placeholder - you can customize based on your Firecrawl setup
        return {
            'status': 'completed',
            'processed': 0,
            'added': 0,
            'opportunities': [],
            'message': 'Firecrawl integration ready'
        }
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()