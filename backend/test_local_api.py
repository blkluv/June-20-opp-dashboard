#!/usr/bin/env python3
"""Test the API locally to verify Firecrawl integration"""

from api.index import handler
import json

def test_opportunities_endpoint():
    """Test the opportunities endpoint"""
    
    # Create a mock handler
    class MockHandler:
        def __init__(self):
            self.path = '/api/opportunities'
            self.response_sent = False
            self.response_data = None
        
        def send_response(self, code):
            pass
        
        def send_header(self, key, value):
            pass
        
        def end_headers(self):
            pass
        
        def wfile(self):
            return self
        
        def write(self, data):
            self.response_data = json.loads(data.decode())
    
    # Import and test the handler class
    test_handler = handler()
    test_handler.path = '/api/opportunities'
    
    # Call get_real_opportunities to see what we get
    opportunities = test_handler.get_real_opportunities()
    
    print("🔄 Testing get_real_opportunities()...")
    print(f"✅ Found {len(opportunities)} opportunities")
    
    # Show breakdown by source
    sources = {}
    for opp in opportunities:
        source = opp.get('source_name', 'Unknown')
        sources[source] = sources.get(source, 0) + 1
    
    print("\n📊 Opportunities by source:")
    for source, count in sources.items():
        print(f"  {source}: {count}")
    
    # Test Firecrawl specifically
    print("\n🔄 Testing fetch_firecrawl_opportunities()...")
    firecrawl_opps = test_handler.fetch_firecrawl_opportunities()
    print(f"✅ Found {len(firecrawl_opps)} Firecrawl opportunities")
    
    if firecrawl_opps:
        print("\n📋 First Firecrawl opportunity:")
        first_opp = firecrawl_opps[0]
        for key, value in first_opp.items():
            print(f"  {key}: {value}")
    
    # Test stats calculation
    print("\n🔄 Testing stats calculation...")
    total_opps = len(opportunities)
    active_opps = len([o for o in opportunities if o.get('status') != 'closed'])
    total_value = sum(o.get('estimated_value', 0) for o in opportunities if o.get('estimated_value'))
    
    print(f"  Total Opportunities: {total_opps}")
    print(f"  Active Opportunities: {active_opps}")
    print(f"  Total Value: ${total_value:,.0f}")
    
    return len(opportunities) > 0

if __name__ == "__main__":
    print("🚀 Testing Local API Integration")
    print("=" * 50)
    
    success = test_opportunities_endpoint()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Local API test successful!")
    else:
        print("❌ Local API test failed")