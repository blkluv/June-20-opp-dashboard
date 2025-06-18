#!/usr/bin/env python3
"""
Enhanced RFP Data Integration Hub for Opportunity Dashboard
Integrates with existing Supabase setup and adds advanced features
"""

import os
import asyncio
import aiohttp
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from urllib.parse import urlencode
import logging
from supabase import create_client, Client
import hashlib

# Import existing config
import sys
sys.path.insert(0, os.path.dirname(__file__))
from src.config.supabase import get_supabase_admin_client

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==============================================================================
# ENHANCED SCHEMA (EXTENDS EXISTING)
# ==============================================================================

ENHANCED_SCHEMA = """
-- Extend existing opportunities table with RFP-specific fields
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]'::jsonb;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS naics_codes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS set_asides JSONB DEFAULT '[]'::jsonb;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS intelligence JSONB DEFAULT '{}'::jsonb;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS relevance_score FLOAT DEFAULT 0.5;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS data_quality_score FLOAT DEFAULT 0.5;

-- Rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    api_name TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(api_name, timestamp)
);

-- Saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    search_params JSONB NOT NULL,
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunity tracking table
CREATE TABLE IF NOT EXISTS opportunity_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    opportunity_id INTEGER REFERENCES opportunities(id),
    status TEXT DEFAULT 'reviewing',
    notes TEXT,
    bid_decision BOOLEAN,
    team_members JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_relevance ON opportunities(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_categories ON opportunities USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_opportunities_naics ON opportunities USING GIN(naics_codes);

-- Enable real-time if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE opportunity_tracking;

-- Functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_tracking_updated_at BEFORE UPDATE ON opportunity_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
"""

# ==============================================================================
# DATA MODELS
# ==============================================================================

@dataclass
class EnhancedOpportunity:
    """Enhanced opportunity data model"""
    external_id: str
    title: str
    description: str
    agency_name: str
    source_type: str
    source_name: str
    source_url: Optional[str] = None
    opportunity_number: Optional[str] = None
    estimated_value: Optional[float] = None
    posted_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    categories: List[str] = None
    naics_codes: List[str] = None
    set_asides: List[str] = None
    attachments: List[Dict[str, Any]] = None
    contacts: List[Dict[str, Any]] = None
    relevance_score: float = 0.5
    data_quality_score: float = 0.5
    total_score: int = 50
    intelligence: Optional[Dict[str, Any]] = None
    status: str = 'open'

    def __post_init__(self):
        if self.categories is None:
            self.categories = []
        if self.naics_codes is None:
            self.naics_codes = []
        if self.set_asides is None:
            self.set_asides = []
        if self.attachments is None:
            self.attachments = []
        if self.contacts is None:
            self.contacts = []

# ==============================================================================
# RATE LIMITER
# ==============================================================================

class SupabaseRateLimiter:
    """Supabase-based rate limiter"""
    
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
    
    async def acquire(self, api_name: str, max_calls: int, window_seconds: int) -> bool:
        """Check if we can make an API call within rate limits"""
        try:
            # Clean old entries
            cutoff_time = (datetime.now() - timedelta(seconds=window_seconds)).isoformat()
            self.supabase.table('rate_limits').delete().lt('timestamp', cutoff_time).execute()
            
            # Count recent calls
            result = self.supabase.table('rate_limits')\
                .select('id', count='exact')\
                .eq('api_name', api_name)\
                .gte('timestamp', cutoff_time)\
                .execute()
            
            if result.count < max_calls:
                # Add new entry
                self.supabase.table('rate_limits').insert({
                    'api_name': api_name,
                    'timestamp': datetime.now().isoformat()
                }).execute()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Rate limiter error: {e}")
            return True  # Allow request on error
    
    async def wait_if_needed(self, api_name: str, max_calls: int, window_seconds: int):
        """Wait if rate limit exceeded"""
        while not await self.acquire(api_name, max_calls, window_seconds):
            logger.info(f"Rate limit hit for {api_name}, waiting...")
            await asyncio.sleep(1)

# ==============================================================================
# SAM.GOV API CLIENT
# ==============================================================================

class SAMGovClient:
    """SAM.gov Opportunities API client"""
    
    def __init__(self, api_key: str, rate_limiter: SupabaseRateLimiter):
        self.api_key = api_key
        self.base_url = "https://api.sam.gov"
        self.rate_limiter = rate_limiter
    
    async def fetch_opportunities(self, limit: int = 100) -> List[EnhancedOpportunity]:
        """Fetch opportunities from SAM.gov"""
        await self.rate_limiter.wait_if_needed('sam_gov', 5, 60)  # 5 calls per minute
        
        url = f"{self.base_url}/opportunities/v2/search"
        params = {
            'limit': limit,
            'api_key': self.api_key,
            'postedFrom': (datetime.now() - timedelta(days=30)).strftime('%m/%d/%Y'),
            'postedTo': datetime.now().strftime('%m/%d/%Y')
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    response.raise_for_status()
                    data = await response.json()
                    
                    opportunities = []
                    for item in data.get('opportunitiesData', []):
                        opp = self._parse_sam_opportunity(item)
                        if opp:
                            opportunities.append(opp)
                    
                    logger.info(f"Fetched {len(opportunities)} opportunities from SAM.gov")
                    return opportunities
                    
        except Exception as e:
            logger.error(f"SAM.gov fetch failed: {e}")
            return []
    
    def _parse_sam_opportunity(self, data: Dict[str, Any]) -> Optional[EnhancedOpportunity]:
        """Parse SAM.gov opportunity data"""
        try:
            return EnhancedOpportunity(
                external_id=f"sam-{data.get('noticeId', '')}",
                title=data.get('title', ''),
                description=data.get('description', ''),
                agency_name=data.get('departmentName', ''),
                source_type='government_rfp',
                source_name='SAM.gov',
                source_url=f"https://sam.gov/opp/{data.get('noticeId', '')}",
                opportunity_number=data.get('solicitationNumber', ''),
                posted_date=self._parse_date(data.get('postedDate')),
                due_date=self._parse_date(data.get('responseDate')),
                categories=data.get('classificationCode', '').split(',') if data.get('classificationCode') else [],
                naics_codes=[data.get('naicsCode')] if data.get('naicsCode') else [],
                set_asides=data.get('typeOfSetAsideDescription', '').split(',') if data.get('typeOfSetAsideDescription') else [],
                relevance_score=0.8,  # SAM.gov data is high quality
                data_quality_score=0.9,
                total_score=85
            )
        except Exception as e:
            logger.error(f"Failed to parse SAM opportunity: {e}")
            return None
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string"""
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, '%Y-%m-%d')
        except:
            try:
                return datetime.strptime(date_str[:10], '%Y-%m-%d')
            except:
                return None

# ==============================================================================
# ENHANCED PIPELINE
# ==============================================================================

class EnhancedRFPPipeline:
    """Enhanced RFP pipeline with existing integration"""
    
    def __init__(self):
        self.supabase = get_supabase_admin_client()
        self.rate_limiter = SupabaseRateLimiter(self.supabase)
        
        # Initialize API clients
        self.clients = []
        
        # Add SAM.gov client if API key available
        sam_api_key = os.getenv('SAM_GOV_API_KEY')
        if sam_api_key:
            self.clients.append(SAMGovClient(sam_api_key, self.rate_limiter))
            logger.info("SAM.gov client initialized")
        else:
            logger.warning("SAM.gov API key not found")
    
    async def setup_schema(self):
        """Set up enhanced schema"""
        try:
            # Execute schema updates
            # Note: This would typically be done via Supabase migrations
            logger.info("Enhanced schema setup would be applied via Supabase migrations")
            return True
        except Exception as e:
            logger.error(f"Schema setup failed: {e}")
            return False
    
    async def sync_all_sources(self) -> Dict[str, int]:
        """Sync from all configured sources"""
        results = {}
        
        for client in self.clients:
            client_name = type(client).__name__
            try:
                opportunities = await client.fetch_opportunities()
                saved_count = await self.save_opportunities(opportunities)
                results[client_name] = saved_count
                logger.info(f"{client_name}: {saved_count} opportunities saved")
            except Exception as e:
                logger.error(f"{client_name} sync failed: {e}")
                results[client_name] = 0
        
        return results
    
    async def save_opportunities(self, opportunities: List[EnhancedOpportunity]) -> int:
        """Save opportunities to Supabase"""
        saved_count = 0
        
        for opp in opportunities:
            try:
                # Check if already exists
                existing = self.supabase.table('opportunities')\
                    .select('id')\
                    .eq('external_id', opp.external_id)\
                    .execute()
                
                if existing.data:
                    logger.debug(f"Skipping existing opportunity: {opp.external_id}")
                    continue
                
                # Prepare data for insertion
                opp_data = {
                    'external_id': opp.external_id,
                    'title': opp.title,
                    'description': opp.description,
                    'agency_name': opp.agency_name,
                    'source_type': opp.source_type,
                    'source_name': opp.source_name,
                    'source_url': opp.source_url,
                    'opportunity_number': opp.opportunity_number,
                    'estimated_value': opp.estimated_value,
                    'posted_date': opp.posted_date.isoformat() if opp.posted_date else None,
                    'due_date': opp.due_date.isoformat() if opp.due_date else None,
                    'categories': opp.categories,
                    'naics_codes': opp.naics_codes,
                    'set_asides': opp.set_asides,
                    'attachments': opp.attachments,
                    'contacts': opp.contacts,
                    'relevance_score': opp.relevance_score,
                    'data_quality_score': opp.data_quality_score,
                    'total_score': opp.total_score,
                    'intelligence': opp.intelligence or {},
                    'status': opp.status
                }
                
                # Insert opportunity
                result = self.supabase.table('opportunities').insert(opp_data).execute()
                saved_count += 1
                logger.debug(f"Saved: {opp.title[:50]}...")
                
            except Exception as e:
                logger.error(f"Failed to save opportunity {opp.external_id}: {e}")
        
        return saved_count
    
    async def search_opportunities(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Search opportunities with enhanced filters"""
        query = self.supabase.table('opportunities').select('*')
        
        # Apply filters
        if filters.get('agency_name'):
            query = query.ilike('agency_name', f"%{filters['agency_name']}%")
        
        if filters.get('posted_after'):
            query = query.gte('posted_date', filters['posted_after'])
        
        if filters.get('due_before'):
            query = query.lte('due_date', filters['due_before'])
        
        if filters.get('min_relevance_score'):
            query = query.gte('relevance_score', filters['min_relevance_score'])
        
        if filters.get('categories'):
            # Search within JSONB array
            query = query.contains('categories', filters['categories'])
        
        if filters.get('naics_codes'):
            query = query.contains('naics_codes', filters['naics_codes'])
        
        if filters.get('min_value'):
            query = query.gte('estimated_value', filters['min_value'])
        
        if filters.get('max_value'):
            query = query.lte('estimated_value', filters['max_value'])
        
        # Order by relevance score
        query = query.order('relevance_score', desc=True)
        
        # Limit results
        if filters.get('limit'):
            query = query.limit(filters['limit'])
        
        result = query.execute()
        return result.data
    
    async def save_search(self, user_id: str, name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Save a search for notifications"""
        result = self.supabase.table('saved_searches').insert({
            'user_id': user_id,
            'name': name,
            'search_params': params,
            'notification_enabled': True
        }).execute()
        
        return result.data[0] if result.data else {}
    
    async def track_opportunity(self, user_id: str, opportunity_id: int, notes: str = None) -> Dict[str, Any]:
        """Track an opportunity for a user"""
        result = self.supabase.table('opportunity_tracking').insert({
            'user_id': user_id,
            'opportunity_id': opportunity_id,
            'status': 'reviewing',
            'notes': notes
        }).execute()
        
        return result.data[0] if result.data else {}
    
    async def get_tracked_opportunities(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all opportunities tracked by a user"""
        result = self.supabase.table('opportunity_tracking')\
            .select('*, opportunities(*)')\
            .eq('user_id', user_id)\
            .execute()
        
        return result.data

# ==============================================================================
# FLASK API EXTENSIONS
# ==============================================================================

def add_enhanced_routes(app):
    """Add enhanced API routes to existing Flask app"""
    from flask import request, jsonify
    
    pipeline = EnhancedRFPPipeline()
    
    @app.route('/api/rfp/sync', methods=['POST'])
    async def sync_rfp_sources():
        """Sync from all RFP sources"""
        try:
            results = await pipeline.sync_all_sources()
            return jsonify({
                'success': True,
                'synced': results,
                'total': sum(results.values())
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/rfp/search', methods=['POST'])
    async def search_rfps():
        """Enhanced search with filters"""
        try:
            filters = request.get_json() or {}
            results = await pipeline.search_opportunities(filters)
            return jsonify({
                'opportunities': results,
                'total': len(results)
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/rfp/track', methods=['POST'])
    async def track_rfp():
        """Track an RFP opportunity"""
        try:
            data = request.get_json()
            result = await pipeline.track_opportunity(
                user_id=data.get('user_id', 'anonymous'),
                opportunity_id=data.get('opportunity_id'),
                notes=data.get('notes')
            )
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/rfp/tracked/<user_id>')
    async def get_tracked_rfps(user_id):
        """Get tracked RFPs for a user"""
        try:
            results = await pipeline.get_tracked_opportunities(user_id)
            return jsonify({'tracked': results})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================

async def main():
    """Test the enhanced pipeline"""
    print("=" * 60)
    print("Enhanced RFP Integration Hub")
    print("=" * 60)
    
    try:
        pipeline = EnhancedRFPPipeline()
        
        # Set up schema
        await pipeline.setup_schema()
        
        # Test sync (if SAM.gov key available)
        if os.getenv('SAM_GOV_API_KEY'):
            print("\nSyncing from SAM.gov...")
            results = await pipeline.sync_all_sources()
            print(f"Sync results: {results}")
        else:
            print("\nSAM.gov API key not available - skipping sync test")
        
        # Test search
        print("\nTesting enhanced search...")
        search_results = await pipeline.search_opportunities({
            'min_relevance_score': 0.7,
            'limit': 5
        })
        print(f"Found {len(search_results)} high-relevance opportunities")
        
        for opp in search_results:
            score = opp.get('relevance_score', 0)
            value = opp.get('estimated_value', 0)
            print(f"- {opp['title'][:50]}... (Score: {score:.2f}, Value: ${value:,.0f})")
        
        print("\n✅ Enhanced pipeline test complete!")
        
    except Exception as e:
        print(f"❌ Pipeline test failed: {e}")

if __name__ == '__main__':
    asyncio.run(main())