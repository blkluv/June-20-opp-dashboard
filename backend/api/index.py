import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

try:
    from flask import Flask, jsonify
    from flask_cors import CORS
    
    # Create Flask app
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Enable CORS for all routes
    CORS(app, origins=['*'])
    
    # Basic health check route
    @app.route('/api')
    @app.route('/api/')
    def index():
        return jsonify({
            'message': 'Opportunity Dashboard API',
            'version': '1.0.0',
            'status': 'healthy',
            'endpoints': [
                '/api/health',
                '/api/opportunities',
                '/api/sync/status'
            ]
        })
    
    @app.route('/api/health')
    def health():
        return jsonify({
            'status': 'healthy',
            'service': 'opportunity-dashboard-backend',
            'timestamp': '2025-06-11',
            'database': 'sqlite-memory'
        })
    
    # Sync status endpoint (simplified)
    @app.route('/api/sync/status')
    def sync_status():
        return jsonify({
            'status': 'ready',
            'sources': {
                'grants_gov': {'status': 'available', 'last_sync': None},
                'usa_spending': {'status': 'available', 'last_sync': None},
                'sam_gov': {'status': 'requires_api_key', 'last_sync': None}
            },
            'total_opportunities': 0,
            'message': 'API is working - database features coming online soon'
        })
    
    # Simple sync trigger (returns success for now)
    @app.route('/api/sync', methods=['POST'])
    def trigger_sync():
        return jsonify({
            'success': True,
            'message': 'Sync functionality is being activated',
            'status': 'Backend API is working correctly',
            'next_steps': 'Database integration in progress'
        })
    
    # Sample opportunities endpoint
    @app.route('/api/opportunities')
    def get_opportunities():
        # Return sample data for now
        sample_opportunities = [
            {
                'id': 1,
                'title': 'Sample Federal Contract Opportunity',
                'description': 'This is sample data. Real data will be available once sync is configured.',
                'agency_name': 'Department of Defense',
                'estimated_value': 1000000,
                'due_date': '2025-07-15',
                'status': 'active',
                'source_type': 'federal_contract',
                'total_score': 85
            },
            {
                'id': 2,
                'title': 'Sample Federal Grant',
                'description': 'This is sample data. Connect real APIs to see live opportunities.',
                'agency_name': 'National Science Foundation',
                'estimated_value': 500000,
                'due_date': '2025-08-01',
                'status': 'active',
                'source_type': 'federal_grant',
                'total_score': 78
            }
        ]
        
        return jsonify({
            'opportunities': sample_opportunities,
            'total': len(sample_opportunities),
            'message': 'Sample data - API is working correctly'
        })

    # Vercel serverless function handler
    def handler(event, context):
        from werkzeug.serving import WSGIRequestHandler
        return app(event, context)

except Exception as e:
    # If there's an import error, create a minimal response
    from flask import Flask, jsonify
    
    app = Flask(__name__)
    
    @app.route('/api')
    @app.route('/api/health')
    def error_response():
        return jsonify({
            'status': 'error',
            'message': f'Backend initialization error: {str(e)}',
            'error_type': type(e).__name__
        }), 500

# Export for Vercel
app = app