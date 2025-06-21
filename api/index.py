from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime
import urllib.parse

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # Parse the URL path
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # Route handling
        if path == '/api/health':
            response = {
                'status': 'healthy',
                'message': 'Opportunity Dashboard API is running',
                'version': '1.0.4-simplified',
                'timestamp': datetime.now().isoformat()
            }
        elif path == '/api/opportunities':
            response = {
                'status': 'success',
                'message': 'Opportunities endpoint',
                'data': [],
                'count': 0,
                'version': '1.0.4-simplified'
            }
        else:
            # Default root response
            response = {
                'status': 'success',
                'message': 'Welcome to Opportunity Dashboard API',
                'version': '1.0.4-simplified',
                'timestamp': datetime.now().isoformat(),
                'endpoints': [
                    '/api/health',
                    '/api/opportunities',
                    '/api/hello'
                ],
                'fixed': 'API files restored!'
            }
        
        self.wfile.write(json.dumps(response, indent=2).encode())
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 