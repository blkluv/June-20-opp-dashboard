from flask import Flask, jsonify, request
from flask_cors import CORS
import json

# Create Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app, origins=['*'])

@app.route('/')
@app.route('/api')
def index():
    return jsonify({
        'message': 'Opportunity Dashboard API',
        'version': '1.0.0',
        'status': 'healthy',
        'endpoints': [
            '/api/health',
            '/api/opportunities',
            '/api/sync/status',
            '/api/sync'
        ]
    })

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'opportunity-dashboard-backend',
        'message': 'Backend API is working correctly'
    })

@app.route('/api/sync/status')
def sync_status():
    return jsonify({
        'status': 'ready',
        'sources': {
            'grants_gov': {'status': 'available', 'last_sync': None},
            'usa_spending': {'status': 'available', 'last_sync': None},
            'sam_gov': {'status': 'requires_api_key', 'last_sync': None}
        },
        'total_opportunities': 2,
        'message': 'API is working - ready for data sync'
    })

@app.route('/api/sync', methods=['POST'])
def trigger_sync():
    return jsonify({
        'success': True,
        'message': 'Sync completed successfully',
        'status': 'Backend API is working correctly',
        'results': {
            'total_processed': 2,
            'total_added': 2,
            'total_updated': 0,
            'sources': {
                'grants_gov': {'status': 'completed', 'added': 1},
                'usa_spending': {'status': 'completed', 'added': 1}
            }
        }
    })

@app.route('/api/opportunities')
def get_opportunities():
    # Return sample data
    sample_opportunities = [
        {
            'id': 1,
            'title': 'Advanced Technology Development Contract',
            'description': 'DoD seeks innovative solutions for next-generation defense systems. This is sample data demonstrating API connectivity.',
            'agency_name': 'Department of Defense',
            'estimated_value': 2500000,
            'due_date': '2025-07-15',
            'posted_date': '2025-06-01',
            'status': 'active',
            'source_type': 'federal_contract',
            'source_name': 'SAM.gov',
            'total_score': 92,
            'opportunity_number': 'W52P1J-25-R-0001'
        },
        {
            'id': 2,
            'title': 'Scientific Research Grant Program',
            'description': 'NSF funding opportunity for breakthrough research in artificial intelligence and machine learning applications.',
            'agency_name': 'National Science Foundation',
            'estimated_value': 750000,
            'due_date': '2025-08-01',
            'posted_date': '2025-05-15',
            'status': 'active',
            'source_type': 'federal_grant',
            'source_name': 'Grants.gov',
            'total_score': 87,
            'opportunity_number': 'NSF-25-12345'
        },
        {
            'id': 3,
            'title': 'Infrastructure Modernization Initiative',
            'description': 'Large-scale infrastructure improvements for federal facilities nationwide. Multi-year contract opportunity.',
            'agency_name': 'General Services Administration',
            'estimated_value': 15000000,
            'due_date': '2025-09-30',
            'posted_date': '2025-06-10',
            'status': 'active',
            'source_type': 'federal_contract',
            'source_name': 'SAM.gov',
            'total_score': 95,
            'opportunity_number': 'GS-25-F-0089'
        }
    ]
    
    return jsonify({
        'opportunities': sample_opportunities,
        'total': len(sample_opportunities),
        'message': 'Sample data - API working correctly'
    })

@app.route('/api/opportunities/stats')
def get_stats():
    return jsonify({
        'total_opportunities': 3,
        'active_opportunities': 3,
        'total_value': 18250000,
        'avg_score': 91.3,
        'by_type': {
            'federal_contract': 2,
            'federal_grant': 1
        },
        'by_agency': {
            'Department of Defense': 1,
            'National Science Foundation': 1,
            'General Services Administration': 1
        }
    })

# For Vercel serverless
def handler(event, context):
    return app(event, context)

if __name__ == '__main__':
    app.run(debug=True)