import os
import sys
from pathlib import Path

# Add the src directory to the Python path
current_dir = Path(__file__).parent
src_dir = current_dir.parent / 'src'
sys.path.insert(0, str(src_dir))

from flask import Flask
from flask_cors import CORS
from src.models.opportunity import db
from src.routes.opportunities import opportunities_bp
from src.routes.scraping import scraping_bp

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Enable CORS for all routes
CORS(app, origins=['*'])

# Configure database for Vercel (using SQLite in /tmp for serverless)
database_path = '/tmp/opportunities.db'
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{database_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Register blueprints
app.register_blueprint(opportunities_bp, url_prefix='/api')
app.register_blueprint(scraping_bp, url_prefix='/api')

# Initialize database tables
with app.app_context():
    db.create_all()
    
    # Check if we need to populate sample data
    from src.models.opportunity import Opportunity
    if Opportunity.query.count() == 0:
        # Import and create sample data
        from create_sample_data_serverless import create_sample_data
        create_sample_data(app, db)

@app.route('/api')
def index():
    return {
        'message': 'Opportunity Dashboard API',
        'version': '1.0.0',
        'endpoints': [
            '/api/opportunities',
            '/api/opportunities/stats',
            '/api/opportunities/search',
            '/api/sync/status',
            '/api/scraping/sources'
        ]
    }

@app.route('/api/health')
def health():
    return {'status': 'healthy', 'database': 'connected'}

# Vercel serverless function handler
def handler(request):
    return app(request.environ, lambda status, headers: None)

if __name__ == '__main__':
    app.run(debug=True)

