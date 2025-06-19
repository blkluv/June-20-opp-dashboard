"""
Enhanced Opportunity Dashboard API - Serverless Compatible Version
Integrates database caching with fallback to original functionality
"""
from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import os
import sys
import requests
from datetime import datetime, timedelta
import tempfile
import pickle
import logging

# Add src directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import enhanced services - graceful fallback if not available
ENHANCED_SERVICES_AVAILABLE = False
database_service = None
data_fetcher = None

try:
    from src.services.database_service import get_database_service
    from src.api.data_fetcher import DataFetcher
    database_service = get_database_service()
    data_fetcher = DataFetcher()
    ENHANCED_SERVICES_AVAILABLE = True
    logger.info("Enhanced services loaded successfully")
except ImportError as e:
    logger.warning(f"Enhanced services not available, using fallback mode: {e}")
    ENHANCED_SERVICES_AVAILABLE = False

# Fallback opportunity fetcher (simplified version from original API)
class FallbackOpportunityFetcher:
    """Simplified opportunity fetcher for when enhanced services aren't available"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'OpportunityDashboard/1.0',
            'Accept': 'application/json'
        })
    
    def get_real_opportunities(self):
        """Fetch real opportunities from all available sources with pagination"""
        opportunities = []
        
        # Fetch from SAM.gov
        sam_opps = self._fetch_sam_gov_opportunities()
        opportunities.extend(sam_opps)
        
        # Fetch from Grants.gov
        grants_opps = self._fetch_grants_gov_opportunities()
        opportunities.extend(grants_opps)
        
        # Fetch from USASpending.gov
        usa_opps = self._fetch_usa_spending_opportunities()
        opportunities.extend(usa_opps)
        
        # Add metadata
        for i, opp in enumerate(opportunities):
            opp['id'] = opp.get('id', f'fallback-{i}')
            opp['retrieved_at'] = datetime.now().isoformat()
        
        return opportunities
    
    def _fetch_sam_gov_opportunities(self):
        """Simplified SAM.gov fetcher"""
        sam_api_key = os.environ.get('SAM_API_KEY')
        if not sam_api_key:
            return []
        
        try:
            url = "https://api.sam.gov/opportunities/v2/search"
            params = {
                "limit": 50,
                "offset": 0,
                "postedFrom": (datetime.now() - timedelta(days=30)).strftime("%m/%d/%Y"),
                "postedTo": datetime.now().strftime("%m/%d/%Y"),
                "ptype": "o"
            }
            
            headers = {
                "X-API-Key": sam_api_key.strip(),
                "Accept": "application/json"
            }
            
            response = self.session.get(url, params=params, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            opportunities = data.get('opportunitiesData', [])
            
            processed_opps = []
            for opp in opportunities:
                processed_opps.append({
                    'id': opp.get('noticeId', f'sam-{len(processed_opps)}'),
                    'title': opp.get('title', 'No Title'),
                    'description': opp.get('description', '')[:1000] + '...' if len(opp.get('description', '')) > 1000 else opp.get('description', ''),
                    'agency_name': opp.get('department', 'Unknown Department'),
                    'estimated_value': self._extract_numeric_value(opp.get('award', {}).get('amount')),
                    'due_date': opp.get('responseDeadLine'),
                    'posted_date': opp.get('postedDate'),
                    'status': 'active',
                    'source_type': 'federal_contract',
                    'source_name': 'SAM.gov',
                    'source_url': f"https://sam.gov/opp/{opp.get('noticeId', '')}",
                    'opportunity_number': opp.get('solicitationNumber', 'N/A')
                })
            
            return processed_opps
            
        except Exception as e:
            logger.error(f"Failed to fetch SAM.gov opportunities: {e}")
            return []
    
    def _fetch_grants_gov_opportunities(self):
        """Simplified Grants.gov fetcher"""
        try:
            url = "https://api.grants.gov/v1/api/search2"
            payload = {
                "rows": 50,
                "offset": 0,
                "oppStatuses": ["forecasted", "posted", "active"],
                "sortBy": "openDate|desc"
            }
            
            response = self.session.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            opportunities = data.get('oppHits', [])
            
            processed_opps = []
            for opp in opportunities:
                processed_opps.append({
                    'id': opp.get('id', f'grants-{len(processed_opps)}'),
                    'title': opp.get('title', 'No Title'),
                    'description': opp.get('description', '')[:1000] + '...' if len(opp.get('description', '')) > 1000 else opp.get('description', ''),
                    'agency_name': opp.get('agencyName', 'Unknown Agency'),
                    'estimated_value': self._extract_numeric_value(opp.get('awardCeiling')),
                    'due_date': opp.get('closeDate'),
                    'posted_date': opp.get('openDate'),
                    'status': 'active',
                    'source_type': 'federal_grant',
                    'source_name': 'Grants.gov',
                    'source_url': f"https://www.grants.gov/web/grants/view-opportunity.html?oppId={opp.get('id', '')}",
                    'opportunity_number': opp.get('number', 'N/A')
                })
            
            return processed_opps
            
        except Exception as e:
            logger.error(f"Failed to fetch Grants.gov opportunities: {e}")
            return []
    
    def _fetch_usa_spending_opportunities(self):
        """Simplified USASpending.gov fetcher"""
        try:
            url = "https://api.usaspending.gov/api/v2/search/spending_by_award/"
            payload = {
                "filters": {
                    "award_type_codes": ["A", "B", "C", "D"],
                    "time_period": [{
                        "start_date": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
                        "end_date": datetime.now().strftime("%Y-%m-%d")
                    }]
                },
                "fields": ["Award ID", "Recipient Name", "Award Amount", "Start Date", "End Date", "Awarding Agency", "Award Description"],
                "sort": "Start Date",
                "order": "desc",
                "limit": 50
            }
            
            response = self.session.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            results = data.get('results', [])
            
            processed_opps = []
            for award in results:
                award_amount = self._extract_numeric_value(award.get('Award Amount', 0))
                processed_opps.append({
                    'id': award.get('Award ID', f'usa-{len(processed_opps)}'),
                    'title': f"Federal Contract - {award.get('Recipient Name', 'Contract Opportunity')}",
                    'description': f"Federal contract opportunity. Award amount: ${award_amount:,.0f}. Recipient: {award.get('Recipient Name', 'N/A')}",
                    'agency_name': award.get('Awarding Agency', 'Unknown Agency'),
                    'estimated_value': award_amount,
                    'due_date': award.get('End Date'),
                    'posted_date': award.get('Start Date'),
                    'status': 'active',
                    'source_type': 'federal_contract',
                    'source_name': 'USASpending.gov',
                    'source_url': f"https://www.usaspending.gov/award/{award.get('Award ID', '')}",
                    'opportunity_number': award.get('Award ID', 'N/A')
                })
            
            return processed_opps
            
        except Exception as e:
            logger.error(f"Failed to fetch USASpending.gov opportunities: {e}")
            return []
    
    def _extract_numeric_value(self, value):
        """Extract numeric value from various formats"""
        if not value:
            return None
        
        try:
            if isinstance(value, (int, float)):
                return float(value)
            
            import re
            cleaned = re.sub(r'[,$]', '', str(value))
            
            if 'million' in str(value).lower():
                return float(cleaned) * 1000000
            elif 'billion' in str(value).lower():
                return float(cleaned) * 1000000000
            else:
                return float(cleaned)
        except:
            return None

# Global fallback fetcher instance
fallback_fetcher = FallbackOpportunityFetcher()

# Global variable to store sync status in memory (since Vercel is stateless)
SYNC_STATUS_DATA = {
    'last_sync_total_processed': 0,
    'last_sync_total_added': 0,
    'sources': {
        'grants_gov': {
            'status': 'available',
            'last_sync': None,
            'records_processed': 0,
            'records_added': 0,
            'records_updated': 0
        },
        'sam_gov': {
            'status': 'available',
            'last_sync': None,
            'records_processed': 0,
            'records_added': 0,
            'records_updated': 0
        },
        'usa_spending': {
            'status': 'available',
            'last_sync': None,
            'records_processed': 0,
            'records_added': 0,
            'records_updated': 0
        }
    }
}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL path
        path = self.path
        
        # Debug: Log the actual path received
        print(f"DEBUG: Received path: '{path}'")
        
        # Normalize path for Vercel deployment
        if path.startswith('/api'):
            path = path[4:]  # Remove '/api' prefix
        if not path:
            path = '/'
        
        print(f"DEBUG: Normalized path: '{path}'")
        
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # Route handling
        if path == '/' or path == '':
            response = {
                'message': 'Enhanced Opportunity Dashboard API',
                'version': '2.0.1',
                'status': 'healthy',
                'enhanced_services': ENHANCED_SERVICES_AVAILABLE,
                'endpoints': [
                    '/api/health',
                    '/api/opportunities',
                    '/api/opportunities/stats',
                    '/api/sync/status',
                    '/api/sync',
                    '/api/db/test' if ENHANCED_SERVICES_AVAILABLE else None,
                    '/api/db/opportunities' if ENHANCED_SERVICES_AVAILABLE else None
                ]
            }
        elif path == '/health':
            response = {
                'status': 'healthy',
                'service': 'opportunity-dashboard-backend-enhanced',
                'enhanced_services': ENHANCED_SERVICES_AVAILABLE,
                'message': 'Enhanced backend API is working correctly' if ENHANCED_SERVICES_AVAILABLE else 'Fallback backend API is working correctly'
            }
        elif path == '/db/test' and ENHANCED_SERVICES_AVAILABLE:
            # Test database connection
            try:
                connection_ok = database_service.test_connection()
                response = {
                    'database_connected': connection_ok,
                    'service': 'enhanced-database',
                    'timestamp': datetime.now().isoformat()
                }
            except Exception as e:
                response = {
                    'database_connected': False,
                    'error': str(e),
                    'service': 'enhanced-database',
                    'timestamp': datetime.now().isoformat()
                }
        elif path == '/db/opportunities' and ENHANCED_SERVICES_AVAILABLE:
            # Get opportunities from database
            try:
                result = database_service.get_opportunities(limit=50)
                response = {
                    'source': 'database',
                    'cached_opportunities': result['opportunities'],
                    'total_cached': result['total'],
                    'page': result['page'],
                    'limit': result['limit'],
                    'has_more': result['has_more'],
                    'timestamp': datetime.now().isoformat()
                }
            except Exception as e:
                response = {
                    'source': 'database',
                    'error': str(e),
                    'cached_opportunities': [],
                    'total_cached': 0,
                    'timestamp': datetime.now().isoformat()
                }
        elif path == '/opportunities':
            # Get opportunities - try database first, fallback to live APIs
            if ENHANCED_SERVICES_AVAILABLE:
                try:
                    # Try to get from database first
                    db_result = database_service.get_opportunities(limit=100)
                    if db_result['opportunities']:
                        response = {
                            'opportunities': db_result['opportunities'],
                            'total': db_result['total'],
                            'source': 'database_cache',
                            'enhanced': True,
                            'timestamp': datetime.now().isoformat(),
                            'cache_info': {
                                'cached_count': len(db_result['opportunities']),
                                'page': db_result['page'],
                                'has_more': db_result['has_more']
                            }
                        }
                    else:
                        # No cached data, fall back to live APIs
                        raise Exception("No cached opportunities available")
                except Exception as e:
                    logger.warning(f"Database query failed, falling back to live APIs: {e}")
                    # Fallback to live API fetch
                    opportunities = fallback_fetcher.get_real_opportunities()
                    response = {
                        'opportunities': opportunities,
                        'total': len(opportunities),
                        'source': 'live_apis_fallback',
                        'enhanced': False,
                        'timestamp': datetime.now().isoformat(),
                        'fallback_reason': str(e)
                    }
            else:
                # Enhanced services not available, use fallback
                opportunities = fallback_fetcher.get_real_opportunities()
                response = {
                    'opportunities': opportunities,
                    'total': len(opportunities),
                    'source': 'live_apis',
                    'enhanced': False,
                    'timestamp': datetime.now().isoformat()
                }
        elif path == '/sync/status':
            # Get sync status - try database first, fallback to in-memory
            if ENHANCED_SERVICES_AVAILABLE:
                try:
                    response = database_service.get_sync_status()
                    response['enhanced'] = True
                except Exception as e:
                    logger.warning(f"Database sync status failed, using fallback: {e}")
                    # Fallback to in-memory status
                    response = self._get_fallback_sync_status()
                    response['enhanced'] = False
                    response['fallback_reason'] = str(e)
            else:
                response = self._get_fallback_sync_status()
                response['enhanced'] = False
        elif path == '/sync':
            # Trigger sync - try enhanced sync first, fallback to simple
            if ENHANCED_SERVICES_AVAILABLE:
                try:
                    # Try enhanced sync with database storage
                    response = self._run_enhanced_sync()
                except Exception as e:
                    logger.warning(f"Enhanced sync failed, using fallback: {e}")
                    response = self._run_fallback_sync()
                    response['fallback_reason'] = str(e)
            else:
                response = self._run_fallback_sync()
        else:
            response = {
                'error': 'Endpoint not found',
                'available_endpoints': ['/health', '/opportunities', '/sync/status', '/sync'],
                'enhanced_endpoints': ['/db/test', '/db/opportunities'] if ENHANCED_SERVICES_AVAILABLE else []
            }
        
        # Send response
        self.wfile.write(json.dumps(response, indent=2).encode())
    
    def _get_fallback_sync_status(self):
        """Get sync status using fallback in-memory data"""
        sam_api_key = os.environ.get('SAM_API_KEY')
        sam_status = 'available' if sam_api_key else 'requires_api_key'
        
        response = {
            'status': 'ready',
            'enhanced': False,
            'sources': {
                'grants_gov': SYNC_STATUS_DATA['sources']['grants_gov'].copy(),
                'sam_gov': {
                    **SYNC_STATUS_DATA['sources']['sam_gov'],
                    'status': sam_status
                },
                'usa_spending': SYNC_STATUS_DATA['sources']['usa_spending'].copy()
            },
            'last_sync_total_processed': SYNC_STATUS_DATA['last_sync_total_processed'],
            'last_sync_total_added': SYNC_STATUS_DATA['last_sync_total_added'],
            'timestamp': datetime.now().isoformat()
        }
        
        return response
    
    def _run_enhanced_sync(self):
        """Run enhanced sync with database storage"""
        try:
            start_time = datetime.now()
            total_processed = 0
            total_added = 0
            sync_results = []
            
            # Get next source to sync based on rotation logic
            next_source = database_service.get_next_source_to_sync()
            if not next_source:
                return {
                    'status': 'skipped',
                    'message': 'No sources need syncing at this time',
                    'enhanced': True,
                    'timestamp': datetime.now().isoformat()
                }
            
            source_name = next_source['name']
            logger.info(f"Starting enhanced sync for source: {source_name}")
            
            # Fetch opportunities using enhanced data fetcher
            opportunities = []
            if 'sam' in source_name.lower():
                sam_api_key = os.environ.get('SAM_API_KEY')
                if sam_api_key:
                    opportunities = data_fetcher.fetch_sam_gov_opportunities(sam_api_key, limit=100)
            elif 'grants' in source_name.lower():
                opportunities = data_fetcher.fetch_grants_gov_opportunities(limit=100)
            elif 'spending' in source_name.lower():
                opportunities = data_fetcher.fetch_usa_spending_opportunities(limit=100)
            
            # Save to database
            if opportunities:
                sync_result = database_service.save_opportunities(opportunities, source_name)
                sync_results.append({
                    'source': source_name,
                    'processed': sync_result.records_processed,
                    'added': sync_result.records_added,
                    'updated': sync_result.records_updated,
                    'failed': sync_result.records_failed,
                    'success': sync_result.success
                })
                total_processed += sync_result.records_processed
                total_added += sync_result.records_added
            
            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return {
                'status': 'completed',
                'enhanced': True,
                'total_processed': total_processed,
                'total_added': total_added,
                'duration_ms': duration_ms,
                'sources_synced': len(sync_results),
                'sync_results': sync_results,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Enhanced sync failed: {e}")
            raise e
    
    def _run_fallback_sync(self):
        """Run fallback sync without database storage"""
        try:
            start_time = datetime.now()
            
            # Fetch fresh opportunities
            opportunities = fallback_fetcher.get_real_opportunities()
            
            # Update in-memory sync status
            current_time = datetime.now().isoformat()
            for source_name in SYNC_STATUS_DATA['sources']:
                SYNC_STATUS_DATA['sources'][source_name].update({
                    'status': 'completed',
                    'last_sync': current_time,
                    'records_processed': len([o for o in opportunities if source_name.replace('_', '.') in o.get('source_name', '').lower()]),
                    'records_added': len([o for o in opportunities if source_name.replace('_', '.') in o.get('source_name', '').lower()]),
                    'records_updated': 0
                })
            
            SYNC_STATUS_DATA['last_sync_total_processed'] = len(opportunities)
            SYNC_STATUS_DATA['last_sync_total_added'] = len(opportunities)
            
            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return {
                'status': 'completed',
                'enhanced': False,
                'total_processed': len(opportunities),
                'total_added': len(opportunities),
                'duration_ms': duration_ms,
                'sources_synced': len(SYNC_STATUS_DATA['sources']),
                'message': 'Fallback sync completed - data not persisted',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Fallback sync failed: {e}")
            return {
                'status': 'failed',
                'enhanced': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def do_OPTIONS(self):
        """Handle preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()