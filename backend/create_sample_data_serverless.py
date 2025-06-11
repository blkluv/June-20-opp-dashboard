"""
Create sample data for serverless deployment
"""

from datetime import datetime, timedelta
import random

def create_sample_data(app, db):
    """Create sample opportunities for serverless deployment"""
    
    from src.models.opportunity import Opportunity, DataSource, SyncLog
    
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
        }
    ]
    
    try:
        # Create data sources
        sources = [
            DataSource(name="SAM.gov", source_type="federal_contract", is_active=True),
            DataSource(name="Grants.gov", source_type="federal_grant", is_active=True),
            DataSource(name="Cal eProcure", source_type="state_rfp", is_active=True),
            DataSource(name="Texas SmartBuy", source_type="state_rfp", is_active=True),
            DataSource(name="RFPMart", source_type="private_rfp", is_active=True),
        ]
        
        for source in sources:
            existing = DataSource.query.filter_by(name=source.name).first()
            if not existing:
                db.session.add(source)
        
        db.session.commit()
        
        # Create sample opportunities
        for opp_data in SAMPLE_OPPORTUNITIES:
            # Check if opportunity already exists
            existing = Opportunity.query.filter_by(opportunity_number=opp_data["opportunity_number"]).first()
            if existing:
                continue
                
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
        
        db.session.commit()
        print(f"✅ Created sample data for serverless deployment")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.session.rollback()

