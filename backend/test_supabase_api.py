#!/usr/bin/env python3
"""
Test Supabase API endpoints
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify
from flask_cors import CORS
from src.config.supabase import get_supabase_admin_client

app = Flask(__name__)
CORS(app)

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'opportunity-dashboard-supabase',
        'message': 'Backend API with Supabase is working correctly'
    })

@app.route('/api/opportunities')
def get_opportunities():
    try:
        supabase = get_supabase_admin_client()
        response = supabase.table('opportunities').select('*').order('estimated_value', desc=True).execute()
        
        opportunities = []
        for opp in response.data:
            opportunities.append({
                'id': opp['external_id'] or str(opp['id']),
                'title': opp['title'],
                'description': opp['description'],
                'agency_name': opp['agency_name'],
                'estimated_value': float(opp['estimated_value']) if opp['estimated_value'] else None,
                'due_date': opp['due_date'],
                'posted_date': opp['posted_date'],
                'status': opp['status'],
                'source_type': opp['source_type'],
                'source_name': opp['source_name'],
                'total_score': opp['total_score'],
                'opportunity_number': opp['opportunity_number']
            })
        
        return jsonify({
            'opportunities': opportunities,
            'total': len(opportunities),
            'message': f'Live data from Supabase PostgreSQL - {len(opportunities)} opportunities'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/opportunities/stats')
def get_stats():
    try:
        supabase = get_supabase_admin_client()
        response = supabase.table('opportunities').select('*').execute()
        
        opportunities = response.data
        total_value = sum(float(opp.get('estimated_value', 0)) for opp in opportunities if opp.get('estimated_value'))
        
        stats = {
            'total_opportunities': len(opportunities),
            'total_value': total_value,
            'average_value': total_value / len(opportunities) if opportunities else 0,
            'source_breakdown': {},
            'agency_breakdown': {}
        }
        
        # Count by source
        for opp in opportunities:
            source = opp.get('source_name', 'Unknown')
            stats['source_breakdown'][source] = stats['source_breakdown'].get(source, 0) + 1
            
            agency = opp.get('agency_name', 'Unknown')
            stats['agency_breakdown'][agency] = stats['agency_breakdown'].get(agency, 0) + 1
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Supabase API test server...")
    print("   Health: http://localhost:5001/api/health")
    print("   Opportunities: http://localhost:5001/api/opportunities")
    print("   Stats: http://localhost:5001/api/opportunities/stats")
    app.run(host='0.0.0.0', port=5001, debug=True)