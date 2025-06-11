#!/usr/bin/env python3
"""
Create sample data for testing the opportunity dashboard
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from datetime import datetime, timedelta
import random
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# Create Flask app and database
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///opportunities.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Define models inline for this script
class DataSource(db.Model):
    __tablename__ = 'data_sources'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    source_type = db.Column(db.String(50), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Opportunity(db.Model):
    __tablename__ = 'opportunities'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text)
    agency_name = db.Column(db.String(200))
    opportunity_number = db.Column(db.String(100))
    estimated_value = db.Column(db.Float)
    posted_date = db.Column(db.DateTime)
    due_date = db.Column(db.DateTime)
    source_type = db.Column(db.String(50), nullable=False)
    source_name = db.Column(db.String(100), nullable=False)
    source_url = db.Column(db.String(500))
    location = db.Column(db.String(200))
    contact_info = db.Column(db.Text)
    keywords = db.Column(db.JSON)
    
    # Scoring fields
    relevance_score = db.Column(db.Integer, default=0)
    urgency_score = db.Column(db.Integer, default=0)
    value_score = db.Column(db.Integer, default=0)
    competition_score = db.Column(db.Integer, default=0)
    total_score = db.Column(db.Integer, default=0)
    
    # Metadata
    data_source_id = db.Column(db.Integer, db.ForeignKey('data_sources.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SyncLog(db.Model):
    __tablename__ = 'sync_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    source_name = db.Column(db.String(100), nullable=False)
    sync_start = db.Column(db.DateTime, nullable=False)
    sync_end = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='running')
    records_processed = db.Column(db.Integer, default=0)
    records_added = db.Column(db.Integer, default=0)
    records_updated = db.Column(db.Integer, default=0)
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Sample data for testing
SAMPLE_OPPORTUNITIES = [
    {
        "title": "Cloud Infrastructure Modernization Services",
        "description": "The Department of Defense seeks cloud infrastructure modernization services to enhance cybersecurity and operational efficiency across multiple military installations.",
        "agency_name": "Department of Defense",
        "opportunity_number": "DOD-2025-CLOUD-001",
        "estimated_value": 15000000,
        "posted_date": datetime.now() - timedelta(days=5),
        "due_date": datetime.now() + timedelta(days=45),
        "source_type": "federal_contract",
        "source_name": "SAM.gov",
        "source_url": "https://sam.gov/opp/example1",
        "location": "Washington, DC",
        "contact_info": "contracting@defense.gov",
        "keywords": ["cloud", "infrastructure", "cybersecurity", "modernization"]
    },
    {
        "title": "STEM Education Research Grant",
        "description": "National Science Foundation seeks proposals for innovative STEM education research programs focusing on K-12 student engagement and learning outcomes.",
        "agency_name": "National Science Foundation",
        "opportunity_number": "NSF-2025-STEM-EDU-002",
        "estimated_value": 2500000,
        "posted_date": datetime.now() - timedelta(days=12),
        "due_date": datetime.now() + timedelta(days=60),
        "source_type": "federal_grant",
        "source_name": "Grants.gov",
        "source_url": "https://grants.gov/example2",
        "location": "Nationwide",
        "contact_info": "grants@nsf.gov",
        "keywords": ["STEM", "education", "research", "K-12", "learning"]
    },
    {
        "title": "Healthcare IT System Integration",
        "description": "California Department of Health requires comprehensive IT system integration services for statewide electronic health record implementation.",
        "agency_name": "California Department of Health",
        "opportunity_number": "CA-HEALTH-IT-2025-003",
        "estimated_value": 8500000,
        "posted_date": datetime.now() - timedelta(days=8),
        "due_date": datetime.now() + timedelta(days=30),
        "source_type": "state_rfp",
        "source_name": "Cal eProcure",
        "source_url": "https://caleprocure.ca.gov/example3",
        "location": "Sacramento, CA",
        "contact_info": "procurement@cdph.ca.gov",
        "keywords": ["healthcare", "IT", "integration", "electronic health records", "EHR"]
    },
    {
        "title": "Renewable Energy Infrastructure Development",
        "description": "Texas General Land Office seeks contractors for large-scale solar and wind energy infrastructure development on state-owned lands.",
        "agency_name": "Texas General Land Office",
        "opportunity_number": "TX-GLO-ENERGY-2025-004",
        "estimated_value": 25000000,
        "posted_date": datetime.now() - timedelta(days=15),
        "due_date": datetime.now() + timedelta(days=75),
        "source_type": "state_rfp",
        "source_name": "Texas SmartBuy",
        "source_url": "https://txsmartbuy.com/example4",
        "location": "Austin, TX",
        "contact_info": "energy@glo.texas.gov",
        "keywords": ["renewable energy", "solar", "wind", "infrastructure", "development"]
    },
    {
        "title": "Cybersecurity Assessment and Remediation",
        "description": "Fortune 500 financial services company requires comprehensive cybersecurity assessment and remediation services for enterprise infrastructure.",
        "agency_name": "Global Financial Corp",
        "opportunity_number": "GFC-CYBER-2025-005",
        "estimated_value": 3200000,
        "posted_date": datetime.now() - timedelta(days=3),
        "due_date": datetime.now() + timedelta(days=21),
        "source_type": "private_rfp",
        "source_name": "RFPMart",
        "source_url": "https://rfpmart.com/example5",
        "location": "New York, NY",
        "contact_info": "procurement@globalfinancial.com",
        "keywords": ["cybersecurity", "assessment", "remediation", "financial services", "enterprise"]
    },
    {
        "title": "Urban Transportation Planning Study",
        "description": "City of Seattle Department of Transportation seeks consulting services for comprehensive urban transportation planning and traffic flow optimization study.",
        "agency_name": "Seattle Department of Transportation",
        "opportunity_number": "SDOT-TRANSPORT-2025-006",
        "estimated_value": 1800000,
        "posted_date": datetime.now() - timedelta(days=20),
        "due_date": datetime.now() + timedelta(days=40),
        "source_type": "scraped",
        "source_name": "Firecrawl - Seattle.gov",
        "source_url": "https://seattle.gov/transportation/rfp/example6",
        "location": "Seattle, WA",
        "contact_info": "rfp@seattle.gov",
        "keywords": ["transportation", "planning", "urban", "traffic", "consulting"]
    },
    {
        "title": "AI-Powered Data Analytics Platform",
        "description": "NASA Goddard Space Flight Center requires development of AI-powered data analytics platform for satellite imagery processing and climate research.",
        "agency_name": "NASA Goddard Space Flight Center",
        "opportunity_number": "NASA-GSFC-AI-2025-007",
        "estimated_value": 12000000,
        "posted_date": datetime.now() - timedelta(days=7),
        "due_date": datetime.now() + timedelta(days=90),
        "source_type": "federal_contract",
        "source_name": "SAM.gov",
        "source_url": "https://sam.gov/opp/example7",
        "location": "Greenbelt, MD",
        "contact_info": "contracts@nasa.gov",
        "keywords": ["AI", "artificial intelligence", "data analytics", "satellite", "climate research"]
    },
    {
        "title": "Small Business Innovation Research - Clean Technology",
        "description": "Department of Energy SBIR program seeks innovative clean technology solutions for energy storage and grid modernization applications.",
        "agency_name": "Department of Energy",
        "opportunity_number": "DOE-SBIR-CLEAN-2025-008",
        "estimated_value": 750000,
        "posted_date": datetime.now() - timedelta(days=25),
        "due_date": datetime.now() + timedelta(days=35),
        "source_type": "federal_grant",
        "source_name": "Grants.gov",
        "source_url": "https://grants.gov/example8",
        "location": "Nationwide",
        "contact_info": "sbir@energy.gov",
        "keywords": ["SBIR", "clean technology", "energy storage", "grid modernization", "innovation"]
    }
]

def create_sample_data():
    """Create sample opportunities for testing"""
    
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Clear existing data
        Opportunity.query.delete()
        DataSource.query.delete()
        SyncLog.query.delete()
        
        # Create data sources
        sources = [
            DataSource(name="SAM.gov", source_type="federal_contract", is_active=True),
            DataSource(name="Grants.gov", source_type="federal_grant", is_active=True),
            DataSource(name="USASpending.gov", source_type="federal_contract", is_active=True),
            DataSource(name="Cal eProcure", source_type="state_rfp", is_active=True),
            DataSource(name="Texas SmartBuy", source_type="state_rfp", is_active=True),
            DataSource(name="RFPMart", source_type="private_rfp", is_active=True),
            DataSource(name="Firecrawl - Seattle.gov", source_type="scraped", is_active=True),
        ]
        
        for source in sources:
            db.session.add(source)
        
        db.session.commit()
        
        # Create sample opportunities
        for i, opp_data in enumerate(SAMPLE_OPPORTUNITIES):
            # Get the data source
            source = DataSource.query.filter_by(name=opp_data["source_name"]).first()
            
            opportunity = Opportunity(
                title=opp_data["title"],
                description=opp_data["description"],
                agency_name=opp_data["agency_name"],
                opportunity_number=opp_data["opportunity_number"],
                estimated_value=opp_data["estimated_value"],
                posted_date=opp_data["posted_date"],
                due_date=opp_data["due_date"],
                source_type=opp_data["source_type"],
                source_name=opp_data["source_name"],
                source_url=opp_data["source_url"],
                location=opp_data["location"],
                contact_info=opp_data["contact_info"],
                keywords=opp_data["keywords"],
                data_source_id=source.id if source else None,
                
                # Generate realistic scores
                relevance_score=random.randint(60, 95),
                urgency_score=random.randint(50, 90),
                value_score=random.randint(55, 85),
                competition_score=random.randint(45, 80),
            )
            
            # Calculate total score
            opportunity.total_score = int(
                opportunity.relevance_score * 0.4 +
                opportunity.urgency_score * 0.25 +
                opportunity.value_score * 0.2 +
                opportunity.competition_score * 0.15
            )
            
            db.session.add(opportunity)
        
        # Create some sync logs
        sync_logs = [
            SyncLog(
                source_name="SAM.gov",
                sync_start=datetime.now() - timedelta(hours=2),
                sync_end=datetime.now() - timedelta(hours=1, minutes=45),
                status="completed",
                records_processed=150,
                records_added=12,
                records_updated=8
            ),
            SyncLog(
                source_name="Grants.gov",
                sync_start=datetime.now() - timedelta(hours=3),
                sync_end=datetime.now() - timedelta(hours=2, minutes=30),
                status="completed",
                records_processed=85,
                records_added=6,
                records_updated=3
            ),
            SyncLog(
                source_name="Firecrawl - California",
                sync_start=datetime.now() - timedelta(hours=1),
                sync_end=datetime.now() - timedelta(minutes=45),
                status="completed",
                records_processed=45,
                records_added=4,
                records_updated=2
            )
        ]
        
        for log in sync_logs:
            db.session.add(log)
        
        db.session.commit()
        
        print(f"✅ Created {len(SAMPLE_OPPORTUNITIES)} sample opportunities")
        print(f"✅ Created {len(sources)} data sources")
        print(f"✅ Created {len(sync_logs)} sync logs")
        print("\n📊 Sample data summary:")
        
        # Print summary
        for source_type in ["federal_contract", "federal_grant", "state_rfp", "private_rfp", "scraped"]:
            count = Opportunity.query.filter_by(source_type=source_type).count()
            if count > 0:
                print(f"  - {source_type}: {count} opportunities")
        
        total_value = db.session.query(db.func.sum(Opportunity.estimated_value)).scalar() or 0
        avg_score = db.session.query(db.func.avg(Opportunity.total_score)).scalar() or 0
        
        print(f"\n💰 Total estimated value: ${total_value:,.2f}")
        print(f"🎯 Average score: {avg_score:.1f}")

if __name__ == "__main__":
    create_sample_data()

