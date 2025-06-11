import requests
import time
import threading
from datetime import datetime, timedelta
from dateutil import parser
from typing import Dict, List, Optional, Any
import json
import os


class APIError(Exception):
    """Base exception for API errors"""
    pass


class RateLimitError(APIError):
    """Exception for rate limit exceeded"""
    pass


class RateLimiter:
    """Rate limiter to control API request frequency"""
    
    def __init__(self, max_requests_per_hour: int = 1000):
        self.max_requests = max_requests_per_hour
        self.requests = []
        self.lock = threading.Lock()
    
    def wait_if_needed(self):
        """Wait if rate limit would be exceeded"""
        with self.lock:
            now = time.time()
            # Remove requests older than 1 hour
            self.requests = [req_time for req_time in self.requests if now - req_time < 3600]
            
            if len(self.requests) >= self.max_requests:
                # Calculate wait time
                oldest_request = min(self.requests)
                wait_time = 3600 - (now - oldest_request) + 1
                time.sleep(wait_time)
            
            self.requests.append(now)


class BaseAPIClient:
    """Base class for API clients"""
    
    def __init__(self, base_url: str, api_key: Optional[str] = None, rate_limit: int = 1000):
        self.base_url = base_url
        self.api_key = api_key
        self.rate_limiter = RateLimiter(rate_limit)
        self.session = requests.Session()
        
        # Set default headers
        if api_key:
            self.session.headers.update({'X-API-Key': api_key})
    
    def make_request(self, endpoint: str, method: str = 'GET', **kwargs) -> Dict[str, Any]:
        """Make API request with error handling and rate limiting"""
        self.rate_limiter.wait_if_needed()
        
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        
        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.Timeout:
            raise APIError("Request timeout")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                raise RateLimitError("Rate limit exceeded")
            raise APIError(f"HTTP error: {e.response.status_code}")
        except requests.exceptions.RequestException as e:
            raise APIError(f"Request failed: {str(e)}")
    
    def parse_date(self, date_string: str) -> Optional[datetime]:
        """Parse date string to datetime object"""
        if not date_string:
            return None
        try:
            return parser.parse(date_string).date()
        except (ValueError, TypeError):
            return None


class SAMGovClient(BaseAPIClient):
    """Client for SAM.gov Get Opportunities Public API"""
    
    def __init__(self, api_key: str):
        super().__init__("https://api.sam.gov/opportunities/v2/search", api_key, rate_limit=500)
    
    def fetch_opportunities(self, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Fetch opportunities from SAM.gov API"""
        default_params = {
            "limit": 100,
            "offset": 0,
            "postedFrom": (datetime.now() - timedelta(days=365)).strftime("%m/%d/%Y"),
            "postedTo": datetime.now().strftime("%m/%d/%Y"),
            "ptype": "o",  # Solicitation
        }
        
        if params:
            default_params.update(params)
        
        return self.make_request("", params=default_params)
    
    def transform_data(self, raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Transform SAM.gov data to our schema"""
        opportunities = []
        
        for item in raw_data.get('opportunitiesData', []):
            # Extract award information if available
            award_info = item.get('award', {})
            estimated_value = None
            if award_info and award_info.get('amount'):
                try:
                    estimated_value = float(award_info['amount'])
                except (ValueError, TypeError):
                    pass
            
            # Extract contact information
            contacts = item.get('pointOfContact', [])
            contact_name = None
            contact_email = None
            contact_phone = None
            if contacts:
                primary_contact = contacts[0]
                contact_name = primary_contact.get('fullName')
                contact_email = primary_contact.get('email')
                contact_phone = primary_contact.get('phone')
            
            # Extract place of performance
            pop = item.get('placeOfPerformance', {})
            pop_city = None
            pop_state = None
            if pop:
                city_info = pop.get('city', {})
                state_info = pop.get('state', {})
                pop_city = city_info.get('name') if city_info else None
                pop_state = state_info.get('code') if state_info else None
            
            opportunity = {
                'source_id': item.get('noticeId'),
                'source_type': 'federal_contract',
                'source_name': 'SAM.gov',
                'title': item.get('title'),
                'description': item.get('description'),
                'opportunity_number': item.get('solicitationNumber'),
                'posted_date': self.parse_date(item.get('postedDate')),
                'due_date': self.parse_date(item.get('responseDeadLine')),
                'estimated_value': estimated_value,
                'agency_name': item.get('department'),
                'office': item.get('office'),
                'naics_code': item.get('naicsCode'),
                'psc_code': item.get('classificationCode'),
                'place_of_performance_city': pop_city,
                'place_of_performance_state': pop_state,
                'contact_name': contact_name,
                'contact_email': contact_email,
                'contact_phone': contact_phone,
                'source_url': item.get('uiLink'),
                'status': 'active' if item.get('active') == 'Yes' else 'inactive',
                'opportunity_type': item.get('type', '').lower(),
                'set_aside_type': item.get('typeOfSetAsideDescription')
            }
            opportunities.append(opportunity)
        
        return opportunities


class GrantsGovClient(BaseAPIClient):
    """Client for Grants.gov Search2 API"""
    
    def __init__(self):
        super().__init__("https://api.grants.gov/v1/api/search2", rate_limit=1000)
    
    def fetch_opportunities(self, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Fetch grant opportunities from Grants.gov API"""
        default_payload = {
            "rows": 100,
            "offset": 0,
            "oppStatuses": ["forecasted", "posted"],
            "sortBy": "openDate|desc"
        }
        
        if params:
            default_payload.update(params)
        
        return self.make_request("", method='POST', json=default_payload)
    
    def transform_data(self, raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Transform Grants.gov data to our schema"""
        opportunities = []
        
        for item in raw_data.get('oppHits', []):
            # Parse award ceiling
            estimated_value = None
            if item.get('awardCeiling'):
                try:
                    estimated_value = float(item['awardCeiling'])
                except (ValueError, TypeError):
                    pass
            
            # Handle CFDA numbers (can be array)
            cfda_numbers = item.get('cfdaNumbers', [])
            cfda_number = cfda_numbers[0] if cfda_numbers else None
            
            opportunity = {
                'source_id': item.get('id'),
                'source_type': 'federal_grant',
                'source_name': 'Grants.gov',
                'title': item.get('title'),
                'description': item.get('description'),
                'opportunity_number': item.get('number'),
                'posted_date': self.parse_date(item.get('openDate')),
                'due_date': self.parse_date(item.get('closeDate')),
                'estimated_value': estimated_value,
                'agency_name': item.get('agencyName'),
                'cfda_number': cfda_number,
                'source_url': f"https://www.grants.gov/web/grants/view-opportunity.html?oppId={item.get('id')}",
                'status': item.get('oppStatus', '').lower(),
                'opportunity_type': 'grant',
                'category': item.get('category')
            }
            opportunities.append(opportunity)
        
        return opportunities


class USASpendingClient(BaseAPIClient):
    """Client for USASpending.gov API"""
    
    def __init__(self):
        super().__init__("https://api.usaspending.gov/api/v2", rate_limit=1000)
    
    def fetch_recent_awards(self, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Fetch recent contract awards for trend analysis"""
        endpoint = "search/spending_by_award/"
        
        default_payload = {
            "filters": {
                "time_period": [
                    {
                        "start_date": "2024-01-01",
                        "end_date": datetime.now().strftime("%Y-%m-%d")
                    }
                ],
                "award_type_codes": ["A", "B", "C", "D"]  # Contract types
            },
            "fields": [
                "Award ID", "Recipient Name", "Award Amount", 
                "Award Date", "Awarding Agency", "Award Description"
            ],
            "sort": "Award Date",
            "order": "desc",
            "limit": 100
        }
        
        if params:
            default_payload.update(params)
        
        return self.make_request(endpoint, method='POST', json=default_payload)
    
    def fetch_agency_spending(self, agency_code: str) -> Dict[str, Any]:
        """Fetch spending data for a specific agency"""
        endpoint = f"agency/{agency_code}/awards/"
        return self.make_request(endpoint)
    
    def transform_award_data(self, raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Transform USASpending award data to our schema"""
        awards = []
        
        for item in raw_data.get('results', []):
            award = {
                'source_id': item.get('Award ID'),
                'source_type': 'federal_contract_award',
                'source_name': 'USASpending.gov',
                'title': item.get('Award Description'),
                'estimated_value': item.get('Award Amount'),
                'agency_name': item.get('Awarding Agency'),
                'posted_date': self.parse_date(item.get('Award Date')),
                'status': 'awarded',
                'opportunity_type': 'contract'
            }
            awards.append(award)
        
        return awards


class APIClientFactory:
    """Factory class to create API clients"""
    
    @staticmethod
    def create_sam_gov_client() -> SAMGovClient:
        """Create SAM.gov client with API key from environment"""
        api_key = os.getenv('SAM_API_KEY')
        if not api_key:
            raise ValueError("SAM_API_KEY environment variable not set")
        return SAMGovClient(api_key)
    
    @staticmethod
    def create_grants_gov_client() -> GrantsGovClient:
        """Create Grants.gov client"""
        return GrantsGovClient()
    
    @staticmethod
    def create_usa_spending_client() -> USASpendingClient:
        """Create USASpending.gov client"""
        return USASpendingClient()
    
    @staticmethod
    def get_all_clients() -> Dict[str, BaseAPIClient]:
        """Get all available API clients"""
        clients = {}
        
        try:
            clients['sam_gov'] = APIClientFactory.create_sam_gov_client()
        except ValueError:
            print("Warning: SAM.gov client not available - API key not set")
        
        clients['grants_gov'] = APIClientFactory.create_grants_gov_client()
        clients['usa_spending'] = APIClientFactory.create_usa_spending_client()
        
        return clients

