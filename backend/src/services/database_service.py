"""
Database service for opportunity caching and management using Supabase
Handles CRUD operations, data synchronization, and background job coordination
"""
import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
import logging

from ..config.supabase import get_supabase_client, get_supabase_admin_client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SyncResult:
    source_name: str
    success: bool
    records_processed: int
    records_added: int
    records_updated: int
    records_failed: int
    error_message: Optional[str] = None
    sync_duration_ms: Optional[int] = None

class DatabaseService:
    """Service for managing opportunities database operations"""
    
    def __init__(self):
        self.client = get_supabase_client()
        self.admin_client = get_supabase_admin_client()
    
    def test_connection(self) -> bool:
        """Test database connection"""
        try:
            response = self.client.table('data_sources').select('id').limit(1).execute()
            return len(response.data) >= 0
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False
    
    # ========================================
    # OPPORTUNITY MANAGEMENT
    # ========================================
    
    def save_opportunities(self, opportunities: List[Dict], source_name: str) -> SyncResult:
        """Save opportunities to database with deduplication"""
        start_time = datetime.now()
        records_added = 0
        records_updated = 0
        records_failed = 0
        
        try:
            # Get or create data source
            data_source = self._get_or_create_data_source(source_name)
            
            for opp in opportunities:
                try:
                    # Prepare opportunity data
                    opp_data = self._prepare_opportunity_data(opp, data_source['id'])
                    
                    # Check if opportunity already exists
                    existing = self.client.table('opportunities').select('id').eq('external_id', opp_data['external_id']).execute()
                    
                    if existing.data:
                        # Update existing
                        result = self.client.table('opportunities').update(opp_data).eq('external_id', opp_data['external_id']).execute()
                        if result.data:
                            records_updated += 1
                    else:
                        # Insert new
                        result = self.client.table('opportunities').insert(opp_data).execute()
                        if result.data:
                            records_added += 1
                            
                except Exception as e:
                    logger.error(f"Failed to save opportunity {opp.get('id', 'unknown')}: {e}")
                    records_failed += 1
            
            # Update data source last sync time
            self._update_data_source_sync_time(data_source['id'])
            
            # Log sync result
            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            sync_result = SyncResult(
                source_name=source_name,
                success=True,
                records_processed=len(opportunities),
                records_added=records_added,
                records_updated=records_updated,
                records_failed=records_failed,
                sync_duration_ms=duration_ms
            )
            
            self._log_sync_result(sync_result)
            return sync_result
            
        except Exception as e:
            logger.error(f"Failed to save opportunities from {source_name}: {e}")
            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            sync_result = SyncResult(
                source_name=source_name,
                success=False,
                records_processed=len(opportunities),
                records_added=records_added,
                records_updated=records_updated,
                records_failed=records_failed,
                error_message=str(e),
                sync_duration_ms=duration_ms
            )
            
            self._log_sync_result(sync_result)
            return sync_result
    
    def get_opportunities(self, 
                         limit: int = 100, 
                         offset: int = 0,
                         source_type: Optional[str] = None,
                         min_score: Optional[int] = None,
                         search_query: Optional[str] = None) -> Dict:
        """Get opportunities from database with filtering"""
        try:
            query = self.client.table('opportunities').select('*')
            
            # Apply filters
            if source_type:
                query = query.eq('source_type', source_type)
            
            if min_score:
                query = query.gte('total_score', min_score)
            
            if search_query:
                query = query.or_(f'title.ilike.%{search_query}%,description.ilike.%{search_query}%')
            
            # Apply pagination and ordering
            query = query.order('total_score', desc=True).order('posted_date', desc=True)
            
            # Get total count
            count_result = self.client.table('opportunities').select('id', count='exact').execute()
            total_count = count_result.count if hasattr(count_result, 'count') else 0
            
            # Get paginated results
            query = query.range(offset, offset + limit - 1)
            result = query.execute()
            
            return {
                'opportunities': result.data,
                'total': total_count,
                'page': offset // limit + 1,
                'limit': limit,
                'has_more': offset + limit < total_count
            }
            
        except Exception as e:
            logger.error(f"Failed to get opportunities: {e}")
            return {
                'opportunities': [],
                'total': 0,
                'page': 1,
                'limit': limit,
                'has_more': False,
                'error': str(e)
            }
    
    def get_opportunity_stats(self) -> Dict:
        """Get opportunity statistics"""
        try:
            # Get total count
            total_result = self.client.table('opportunities').select('id', count='exact').execute()
            total_opportunities = total_result.count if hasattr(total_result, 'count') else 0
            
            # Get active count (not expired)
            active_result = self.client.table('opportunities').select('id', count='exact').gte('due_date', datetime.now().isoformat()).execute()
            active_opportunities = active_result.count if hasattr(active_result, 'count') else 0
            
            # Get total value
            value_result = self.client.table('opportunities').select('estimated_value').execute()
            total_value = sum(float(opp.get('estimated_value', 0) or 0) for opp in value_result.data)
            
            # Get average score
            score_result = self.client.table('opportunities').select('total_score').execute()
            scores = [float(opp.get('total_score', 0) or 0) for opp in score_result.data]
            avg_score = sum(scores) / len(scores) if scores else 0
            
            # Get by type
            type_result = self.client.table('opportunities').select('source_type').execute()
            by_type = {}
            for opp in type_result.data:
                source_type = opp.get('source_type', 'unknown')
                by_type[source_type] = by_type.get(source_type, 0) + 1
            
            # Get by agency
            agency_result = self.client.table('opportunities').select('agency_name').execute()
            by_agency = {}
            for opp in agency_result.data:
                agency = opp.get('agency_name', 'Unknown')
                by_agency[agency] = by_agency.get(agency, 0) + 1
            
            return {
                'total_opportunities': total_opportunities,
                'active_opportunities': active_opportunities,
                'total_value': total_value,
                'avg_score': round(avg_score, 1),
                'by_type': by_type,
                'by_agency': dict(list(by_agency.items())[:10])  # Top 10 agencies
            }
            
        except Exception as e:
            logger.error(f"Failed to get opportunity stats: {e}")
            return {
                'total_opportunities': 0,
                'active_opportunities': 0,
                'total_value': 0,
                'avg_score': 0,
                'by_type': {},
                'by_agency': {},
                'error': str(e)
            }
    
    # ========================================
    # SYNC STATUS MANAGEMENT
    # ========================================
    
    def get_sync_status(self) -> Dict:
        """Get synchronization status for all data sources"""
        try:
            # Get all data sources
            sources_result = self.client.table('data_sources').select('*').execute()
            sources = {source['name']: source for source in sources_result.data}
            
            # Get recent sync logs (last 24 hours)
            since = (datetime.now() - timedelta(hours=24)).isoformat()
            logs_result = self.client.table('sync_logs').select('*').gte('started_at', since).order('started_at', desc=True).execute()
            
            # Group logs by source
            logs_by_source = {}
            for log in logs_result.data:
                source_name = log['source_name']
                if source_name not in logs_by_source:
                    logs_by_source[source_name] = []
                logs_by_source[source_name].append(log)
            
            # Calculate totals from recent syncs
            total_processed = sum(log.get('records_processed', 0) for log in logs_result.data)
            total_added = sum(log.get('records_added', 0) for log in logs_result.data)
            
            # Build status for each source
            source_statuses = {}
            for source_name, source_data in sources.items():
                recent_logs = logs_by_source.get(source_name, [])
                latest_log = recent_logs[0] if recent_logs else None
                
                if latest_log:
                    status = 'completed' if latest_log.get('completed_at') and not latest_log.get('error_message') else 'failed'
                    last_sync = latest_log.get('completed_at') or latest_log.get('started_at')
                    records_processed = latest_log.get('records_processed', 0)
                    records_added = latest_log.get('records_added', 0)
                    records_updated = latest_log.get('records_updated', 0)
                else:
                    status = 'available'
                    last_sync = source_data.get('last_sync_at')
                    records_processed = 0
                    records_added = 0
                    records_updated = 0
                
                source_statuses[source_name.lower().replace('.', '_')] = {
                    'status': status,
                    'last_sync': last_sync,
                    'records_processed': records_processed,
                    'records_added': records_added,
                    'records_updated': records_updated
                }
            
            return {
                'status': 'ready',
                'total_sources': len(sources),
                'active_sources': len([s for s in sources.values() if s['is_active']]),
                'last_sync_total_processed': total_processed,
                'last_sync_total_added': total_added,
                'sources': source_statuses,
                'recent_syncs': logs_result.data[:10]  # Last 10 sync attempts
            }
            
        except Exception as e:
            logger.error(f"Failed to get sync status: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'total_sources': 0,
                'active_sources': 0,
                'last_sync_total_processed': 0,
                'last_sync_total_added': 0,
                'sources': {},
                'recent_syncs': []
            }
    
    # ========================================
    # SOURCE ROTATION MANAGEMENT
    # ========================================
    
    def get_next_source_to_sync(self) -> Optional[Dict]:
        """Get the next data source that should be synced based on rotation logic"""
        try:
            # Get all active sources ordered by last sync time (oldest first)
            result = self.client.table('data_sources').select('*').eq('is_active', True).order('last_sync_at', desc=False).execute()
            
            if not result.data:
                return None
            
            # Find the source that hasn't been synced in the longest time
            now = datetime.now()
            best_source = None
            max_time_since_sync = timedelta(0)
            
            for source in result.data:
                # Calculate time since last sync
                if source['last_sync_at']:
                    last_sync = datetime.fromisoformat(source['last_sync_at'].replace('Z', '+00:00'))
                    time_since_sync = now - last_sync.replace(tzinfo=None)
                else:
                    time_since_sync = timedelta(days=999)  # Never synced
                
                # Check rate limiting
                min_interval = timedelta(hours=1)  # Minimum 1 hour between syncs
                if source.get('rate_limit_per_hour'):
                    min_interval = timedelta(hours=1) if source['rate_limit_per_hour'] >= 100 else timedelta(hours=2)
                
                # Skip if synced too recently
                if time_since_sync < min_interval:
                    continue
                
                # Select source with longest time since sync
                if time_since_sync > max_time_since_sync:
                    max_time_since_sync = time_since_sync
                    best_source = source
            
            return best_source
            
        except Exception as e:
            logger.error(f"Failed to get next source to sync: {e}")
            return None
    
    def should_run_background_sync(self) -> bool:
        """Check if background sync should run based on schedule and last sync times"""
        try:
            # Get the most recent sync log
            result = self.client.table('sync_logs').select('started_at').order('started_at', desc=True).limit(1).execute()
            
            if not result.data:
                return True  # No syncs yet, should run
            
            last_sync = datetime.fromisoformat(result.data[0]['started_at'].replace('Z', '+00:00'))
            time_since_last = datetime.now() - last_sync.replace(tzinfo=None)
            
            # Run background sync every 30 minutes
            return time_since_last > timedelta(minutes=30)
            
        except Exception as e:
            logger.error(f"Failed to check background sync schedule: {e}")
            return True  # Default to allowing sync on error
    
    # ========================================
    # PRIVATE HELPER METHODS
    # ========================================
    
    def _get_or_create_data_source(self, source_name: str) -> Dict:
        """Get or create a data source record"""
        try:
            # Try to get existing source
            result = self.client.table('data_sources').select('*').eq('name', source_name).execute()
            
            if result.data:
                return result.data[0]
            
            # Create new data source
            source_data = {
                'name': source_name,
                'type': self._infer_source_type(source_name),
                'is_active': True
            }
            
            result = self.client.table('data_sources').insert(source_data).execute()
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Failed to get or create data source {source_name}: {e}")
            # Return a default source if database fails
            return {
                'id': 1,
                'name': source_name,
                'type': 'unknown',
                'is_active': True
            }
    
    def _infer_source_type(self, source_name: str) -> str:
        """Infer source type from source name"""
        source_name_lower = source_name.lower()
        
        if 'grants' in source_name_lower:
            return 'federal_grant'
        elif 'sam' in source_name_lower:
            return 'federal_contract'
        elif 'spending' in source_name_lower:
            return 'federal_contract'
        elif 'firecrawl' in source_name_lower:
            return 'web_scraping'
        else:
            return 'unknown'
    
    def _prepare_opportunity_data(self, opp: Dict, data_source_id: int) -> Dict:
        """Prepare opportunity data for database insertion"""
        # Calculate scores
        relevance_score = self._calculate_relevance_score(opp)
        urgency_score = self._calculate_urgency_score(opp)
        value_score = self._calculate_value_score(opp)
        competition_score = self._calculate_competition_score(opp)
        total_score = relevance_score + urgency_score + value_score + competition_score
        
        # Extract keywords from title and description
        keywords = self._extract_keywords(opp.get('title', ''), opp.get('description', ''))
        
        return {
            'external_id': str(opp.get('id', '')),
            'title': opp.get('title', '')[:500],  # Truncate to fit database
            'description': opp.get('description', ''),
            'agency_name': opp.get('agency_name', '')[:200],
            'opportunity_number': opp.get('opportunity_number', '')[:100],
            'estimated_value': float(opp.get('estimated_value', 0)) if opp.get('estimated_value') else None,
            'posted_date': self._parse_date(opp.get('posted_date')),
            'due_date': self._parse_date(opp.get('due_date')),
            'status': opp.get('status', 'open')[:50],
            'source_type': opp.get('source_type', '')[:50],
            'source_name': opp.get('source_name', '')[:100],
            'source_url': opp.get('source_url', '')[:500],
            'location': opp.get('location', '')[:200],
            'contact_info': opp.get('contact_info', ''),
            'keywords': json.dumps(keywords),
            'relevance_score': relevance_score,
            'urgency_score': urgency_score,
            'value_score': value_score,
            'competition_score': competition_score,
            'total_score': total_score,
            'data_source_id': data_source_id
        }
    
    def _calculate_relevance_score(self, opp: Dict) -> int:
        """Calculate relevance score (0-25)"""
        score = 0
        title = opp.get('title', '').lower()
        description = opp.get('description', '').lower()
        
        # High-value keywords
        high_value_keywords = ['software', 'technology', 'digital', 'cloud', 'ai', 'data', 'cyber']
        for keyword in high_value_keywords:
            if keyword in title:
                score += 5
            elif keyword in description:
                score += 2
        
        return min(score, 25)
    
    def _calculate_urgency_score(self, opp: Dict) -> int:
        """Calculate urgency score based on due date (0-25)"""
        due_date = self._parse_date(opp.get('due_date'))
        if not due_date:
            return 10  # Default score if no due date
        
        days_until_due = (due_date - datetime.now()).days
        
        if days_until_due < 0:
            return 0  # Expired
        elif days_until_due <= 7:
            return 25  # Very urgent
        elif days_until_due <= 30:
            return 20  # Urgent
        elif days_until_due <= 90:
            return 15  # Moderate
        else:
            return 10  # Low urgency
    
    def _calculate_value_score(self, opp: Dict) -> int:
        """Calculate value score based on estimated value (0-25)"""
        value = opp.get('estimated_value')
        if not value:
            return 10  # Default score if no value
        
        try:
            value = float(value)
            if value >= 10000000:  # $10M+
                return 25
            elif value >= 1000000:  # $1M+
                return 20
            elif value >= 100000:  # $100K+
                return 15
            elif value >= 10000:  # $10K+
                return 10
            else:
                return 5
        except:
            return 10
    
    def _calculate_competition_score(self, opp: Dict) -> int:
        """Calculate competition score - higher for less competitive (0-25)"""
        # For now, use source type as proxy for competition
        source_type = opp.get('source_type', '').lower()
        
        if 'grant' in source_type:
            return 20  # Grants often less competitive
        elif 'federal' in source_type:
            return 15  # Federal contracts moderately competitive
        elif 'state' in source_type:
            return 18  # State contracts slightly less competitive
        elif 'private' in source_type:
            return 10  # Private sector very competitive
        else:
            return 15  # Default
    
    def _extract_keywords(self, title: str, description: str) -> List[str]:
        """Extract relevant keywords from title and description"""
        import re
        
        text = f"{title} {description}".lower()
        
        # Common keywords to extract
        keyword_patterns = [
            r'\b(software|hardware|technology|digital|cloud|ai|ml|data|cyber|security)\b',
            r'\b(development|implementation|integration|modernization|upgrade)\b',
            r'\b(consulting|services|support|maintenance|training)\b',
            r'\b(federal|state|local|government|agency)\b'
        ]
        
        keywords = []
        for pattern in keyword_patterns:
            matches = re.findall(pattern, text)
            keywords.extend(matches)
        
        return list(set(keywords))  # Remove duplicates
    
    def _parse_date(self, date_str) -> Optional[datetime]:
        """Parse date string to datetime object"""
        if not date_str:
            return None
        
        try:
            # Try different date formats
            formats = [
                '%Y-%m-%d',
                '%Y-%m-%dT%H:%M:%S',
                '%Y-%m-%dT%H:%M:%SZ',
                '%Y-%m-%dT%H:%M:%S.%f',
                '%Y-%m-%dT%H:%M:%S.%fZ',
                '%m/%d/%Y',
                '%d/%m/%Y'
            ]
            
            for fmt in formats:
                try:
                    return datetime.strptime(str(date_str).replace('Z', ''), fmt)
                except ValueError:
                    continue
            
            return None
        except:
            return None
    
    def _update_data_source_sync_time(self, data_source_id: int):
        """Update the last sync time for a data source"""
        try:
            self.client.table('data_sources').update({
                'last_sync_at': datetime.now().isoformat()
            }).eq('id', data_source_id).execute()
        except Exception as e:
            logger.error(f"Failed to update data source sync time: {e}")
    
    def _log_sync_result(self, sync_result: SyncResult):
        """Log sync result to database"""
        try:
            log_data = {
                'source_name': sync_result.source_name,
                'sync_type': 'api_fetch',
                'records_processed': sync_result.records_processed,
                'records_added': sync_result.records_added,
                'records_updated': sync_result.records_updated,
                'records_failed': sync_result.records_failed,
                'error_message': sync_result.error_message,
                'sync_duration_ms': sync_result.sync_duration_ms,
                'started_at': datetime.now().isoformat(),
                'completed_at': datetime.now().isoformat() if sync_result.success else None
            }
            
            self.client.table('sync_logs').insert(log_data).execute()
            
        except Exception as e:
            logger.error(f"Failed to log sync result: {e}")

# Global instance
database_service = DatabaseService()

def get_database_service() -> DatabaseService:
    """Get the database service instance"""
    return database_service