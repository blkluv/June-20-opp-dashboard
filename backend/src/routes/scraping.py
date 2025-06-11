from flask import Blueprint, request, jsonify
from src.services.data_sync_service import DataSyncService
import logging

scraping_bp = Blueprint('scraping', __name__)
logger = logging.getLogger(__name__)


@scraping_bp.route('/scraping/sources', methods=['GET'])
def get_scraping_sources():
    """Get available scraping sources"""
    try:
        sync_service = DataSyncService()
        
        if not sync_service.firecrawl_service:
            return jsonify({
                'error': 'Firecrawl service not available. Please set FIRECRAWL_API_KEY environment variable.'
            }), 503
        
        sources = sync_service.firecrawl_service.get_available_sources()
        
        return jsonify({
            'sources': sources,
            'total': len(sources)
        })
        
    except Exception as e:
        logger.error(f"Error fetching scraping sources: {str(e)}")
        return jsonify({'error': 'Failed to fetch scraping sources'}), 500


@scraping_bp.route('/scraping/scrape-source', methods=['POST'])
def scrape_source():
    """Scrape a predefined source for opportunities"""
    try:
        data = request.get_json()
        
        if not data or 'source_key' not in data:
            return jsonify({'error': 'source_key is required'}), 400
        
        source_key = data['source_key']
        
        sync_service = DataSyncService()
        
        if not sync_service.firecrawl_service:
            return jsonify({
                'error': 'Firecrawl service not available. Please set FIRECRAWL_API_KEY environment variable.'
            }), 503
        
        # Scrape the source
        result = sync_service.sync_scraping_source(source_key, f"firecrawl_{source_key}")
        
        return jsonify({
            'message': f'Successfully scraped {source_key}',
            'result': result
        })
        
    except Exception as e:
        logger.error(f"Error scraping source: {str(e)}")
        return jsonify({'error': f'Failed to scrape source: {str(e)}'}), 500


@scraping_bp.route('/scraping/scrape-url', methods=['POST'])
def scrape_custom_url():
    """Scrape a custom URL for opportunities"""
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'url is required'}), 400
        
        url = data['url']
        source_name = data.get('source_name', 'Custom')
        
        sync_service = DataSyncService()
        result = sync_service.scrape_custom_url(url, source_name)
        
        if result['success']:
            return jsonify({
                'message': f'Successfully scraped {url}',
                'result': result
            })
        else:
            return jsonify({
                'error': result.get('error', 'Scraping failed')
            }), 400
        
    except Exception as e:
        logger.error(f"Error scraping custom URL: {str(e)}")
        return jsonify({'error': f'Failed to scrape URL: {str(e)}'}), 500


@scraping_bp.route('/scraping/sync-all', methods=['POST'])
def sync_all_scraping():
    """Sync all scraping sources"""
    try:
        sync_service = DataSyncService()
        
        if not sync_service.firecrawl_service:
            return jsonify({
                'error': 'Firecrawl service not available. Please set FIRECRAWL_API_KEY environment variable.'
            }), 503
        
        results = sync_service.sync_scraping_sources()
        
        return jsonify({
            'message': 'Scraping synchronization completed',
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Error during scraping sync: {str(e)}")
        return jsonify({'error': 'Failed to synchronize scraping sources'}), 500


@scraping_bp.route('/scraping/test', methods=['POST'])
def test_firecrawl():
    """Test Firecrawl service with a simple URL"""
    try:
        data = request.get_json()
        test_url = data.get('url', 'https://example.com')
        
        sync_service = DataSyncService()
        
        if not sync_service.firecrawl_service:
            return jsonify({
                'error': 'Firecrawl service not available. Please set FIRECRAWL_API_KEY environment variable.'
            }), 503
        
        # Test scraping
        result = sync_service.firecrawl_service.firecrawl_client.scrape_url(test_url)
        
        return jsonify({
            'message': 'Firecrawl test completed',
            'test_url': test_url,
            'success': result.get('success', False),
            'has_content': bool(result.get('markdown', '')),
            'content_length': len(result.get('markdown', '')),
            'metadata': result.get('metadata', {})
        })
        
    except Exception as e:
        logger.error(f"Error testing Firecrawl: {str(e)}")
        return jsonify({'error': f'Firecrawl test failed: {str(e)}'}), 500

