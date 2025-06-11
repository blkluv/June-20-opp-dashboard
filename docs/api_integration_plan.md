# API Integration Plan for Opportunity Dashboard

## Data Source Integration Strategy

### 1. SAM.gov Get Opportunities Public API

**Endpoint**: `https://api.sam.gov/opportunities/v2/search`
**Authentication**: API Key required (free registration)
**Rate Limits**: Limited based on user role
**Update Frequency**: Daily for active notices, weekly for archived

```python
class SAMGovClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.sam.gov/opportunities/v2/search"
        self.headers = {"X-API-Key": api_key}
    
    def fetch_opportunities(self, params=None):
        """
        Fetch opportunities from SAM.gov API
        """
        default_params = {
            "limit": 100,
            "offset": 0,
            "postedFrom": "01/01/2024",  # Last year
            "postedTo": datetime.now().strftime("%m/%d/%Y"),
            "ptype": "o",  # Solicitation
        }
        
        if params:
            default_params.update(params)
        
        response = requests.get(self.base_url, headers=self.headers, params=default_params)
        return response.json()
    
    def transform_data(self, raw_data):
        """
        Transform SAM.gov data to our schema
        """
        opportunities = []
        for item in raw_data.get('opportunitiesData', []):
            opportunity = {
                'source_id': item.get('noticeId'),
                'source_type': 'federal_contract',
                'source_name': 'SAM.gov',
                'title': item.get('title'),
                'description': item.get('description'),
                'opportunity_number': item.get('solicitationNumber'),
                'posted_date': self.parse_date(item.get('postedDate')),
                'due_date': self.parse_date(item.get('responseDeadLine')),
                'agency_name': item.get('department'),
                'office': item.get('office'),
                'naics_code': item.get('naicsCode'),
                'psc_code': item.get('classificationCode'),
                'source_url': item.get('uiLink'),
                'status': 'active' if item.get('active') == 'Yes' else 'inactive'
            }
            opportunities.append(opportunity)
        return opportunities
```

### 2. Grants.gov Search2 API

**Endpoint**: `https://api.grants.gov/v1/api/search2`
**Authentication**: None required
**Rate Limits**: Not specified
**Update Frequency**: Real-time

```python
class GrantsGovClient:
    def __init__(self):
        self.base_url = "https://api.grants.gov/v1/api/search2"
    
    def fetch_opportunities(self, params=None):
        """
        Fetch grant opportunities from Grants.gov API
        """
        default_payload = {
            "rows": 100,
            "offset": 0,
            "oppStatuses": ["forecasted", "posted"],
            "sortBy": "openDate|desc"
        }
        
        if params:
            default_payload.update(params)
        
        response = requests.post(self.base_url, json=default_payload)
        return response.json()
    
    def transform_data(self, raw_data):
        """
        Transform Grants.gov data to our schema
        """
        opportunities = []
        for item in raw_data.get('oppHits', []):
            opportunity = {
                'source_id': item.get('id'),
                'source_type': 'federal_grant',
                'source_name': 'Grants.gov',
                'title': item.get('title'),
                'description': item.get('description'),
                'opportunity_number': item.get('number'),
                'posted_date': self.parse_date(item.get('openDate')),
                'due_date': self.parse_date(item.get('closeDate')),
                'agency_name': item.get('agencyName'),
                'cfda_number': item.get('cfdaNumbers'),
                'estimated_value': item.get('awardCeiling'),
                'source_url': f"https://www.grants.gov/web/grants/view-opportunity.html?oppId={item.get('id')}",
                'status': item.get('oppStatus', '').lower()
            }
            opportunities.append(opportunity)
        return opportunities
```

### 3. USASpending.gov API

**Endpoint**: `https://api.usaspending.gov/api/v2/search/spending_by_award/`
**Authentication**: None required
**Rate Limits**: None specified
**Update Frequency**: Daily

```python
class USASpendingClient:
    def __init__(self):
        self.base_url = "https://api.usaspending.gov/api/v2"
    
    def fetch_recent_awards(self, params=None):
        """
        Fetch recent contract awards for trend analysis
        """
        endpoint = f"{self.base_url}/search/spending_by_award/"
        
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
        
        response = requests.post(endpoint, json=default_payload)
        return response.json()
```

## Data Synchronization Strategy

### 1. Scheduled Sync Jobs

```python
class DataSyncManager:
    def __init__(self, db_connection):
        self.db = db_connection
        self.sources = {
            'sam_gov': SAMGovClient(api_key=os.getenv('SAM_API_KEY')),
            'grants_gov': GrantsGovClient(),
            'usa_spending': USASpendingClient()
        }
    
    def sync_all_sources(self):
        """
        Sync data from all configured sources
        """
        for source_name, client in self.sources.items():
            try:
                self.sync_source(source_name, client)
            except Exception as e:
                self.log_error(source_name, str(e))
    
    def sync_source(self, source_name, client):
        """
        Sync data from a specific source
        """
        sync_log = self.create_sync_log(source_name)
        
        try:
            # Fetch data from API
            raw_data = client.fetch_opportunities()
            opportunities = client.transform_data(raw_data)
            
            # Process and store data
            added, updated = self.process_opportunities(opportunities)
            
            # Update sync log
            self.complete_sync_log(sync_log, len(opportunities), added, updated)
            
        except Exception as e:
            self.fail_sync_log(sync_log, str(e))
            raise
    
    def process_opportunities(self, opportunities):
        """
        Process and store opportunities in database
        """
        added = 0
        updated = 0
        
        for opp_data in opportunities:
            existing = self.find_existing_opportunity(opp_data['source_id'])
            
            if existing:
                if self.has_changes(existing, opp_data):
                    self.update_opportunity(existing.id, opp_data)
                    updated += 1
            else:
                self.create_opportunity(opp_data)
                added += 1
        
        return added, updated
```

### 2. Error Handling and Retry Logic

```python
class APIClient:
    def __init__(self, base_url, api_key=None):
        self.base_url = base_url
        self.api_key = api_key
        self.session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
    
    def make_request(self, endpoint, method='GET', **kwargs):
        """
        Make API request with error handling
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
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
```

### 3. Rate Limiting and Throttling

```python
class RateLimiter:
    def __init__(self, max_requests_per_hour=1000):
        self.max_requests = max_requests_per_hour
        self.requests = []
        self.lock = threading.Lock()
    
    def wait_if_needed(self):
        """
        Wait if rate limit would be exceeded
        """
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
```

## Data Quality and Validation

### 1. Data Validation Rules

```python
class OpportunityValidator:
    def validate(self, opportunity_data):
        """
        Validate opportunity data before storing
        """
        errors = []
        
        # Required fields
        required_fields = ['source_id', 'title', 'source_type', 'source_name']
        for field in required_fields:
            if not opportunity_data.get(field):
                errors.append(f"Missing required field: {field}")
        
        # Date validation
        if opportunity_data.get('due_date'):
            try:
                due_date = datetime.strptime(opportunity_data['due_date'], '%Y-%m-%d')
                if due_date < datetime.now():
                    errors.append("Due date is in the past")
            except ValueError:
                errors.append("Invalid due date format")
        
        # Value validation
        if opportunity_data.get('estimated_value'):
            try:
                value = float(opportunity_data['estimated_value'])
                if value < 0:
                    errors.append("Estimated value cannot be negative")
            except (ValueError, TypeError):
                errors.append("Invalid estimated value")
        
        return errors
```

### 2. Duplicate Detection

```python
class DuplicateDetector:
    def find_duplicates(self, new_opportunity):
        """
        Find potential duplicates based on multiple criteria
        """
        # Exact match on source_id
        exact_match = self.db.query(Opportunity).filter(
            Opportunity.source_id == new_opportunity['source_id']
        ).first()
        
        if exact_match:
            return exact_match
        
        # Fuzzy match on title and agency
        similar_opportunities = self.db.query(Opportunity).filter(
            Opportunity.agency_name == new_opportunity.get('agency_name'),
            Opportunity.posted_date == new_opportunity.get('posted_date')
        ).all()
        
        for opp in similar_opportunities:
            similarity = self.calculate_title_similarity(opp.title, new_opportunity['title'])
            if similarity > 0.85:  # 85% similarity threshold
                return opp
        
        return None
    
    def calculate_title_similarity(self, title1, title2):
        """
        Calculate similarity between two titles using fuzzy matching
        """
        from difflib import SequenceMatcher
        return SequenceMatcher(None, title1.lower(), title2.lower()).ratio()
```

## Monitoring and Alerting

### 1. Sync Monitoring

```python
class SyncMonitor:
    def check_sync_health(self):
        """
        Check the health of data synchronization
        """
        issues = []
        
        # Check for failed syncs in last 24 hours
        failed_syncs = self.db.query(SyncLog).filter(
            SyncLog.status == 'failed',
            SyncLog.sync_start > datetime.now() - timedelta(hours=24)
        ).count()
        
        if failed_syncs > 0:
            issues.append(f"{failed_syncs} failed syncs in last 24 hours")
        
        # Check for stale data
        for source in self.sources:
            last_sync = self.db.query(SyncLog).filter(
                SyncLog.source_name == source,
                SyncLog.status == 'completed'
            ).order_by(SyncLog.sync_end.desc()).first()
            
            if not last_sync or last_sync.sync_end < datetime.now() - timedelta(hours=25):
                issues.append(f"Stale data from {source}")
        
        return issues
```

This integration plan provides a robust foundation for collecting and processing opportunity data from multiple sources while handling errors, rate limits, and data quality issues.

