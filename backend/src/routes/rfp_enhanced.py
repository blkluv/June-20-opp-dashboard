"""
Enhanced RFP routes for advanced functionality
"""
import asyncio
import os
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import logging

# Import the enhanced pipeline
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from rfp_integration_hub import EnhancedRFPPipeline

logger = logging.getLogger(__name__)

rfp_enhanced_bp = Blueprint('rfp_enhanced', __name__)

# Initialize pipeline
pipeline = None

def get_pipeline():
    """Get or create pipeline instance"""
    global pipeline
    if pipeline is None:
        pipeline = EnhancedRFPPipeline()
    return pipeline

@rfp_enhanced_bp.route('/rfp/sync', methods=['POST'])
def sync_rfp_sources():
    """Sync from all RFP sources"""
    try:
        pip = get_pipeline()
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results = loop.run_until_complete(pip.sync_all_sources())
        loop.close()
        
        return jsonify({
            'success': True,
            'synced': results,
            'total': sum(results.values()),
            'message': f"Synced {sum(results.values())} opportunities from {len(results)} sources"
        })
    except Exception as e:
        logger.error(f"RFP sync failed: {e}")
        return jsonify({'error': str(e)}), 500

@rfp_enhanced_bp.route('/rfp/search', methods=['POST'])
def search_rfps():
    """Enhanced search with filters"""
    try:
        pip = get_pipeline()
        filters = request.get_json() or {}
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results = loop.run_until_complete(pip.search_opportunities(filters))
        loop.close()
        
        return jsonify({
            'opportunities': results,
            'total': len(results),
            'filters_applied': filters
        })
    except Exception as e:
        logger.error(f"RFP search failed: {e}")
        return jsonify({'error': str(e)}), 500

@rfp_enhanced_bp.route('/rfp/track', methods=['POST'])
def track_rfp():
    """Track an RFP opportunity"""
    try:
        pip = get_pipeline()
        data = request.get_json()
        
        if not data.get('opportunity_id'):
            return jsonify({'error': 'opportunity_id is required'}), 400
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(pip.track_opportunity(
            user_id=data.get('user_id', 'anonymous'),
            opportunity_id=data.get('opportunity_id'),
            notes=data.get('notes')
        ))
        loop.close()
        
        return jsonify({
            'success': True,
            'tracking': result,
            'message': 'Opportunity tracked successfully'
        })
    except Exception as e:
        logger.error(f"RFP tracking failed: {e}")
        return jsonify({'error': str(e)}), 500

@rfp_enhanced_bp.route('/rfp/tracked/<user_id>')
def get_tracked_rfps(user_id):
    """Get tracked RFPs for a user"""
    try:
        pip = get_pipeline()
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results = loop.run_until_complete(pip.get_tracked_opportunities(user_id))
        loop.close()
        
        return jsonify({
            'tracked': results,
            'total': len(results),
            'user_id': user_id
        })
    except Exception as e:
        logger.error(f"Get tracked RFPs failed: {e}")
        return jsonify({'error': str(e)}), 500

@rfp_enhanced_bp.route('/rfp/save-search', methods=['POST'])
def save_search():
    """Save a search for notifications"""
    try:
        pip = get_pipeline()
        data = request.get_json()
        
        if not data.get('name') or not data.get('search_params'):
            return jsonify({'error': 'name and search_params are required'}), 400
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(pip.save_search(
            user_id=data.get('user_id', 'anonymous'),
            name=data.get('name'),
            params=data.get('search_params')
        ))
        loop.close()
        
        return jsonify({
            'success': True,
            'saved_search': result,
            'message': 'Search saved successfully'
        })
    except Exception as e:
        logger.error(f"Save search failed: {e}")
        return jsonify({'error': str(e)}), 500

@rfp_enhanced_bp.route('/rfp/stats')
def get_rfp_stats():
    """Get enhanced RFP statistics"""
    try:
        pip = get_pipeline()
        
        # Run async function to get recent opportunities
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        recent_opportunities = loop.run_until_complete(pip.search_opportunities({
            'posted_after': (datetime.now() - timedelta(days=30)).isoformat(),
            'limit': 1000
        }))
        loop.close()
        
        # Calculate stats
        total_opportunities = len(recent_opportunities)
        high_value_count = len([o for o in recent_opportunities if o.get('estimated_value', 0) > 1000000])
        high_score_count = len([o for o in recent_opportunities if o.get('relevance_score', 0) > 0.8])
        
        # Group by source
        source_counts = {}
        for opp in recent_opportunities:
            source = opp.get('source_name', 'Unknown')
            source_counts[source] = source_counts.get(source, 0) + 1
        
        # Group by agency
        agency_counts = {}
        for opp in recent_opportunities:
            agency = opp.get('agency_name', 'Unknown')
            agency_counts[agency] = agency_counts.get(agency, 0) + 1
        
        return jsonify({
            'total_opportunities': total_opportunities,
            'high_value_opportunities': high_value_count,
            'high_score_opportunities': high_score_count,
            'by_source': source_counts,
            'by_agency': dict(list(agency_counts.items())[:10]),  # Top 10 agencies
            'period': '30 days'
        })
    except Exception as e:
        logger.error(f"RFP stats failed: {e}")
        return jsonify({'error': str(e)}), 500

@rfp_enhanced_bp.route('/rfp/sources')
def get_rfp_sources():
    """Get available RFP sources and their status"""
    try:
        # Check which API keys are available
        sources = [
            {
                'name': 'USASpending.gov',
                'status': 'active',
                'type': 'federal_contracts',
                'description': 'Federal contract awards data'
            }
        ]
        
        if os.getenv('SAM_GOV_API_KEY'):
            sources.append({
                'name': 'SAM.gov',
                'status': 'active',
                'type': 'government_rfps',
                'description': 'Government RFPs and solicitations'
            })
        else:
            sources.append({
                'name': 'SAM.gov',
                'status': 'inactive',
                'type': 'government_rfps',
                'description': 'Government RFPs and solicitations (API key required)'
            })
        
        return jsonify({
            'sources': sources,
            'total': len(sources),
            'active': len([s for s in sources if s['status'] == 'active'])
        })
    except Exception as e:
        logger.error(f"Get RFP sources failed: {e}")
        return jsonify({'error': str(e)}), 500