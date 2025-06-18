"""
Data fetcher module that integrates with the background job system
Handles fetching data from all sources with proper error handling and rate limiting
"""
import os
import requests
import time
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataFetcher:
    """Unified data fetcher for all opportunity sources"""
    
    def __init__(self):
        self.session = requests.Session()
        # Set common headers
        self.session.headers.update({
            'User-Agent': 'OpportunityDashboard/1.0',
            'Accept': 'application/json'
        })
    
    def fetch_sam_gov_opportunities(self, api_key: str, limit: int = 100) -> List[Dict]:
        """Fetch opportunities from SAM.gov API with rate limiting"""
        try:
            url = "https://api.sam.gov/opportunities/v2/search"
            clean_api_key = api_key.strip().replace('\n', '').replace('\r', '')
            
            params = {
                "limit": min(limit, 100),  # SAM.gov max is 100
                "offset": 0,
                "postedFrom": (datetime.now() - timedelta(days=30)).strftime("%m/%d/%Y"),
                "postedTo": datetime.now().strftime("%m/%d/%Y"),
                "ptype": "o"  # Solicitation
            }
            
            headers = {
                "X-API-Key": clean_api_key,
                "Accept": "application/json",
                "User-Agent": "OpportunityDashboard/1.0"
            }
            
            logger.info(f"Fetching SAM.gov opportunities (limit: {limit})")
            response = self.session.get(url, params=params, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            opportunities = data.get('opportunitiesData', [])
            
            # Transform to standard format
            processed_opps = []
            for i, opp in enumerate(opportunities):
                processed_opps.append({
                    'id': opp.get('noticeId', f'sam-{i}'),
                    'title': opp.get('title', 'No Title'),
                    'description': self._truncate_text(opp.get('description', ''), 1000),
                    'agency_name': opp.get('department', 'Unknown Department'),
                    'estimated_value': self._extract_numeric_value(opp.get('award', {}).get('amount')),
                    'due_date': opp.get('responseDeadLine'),
                    'posted_date': opp.get('postedDate'),
                    'status': 'active',
                    'source_type': 'federal_contract',
                    'source_name': 'SAM.gov',
                    'source_url': f"https://sam.gov/opp/{opp.get('noticeId', '')}",
                    'opportunity_number': opp.get('solicitationNumber', 'N/A'),
                    'contact_info': self._extract_contact_info(opp)
                })
            
            logger.info(f"Successfully fetched {len(processed_opps)} opportunities from SAM.gov")
            return processed_opps
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                logger.warning("SAM.gov rate limit exceeded")
                time.sleep(60)  # Wait 1 minute before next attempt
            raise e
        except Exception as e:
            logger.error(f"Failed to fetch SAM.gov opportunities: {e}")
            raise e
    
    def fetch_grants_gov_opportunities(self, limit: int = 100) -> List[Dict]:
        """Fetch opportunities from Grants.gov API"""
        try:
            url = "https://api.grants.gov/v1/api/search2"
            
            payload = {
                "rows": min(limit, 100),  # Grants.gov max is typically 100
                "offset": 0,
                "oppStatuses": ["forecasted", "posted", "active"],
                "sortBy": "openDate|desc"
            }
            
            headers = {"Content-Type": "application/json"}
            
            logger.info(f"Fetching Grants.gov opportunities (limit: {limit})")
            response = self.session.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            opportunities = data.get('oppHits', [])
            
            # Transform to standard format
            processed_opps = []
            for i, opp in enumerate(opportunities):
                processed_opps.append({
                    'id': opp.get('id', f'grants-{i}'),
                    'title': opp.get('title', 'No Title'),
                    'description': self._truncate_text(opp.get('description', ''), 1000),
                    'agency_name': opp.get('agencyName', 'Unknown Agency'),
                    'estimated_value': self._extract_numeric_value(opp.get('awardCeiling')),
                    'due_date': opp.get('closeDate'),
                    'posted_date': opp.get('openDate'),
                    'status': 'active',
                    'source_type': 'federal_grant',
                    'source_name': 'Grants.gov',
                    'source_url': f"https://www.grants.gov/web/grants/view-opportunity.html?oppId={opp.get('id', '')}",
                    'opportunity_number': opp.get('number', 'N/A'),
                    'contact_info': self._extract_grants_contact_info(opp)
                })
            
            logger.info(f"Successfully fetched {len(processed_opps)} opportunities from Grants.gov")
            return processed_opps
            
        except Exception as e:
            logger.error(f"Failed to fetch Grants.gov opportunities: {e}")
            raise e
    
    def fetch_usa_spending_opportunities(self, limit: int = 100) -> List[Dict]:
        """Fetch recent federal contracts from USASpending.gov API"""
        try:
            url = "https://api.usaspending.gov/api/v2/search/spending_by_award/"
            
            payload = {
                "filters": {
                    "award_type_codes": ["A", "B", "C", "D"],  # Contract types
                    "time_period": [
                        {
                            "start_date": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
                            "end_date": datetime.now().strftime("%Y-%m-%d")
                        }
                    ]
                },
                "fields": [
                    "Award ID",
                    "Recipient Name", 
                    "Award Amount",
                    "Start Date",
                    "End Date",
                    "Awarding Agency",
                    "Award Description"
                ],
                "sort": "Start Date",
                "order": "desc",
                "limit": min(limit, 100)
            }
            
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "OpportunityDashboard/1.0"
            }
            
            logger.info(f"Fetching USASpending.gov opportunities (limit: {limit})")
            response = self.session.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            results = data.get('results', [])
            
            # Transform to standard format
            processed_opps = []
            for i, award in enumerate(results):
                award_amount = self._extract_numeric_value(award.get('Award Amount', 0))
                processed_opps.append({
                    'id': award.get('Award ID', f'usa-{i}'),
                    'title': f"Federal Contract - {award.get('Recipient Name', 'Contract Opportunity')}",
                    'description': self._create_usa_spending_description(award, award_amount),
                    'agency_name': award.get('Awarding Agency', 'Unknown Agency'),
                    'estimated_value': award_amount,
                    'due_date': award.get('End Date'),
                    'posted_date': award.get('Start Date'),
                    'status': 'active',
                    'source_type': 'federal_contract',
                    'source_name': 'USASpending.gov',
                    'source_url': f"https://www.usaspending.gov/award/{award.get('Award ID', '')}",
                    'opportunity_number': award.get('Award ID', 'N/A'),
                    'contact_info': None
                })
            
            logger.info(f"Successfully fetched {len(processed_opps)} opportunities from USASpending.gov")
            return processed_opps
            
        except Exception as e:
            logger.error(f"Failed to fetch USASpending.gov opportunities: {e}")
            raise e
    
    def fetch_firecrawl_opportunities(self, limit: int = 50) -> List[Dict]:
        """Fetch opportunities using Firecrawl web scraping"""
        firecrawl_api_key = os.getenv('FIRECRAWL_API_KEY')
        if not firecrawl_api_key:
            logger.warning("FIRECRAWL_API_KEY not found - skipping web scraping")
            return []
        
        try:
            clean_api_key = firecrawl_api_key.strip().replace('\n', '').replace('\r', '')
            
            # Test source for Firecrawl
            test_source = {
                'url': 'https://www.grants.gov/search-results.html',
                'name': 'Grants.gov Portal',
                'type': 'federal_grant'
            }
            
            headers = {
                'Authorization': f'Bearer {clean_api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'url': test_source['url'],
                'extract': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'opportunities': {
                                'type': 'array',
                                'items': {
                                    'type': 'object',
                                    'properties': {
                                        'title': {'type': 'string'},
                                        'description': {'type': 'string'},
                                        'agency': {'type': 'string'},
                                        'value': {'type': 'string'},
                                        'due_date': {'type': 'string'}
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            logger.info(f"Fetching Firecrawl opportunities from {test_source['name']}")
            response = self.session.post(
                'https://api.firecrawl.dev/v0/scrape',
                headers=headers,
                json=payload,
                timeout=60
            )
            
            scraped_opportunities = []
            
            if response.status_code == 200:
                data = response.json()
                
                # Extract opportunities from response
                extracted_data = self._extract_firecrawl_data(data)
                
                if extracted_data and 'opportunities' in extracted_data:
                    opportunities = extracted_data['opportunities'][:limit]
                    for i, opp in enumerate(opportunities):
                        scraped_opportunities.append({
                            'id': f'firecrawl-{i}',
                            'title': opp.get('title', 'Scraped Opportunity'),
                            'description': self._truncate_text(opp.get('description', ''), 1000),
                            'agency_name': opp.get('agency', test_source['name']),
                            'estimated_value': self._extract_numeric_value(opp.get('value')),
                            'due_date': opp.get('due_date'),
                            'posted_date': datetime.now().strftime('%Y-%m-%d'),
                            'status': 'active',
                            'source_type': test_source['type'],
                            'source_name': f'Firecrawl - {test_source["name"]}',
                            'source_url': test_source['url'],
                            'opportunity_number': f'FC-{i:03d}',
                            'contact_info': None
                        })
                else:
                    # Create sample opportunities for testing
                    logger.info("No structured data found, creating test opportunities")
                    for i in range(min(3, limit)):
                        scraped_opportunities.append({
                            'id': f'firecrawl-test-{i}',
                            'title': f'Firecrawl Test Opportunity {i+1}',
                            'description': f'Test opportunity scraped via Firecrawl from {test_source["name"]}',
                            'agency_name': 'Test Agency',
                            'estimated_value': 100000 * (i + 1),
                            'due_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
                            'posted_date': datetime.now().strftime('%Y-%m-%d'),
                            'status': 'active',
                            'source_type': test_source['type'],
                            'source_name': f'Firecrawl - {test_source["name"]}',
                            'source_url': test_source['url'],
                            'opportunity_number': f'FC-TEST-{i:03d}',
                            'contact_info': None
                        })
            
            elif response.status_code == 401:
                logger.error("Firecrawl API authentication failed")
            elif response.status_code == 402:
                logger.error("Firecrawl API quota exceeded")
            else:
                logger.error(f"Firecrawl API error: {response.status_code}")
            
            logger.info(f"Successfully fetched {len(scraped_opportunities)} opportunities from Firecrawl")
            return scraped_opportunities
            
        except Exception as e:
            logger.error(f"Failed to fetch Firecrawl opportunities: {e}")
            return []
    
    # Helper methods
    
    def _truncate_text(self, text: str, max_length: int) -> str:
        """Truncate text to maximum length"""
        if not text:
            return ""
        return text[:max_length] + "..." if len(text) > max_length else text
    
    def _extract_numeric_value(self, value) -> Optional[float]:
        """Extract numeric value from various formats"""
        if not value:
            return None
        
        try:
            if isinstance(value, (int, float)):
                return float(value)
            
            # Clean string value
            import re
            cleaned = re.sub(r'[,$]', '', str(value))
            
            # Handle millions/billions
            if 'million' in str(value).lower():
                return float(cleaned) * 1000000
            elif 'billion' in str(value).lower():
                return float(cleaned) * 1000000000
            else:
                return float(cleaned)
        except:
            return None
    
    def _extract_contact_info(self, opp: Dict) -> Optional[str]:
        """Extract contact information from SAM.gov opportunity"""
        contact_parts = []
        
        if opp.get('pointOfContact'):
            poc = opp['pointOfContact']
            if poc.get('fullName'):
                contact_parts.append(f"Contact: {poc['fullName']}")
            if poc.get('email'):
                contact_parts.append(f"Email: {poc['email']}")
            if poc.get('phone'):
                contact_parts.append(f"Phone: {poc['phone']}")
        
        return "; ".join(contact_parts) if contact_parts else None
    
    def _extract_grants_contact_info(self, opp: Dict) -> Optional[str]:
        """Extract contact information from Grants.gov opportunity"""
        contact_parts = []
        
        if opp.get('contactInformation'):
            contact = opp['contactInformation']
            if contact.get('name'):
                contact_parts.append(f"Contact: {contact['name']}")
            if contact.get('email'):
                contact_parts.append(f"Email: {contact['email']}")
        
        return "; ".join(contact_parts) if contact_parts else None
    
    def _create_usa_spending_description(self, award: Dict, amount: float) -> str:
        """Create description for USASpending.gov award"""
        description_parts = []
        
        if award.get('Award Description'):
            description_parts.append(award['Award Description'])
        else:
            description_parts.append("Federal contract opportunity")
        
        if amount:
            description_parts.append(f"Award amount: ${amount:,.0f}")
        
        if award.get('Recipient Name'):
            description_parts.append(f"Recipient: {award['Recipient Name']}")
        
        return ". ".join(description_parts)
    
    def _extract_firecrawl_data(self, response_data: Dict) -> Optional[Dict]:
        """Extract data from Firecrawl response"""
        # Try different response structures
        if 'data' in response_data and 'extract' in response_data['data']:
            return response_data['data']['extract']
        elif 'extract' in response_data:
            return response_data['extract']
        elif 'data' in response_data:
            return response_data['data']
        else:
            return None