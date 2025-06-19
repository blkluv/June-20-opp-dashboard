"""
Serverless-compatible cron job triggers for Opportunity Dashboard
Handles scheduled data synchronization in Vercel's stateless environment
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import logging
from datetime import datetime

# Add src directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import enhanced services
ENHANCED_SERVICES_AVAILABLE = False
database_service = None
data_fetcher = None

try:
    from src.services.database_service import get_database_service
    from src.api.data_fetcher import DataFetcher
    database_service = get_database_service()
    data_fetcher = DataFetcher()
    ENHANCED_SERVICES_AVAILABLE = True
    logger.info("Enhanced services loaded for cron jobs")
except ImportError as e:
    logger.warning(f"Enhanced services not available for cron: {e}")
    ENHANCED_SERVICES_AVAILABLE = False

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL path
        path = self.path
        
        # Normalize path for Vercel deployment
        if path.startswith('/api'):
            path = path[4:]  # Remove '/api' prefix
        if not path:
            path = '/'
        
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        # Authentication check for cron endpoints
        auth_token = self.headers.get('Authorization')
        cron_secret = os.getenv('CRON_SECRET', 'default-secret-change-me')
        
        if not auth_token or auth_token != f'Bearer {cron_secret}':
            response = {
                'error': 'Unauthorized',
                'message': 'Valid authorization token required for cron endpoints',
                'timestamp': datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(response).encode())
            return
        
        # Route handling
        if path == '/' or path == '':
            response = {
                'message': 'Opportunity Dashboard Cron Service',
                'version': '1.0.0',
                'status': 'healthy',
                'enhanced_services': ENHANCED_SERVICES_AVAILABLE,
                'endpoints': [
                    '/cron/sync-all',
                    '/cron/sync-sam',
                    '/cron/sync-grants',
                    '/cron/sync-usa-spending',
                    '/cron/cleanup',
                    '/cron/health'
                ],
                'timestamp': datetime.now().isoformat()
            }
        elif path == '/health':
            response = {
                'status': 'healthy',
                'service': 'cron-service',
                'enhanced_services': ENHANCED_SERVICES_AVAILABLE,
                'timestamp': datetime.now().isoformat()
            }
        elif path == '/sync-all':
            response = self._handle_sync_all()
        elif path == '/sync-sam':
            response = self._handle_sync_source('SAM.gov')
        elif path == '/sync-grants':
            response = self._handle_sync_source('Grants.gov')
        elif path == '/sync-usa-spending':
            response = self._handle_sync_source('USASpending.gov')
        elif path == '/cleanup':
            response = self._handle_cleanup()
        else:
            response = {
                'error': 'Endpoint not found',
                'available_endpoints': ['/sync-all', '/sync-sam', '/sync-grants', '/sync-usa-spending', '/cleanup', '/health'],
                'timestamp': datetime.now().isoformat()
            }
        
        # Send response
        self.wfile.write(json.dumps(response, indent=2).encode())
    
    def _handle_sync_all(self):
        """Handle synchronized data fetch from all sources"""
        start_time = datetime.now()
        
        if not ENHANCED_SERVICES_AVAILABLE:
            return {
                'status': 'error',
                'message': 'Enhanced services not available for sync operations',
                'timestamp': start_time.isoformat()
            }
        
        try:
            logger.info("Starting scheduled sync for all sources")
            
            # Check if sync should run based on schedule
            if not database_service.should_run_background_sync():
                return {
                    'status': 'skipped',
                    'message': 'Sync not needed at this time based on schedule',
                    'timestamp': start_time.isoformat()
                }
            
            total_processed = 0
            total_added = 0
            total_updated = 0
            sync_results = []
            
            # Get next source to sync (intelligent rotation)
            next_source = database_service.get_next_source_to_sync()
            if not next_source:
                return {
                    'status': 'skipped',
                    'message': 'No sources need syncing at this time',
                    'timestamp': start_time.isoformat()
                }
            
            source_name = next_source['name']
            logger.info(f"Syncing source: {source_name}")
            
            # Fetch opportunities based on source
            opportunities = []
            if 'sam' in source_name.lower():
                sam_api_key = os.getenv('SAM_API_KEY')
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
                    'success': sync_result.success,
                    'duration_ms': sync_result.sync_duration_ms
                })
                total_processed += sync_result.records_processed
                total_added += sync_result.records_added
                total_updated += sync_result.records_updated
            
            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return {
                'status': 'completed',
                'total_processed': total_processed,
                'total_added': total_added,
                'total_updated': total_updated,
                'duration_ms': duration_ms,
                'sources_synced': len(sync_results),
                'sync_results': sync_results,
                'timestamp': start_time.isoformat(),
                'completed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Sync all failed: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': start_time.isoformat(),
                'duration_ms': int((datetime.now() - start_time).total_seconds() * 1000)
            }
    
    def _handle_sync_source(self, source_name: str):
        """Handle sync for a specific source"""
        start_time = datetime.now()
        
        if not ENHANCED_SERVICES_AVAILABLE:
            return {
                'status': 'error',
                'message': 'Enhanced services not available for sync operations',
                'source': source_name,
                'timestamp': start_time.isoformat()
            }
        
        try:
            logger.info(f"Starting scheduled sync for {source_name}")
            
            # Fetch opportunities from specific source
            opportunities = []
            if 'sam' in source_name.lower():
                sam_api_key = os.getenv('SAM_API_KEY')
                if sam_api_key:
                    opportunities = data_fetcher.fetch_sam_gov_opportunities(sam_api_key, limit=100)
                else:
                    return {
                        'status': 'error',
                        'message': 'SAM_API_KEY not configured',
                        'source': source_name,
                        'timestamp': start_time.isoformat()
                    }
            elif 'grants' in source_name.lower():
                opportunities = data_fetcher.fetch_grants_gov_opportunities(limit=100)
            elif 'spending' in source_name.lower():
                opportunities = data_fetcher.fetch_usa_spending_opportunities(limit=100)
            else:
                return {
                    'status': 'error',
                    'message': f'Unknown source: {source_name}',
                    'source': source_name,
                    'timestamp': start_time.isoformat()
                }
            
            # Save to database
            if opportunities:
                sync_result = database_service.save_opportunities(opportunities, source_name)
                duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
                
                return {
                    'status': 'completed',
                    'source': source_name,
                    'processed': sync_result.records_processed,
                    'added': sync_result.records_added,
                    'updated': sync_result.records_updated,
                    'failed': sync_result.records_failed,
                    'success': sync_result.success,
                    'duration_ms': duration_ms,
                    'timestamp': start_time.isoformat(),
                    'completed_at': datetime.now().isoformat()
                }
            else:
                return {
                    'status': 'completed',
                    'source': source_name,
                    'processed': 0,
                    'added': 0,
                    'updated': 0,
                    'failed': 0,
                    'message': 'No opportunities found',
                    'timestamp': start_time.isoformat()
                }
                
        except Exception as e:
            logger.error(f"Sync {source_name} failed: {e}")
            return {
                'status': 'error',
                'source': source_name,
                'error': str(e),
                'timestamp': start_time.isoformat(),
                'duration_ms': int((datetime.now() - start_time).total_seconds() * 1000)
            }
    
    def _handle_cleanup(self):
        """Handle cleanup of old records"""
        start_time = datetime.now()
        
        if not ENHANCED_SERVICES_AVAILABLE:
            return {
                'status': 'error',
                'message': 'Enhanced services not available for cleanup operations',
                'timestamp': start_time.isoformat()
            }
        
        try:
            logger.info("Starting scheduled cleanup")
            
            # Get database client
            client = database_service.admin_client
            
            # Delete opportunities older than 90 days
            cutoff_date = datetime.now()
            cutoff_date = cutoff_date.replace(day=cutoff_date.day - 90)
            
            # Delete old opportunities
            old_opps_result = client.table('opportunities').delete().lt('posted_date', cutoff_date.isoformat()).execute()
            opportunities_deleted = len(old_opps_result.data) if old_opps_result.data else 0
            
            # Delete old sync logs (keep last 30 days)
            log_cutoff_date = datetime.now()
            log_cutoff_date = log_cutoff_date.replace(day=log_cutoff_date.day - 30)
            
            old_logs_result = client.table('sync_logs').delete().lt('started_at', log_cutoff_date.isoformat()).execute()
            logs_deleted = len(old_logs_result.data) if old_logs_result.data else 0
            
            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return {
                'status': 'completed',
                'opportunities_deleted': opportunities_deleted,
                'logs_deleted': logs_deleted,
                'duration_ms': duration_ms,
                'timestamp': start_time.isoformat(),
                'completed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': start_time.isoformat(),
                'duration_ms': int((datetime.now() - start_time).total_seconds() * 1000)
            }
    
    def do_POST(self):
        """Handle POST requests (same as GET for cron jobs)"""
        self.do_GET()
    
    def do_OPTIONS(self):
        """Handle preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()