"""
Background job system for scheduled data fetching and processing
Handles source rotation, rate limiting, and automated synchronization
"""
import asyncio
import logging
import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import threading
import time

from .database_service import get_database_service, SyncResult
from ..config.supabase import get_supabase_client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class JobConfig:
    """Configuration for background jobs"""
    sync_interval_minutes: int = 30
    max_concurrent_sources: int = 2
    source_timeout_minutes: int = 10
    retry_failed_after_hours: int = 2
    enable_source_rotation: bool = True
    max_records_per_source: int = 500

class BackgroundJobManager:
    """Manages background data fetching jobs with source rotation"""
    
    def __init__(self, config: Optional[JobConfig] = None):
        self.config = config or JobConfig()
        self.db_service = get_database_service()
        self.is_running = False
        self.current_jobs = {}
        self.last_sync_time = None
        self._stop_event = threading.Event()
        
    def start(self):
        """Start the background job manager"""
        if self.is_running:
            logger.warning("Background job manager is already running")
            return
        
        self.is_running = True
        self._stop_event.clear()
        
        # Start in a separate thread to not block main application
        job_thread = threading.Thread(target=self._run_job_loop, daemon=True)
        job_thread.start()
        
        logger.info("Background job manager started")
    
    def stop(self):
        """Stop the background job manager"""
        self.is_running = False
        self._stop_event.set()
        logger.info("Background job manager stopped")
    
    def trigger_immediate_sync(self, source_name: Optional[str] = None) -> Dict:
        """Trigger an immediate sync for a specific source or all sources"""
        try:
            if source_name:
                return self._sync_single_source(source_name)
            else:
                return self._sync_all_sources()
        except Exception as e:
            logger.error(f"Failed to trigger immediate sync: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to trigger sync'
            }
    
    def get_job_status(self) -> Dict:
        """Get current status of background jobs"""
        return {
            'is_running': self.is_running,
            'last_sync_time': self.last_sync_time.isoformat() if self.last_sync_time else None,
            'current_jobs': list(self.current_jobs.keys()),
            'config': {
                'sync_interval_minutes': self.config.sync_interval_minutes,
                'max_concurrent_sources': self.config.max_concurrent_sources,
                'enable_source_rotation': self.config.enable_source_rotation
            }
        }
    
    def _run_job_loop(self):
        """Main job loop that runs in background thread"""
        logger.info("Background job loop started")
        
        while self.is_running and not self._stop_event.is_set():
            try:
                # Check if it's time to run a sync
                if self._should_run_sync():
                    self._execute_scheduled_sync()
                
                # Sleep for 1 minute before checking again
                if self._stop_event.wait(60):  # Wait 60 seconds or until stop event
                    break
                    
            except Exception as e:
                logger.error(f"Error in background job loop: {e}")
                time.sleep(60)  # Wait before retrying
        
        logger.info("Background job loop stopped")
    
    def _should_run_sync(self) -> bool:
        """Check if a sync should be run based on schedule"""
        if not self.config.enable_source_rotation:
            return False
        
        # Check database for last sync time
        if self.db_service.should_run_background_sync():
            return True
        
        # Check local last sync time
        if self.last_sync_time is None:
            return True
        
        time_since_last = datetime.now() - self.last_sync_time
        return time_since_last > timedelta(minutes=self.config.sync_interval_minutes)
    
    def _execute_scheduled_sync(self):
        """Execute a scheduled sync using source rotation"""
        logger.info("Starting scheduled sync with source rotation")
        
        try:
            if self.config.enable_source_rotation:
                # Use source rotation - sync one source at a time
                next_source = self.db_service.get_next_source_to_sync()
                if next_source:
                    logger.info(f"Syncing source: {next_source['name']}")
                    result = self._sync_single_source(next_source['name'])
                    logger.info(f"Source sync completed: {result}")
                else:
                    logger.info("No sources available for sync")
            else:
                # Sync all sources
                result = self._sync_all_sources()
                logger.info(f"All sources sync completed: {result}")
            
            self.last_sync_time = datetime.now()
            
        except Exception as e:
            logger.error(f"Error during scheduled sync: {e}")
    
    def _sync_single_source(self, source_name: str) -> Dict:
        """Sync a single data source"""
        start_time = datetime.now()
        
        try:
            # Import here to avoid circular imports
            from ..api.data_fetcher import DataFetcher
            
            data_fetcher = DataFetcher()
            
            # Add to current jobs
            job_id = f"sync_{source_name}_{int(time.time())}"
            self.current_jobs[job_id] = {
                'source': source_name,
                'started_at': start_time,
                'status': 'running'
            }
            
            # Fetch data from source
            opportunities = []
            
            if source_name.lower() == 'sam.gov':
                sam_api_key = os.getenv('SAM_API_KEY')
                if sam_api_key:
                    opportunities = data_fetcher.fetch_sam_gov_opportunities(sam_api_key)
            
            elif source_name.lower() == 'grants.gov':
                opportunities = data_fetcher.fetch_grants_gov_opportunities()
            
            elif source_name.lower() == 'usaspending.gov':
                opportunities = data_fetcher.fetch_usa_spending_opportunities()
            
            elif 'firecrawl' in source_name.lower():
                firecrawl_api_key = os.getenv('FIRECRAWL_API_KEY')
                if firecrawl_api_key:
                    opportunities = data_fetcher.fetch_firecrawl_opportunities()
            
            # Limit records per source to avoid overwhelming the database
            if len(opportunities) > self.config.max_records_per_source:
                opportunities = opportunities[:self.config.max_records_per_source]
                logger.info(f"Limited {source_name} to {self.config.max_records_per_source} records")
            
            # Save to database
            sync_result = self.db_service.save_opportunities(opportunities, source_name)
            
            # Update job status
            self.current_jobs[job_id]['status'] = 'completed'
            self.current_jobs[job_id]['completed_at'] = datetime.now()
            self.current_jobs[job_id]['result'] = sync_result
            
            # Clean up old job entries (keep only last 10)
            if len(self.current_jobs) > 10:
                oldest_jobs = sorted(self.current_jobs.keys())[:-10]
                for old_job in oldest_jobs:
                    del self.current_jobs[old_job]
            
            return {
                'success': sync_result.success,
                'source': source_name,
                'records_processed': sync_result.records_processed,
                'records_added': sync_result.records_added,
                'records_updated': sync_result.records_updated,
                'duration_ms': sync_result.sync_duration_ms,
                'error': sync_result.error_message
            }
            
        except Exception as e:
            # Update job status
            if job_id in self.current_jobs:
                self.current_jobs[job_id]['status'] = 'failed'
                self.current_jobs[job_id]['error'] = str(e)
            
            logger.error(f"Failed to sync source {source_name}: {e}")
            return {
                'success': False,
                'source': source_name,
                'error': str(e),
                'records_processed': 0,
                'records_added': 0,
                'records_updated': 0
            }
    
    def _sync_all_sources(self) -> Dict:
        """Sync all available data sources"""
        try:
            # Get active data sources
            sources_result = get_supabase_client().table('data_sources').select('name').eq('is_active', True).execute()
            source_names = [source['name'] for source in sources_result.data]
            
            results = []
            total_processed = 0
            total_added = 0
            total_updated = 0
            
            # Sync each source (respecting concurrency limits)
            for source_name in source_names:
                if len(self.current_jobs) >= self.config.max_concurrent_sources:
                    logger.info(f"Reached max concurrent sources ({self.config.max_concurrent_sources}), waiting...")
                    time.sleep(30)  # Wait before trying next source
                
                result = self._sync_single_source(source_name)
                results.append(result)
                
                if result['success']:
                    total_processed += result['records_processed']
                    total_added += result['records_added']
                    total_updated += result['records_updated']
                
                # Small delay between sources to avoid overwhelming APIs
                time.sleep(5)
            
            return {
                'success': True,
                'sources_synced': len(source_names),
                'total_processed': total_processed,
                'total_added': total_added,
                'total_updated': total_updated,
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Failed to sync all sources: {e}")
            return {
                'success': False,
                'error': str(e),
                'sources_synced': 0,
                'total_processed': 0,
                'total_added': 0,
                'total_updated': 0
            }

class SourceRotationManager:
    """Manages intelligent source rotation to optimize API usage"""
    
    def __init__(self):
        self.db_service = get_database_service()
    
    def get_optimal_source_order(self) -> List[Dict]:
        """Get sources ordered by optimal sync priority"""
        try:
            # Get all active sources
            sources_result = get_supabase_client().table('data_sources').select('*').eq('is_active', True).execute()
            sources = sources_result.data
            
            # Score each source based on multiple factors
            scored_sources = []
            for source in sources:
                score = self._calculate_source_priority(source)
                scored_sources.append({
                    'source': source,
                    'priority_score': score
                })
            
            # Sort by priority score (highest first)
            scored_sources.sort(key=lambda x: x['priority_score'], reverse=True)
            
            return [item['source'] for item in scored_sources]
            
        except Exception as e:
            logger.error(f"Failed to get optimal source order: {e}")
            return []
    
    def _calculate_source_priority(self, source: Dict) -> float:
        """Calculate priority score for a source based on multiple factors"""
        score = 0.0
        now = datetime.now()
        
        # Factor 1: Time since last sync (higher score for longer time)
        if source['last_sync_at']:
            last_sync = datetime.fromisoformat(source['last_sync_at'].replace('Z', '+00:00'))
            hours_since_sync = (now - last_sync.replace(tzinfo=None)).total_seconds() / 3600
            score += min(hours_since_sync / 24, 10)  # Max 10 points for time
        else:
            score += 20  # High priority for never-synced sources
        
        # Factor 2: Rate limit efficiency (higher score for higher limits)
        rate_limit = source.get('rate_limit_per_hour', 100)
        score += min(rate_limit / 100, 5)  # Max 5 points for rate limit
        
        # Factor 3: Source reliability (based on recent success rate)
        success_rate = self._get_source_success_rate(source['name'])
        score += success_rate * 5  # Max 5 points for reliability
        
        # Factor 4: API key availability
        if source.get('api_key_required'):
            # Check if API key is available
            source_name = source['name'].lower()
            if 'sam' in source_name and not os.getenv('SAM_API_KEY'):
                score -= 20  # Penalize heavily if required key is missing
            elif 'firecrawl' in source_name and not os.getenv('FIRECRAWL_API_KEY'):
                score -= 20
        
        # Factor 5: Source type priority
        source_type = source.get('type', '').lower()
        if 'federal' in source_type:
            score += 3  # Federal sources often have more opportunities
        elif 'grant' in source_type:
            score += 2  # Grants are valuable
        
        return max(score, 0)  # Ensure non-negative score
    
    def _get_source_success_rate(self, source_name: str) -> float:
        """Get recent success rate for a source (0.0 to 1.0)"""
        try:
            # Get recent sync logs (last 10 attempts)
            since = (datetime.now() - timedelta(days=7)).isoformat()
            logs_result = get_supabase_client().table('sync_logs').select('error_message').eq('source_name', source_name).gte('started_at', since).order('started_at', desc=True).limit(10).execute()
            
            if not logs_result.data:
                return 0.8  # Default success rate for new sources
            
            successful = sum(1 for log in logs_result.data if not log.get('error_message'))
            total = len(logs_result.data)
            
            return successful / total if total > 0 else 0.8
            
        except Exception as e:
            logger.error(f"Failed to get success rate for {source_name}: {e}")
            return 0.5  # Default middle success rate

# Global instances
job_manager = BackgroundJobManager()
rotation_manager = SourceRotationManager()

def get_job_manager() -> BackgroundJobManager:
    """Get the background job manager instance"""
    return job_manager

def get_rotation_manager() -> SourceRotationManager:
    """Get the source rotation manager instance"""
    return rotation_manager

# Auto-start background jobs if in production
if os.getenv('VERCEL_ENV') == 'production' or os.getenv('ENABLE_BACKGROUND_JOBS') == 'true':
    job_manager.start()
    logger.info("Background jobs auto-started for production environment")