# Firecrawl Integration Documentation

## Overview
The Opportunity Dashboard backend now includes Firecrawl integration for web scraping RFP and grant opportunities from sources that don't provide public APIs.

## Features Added

### 1. Firecrawl Service (`src/services/firecrawl_service.py`)
- **FirecrawlClient**: Core client for Firecrawl API interactions
- **RFPExtractor**: Intelligent extraction of opportunity data from scraped content
- **FirecrawlScrapeService**: High-level service for scraping predefined and custom sources

### 2. Enhanced Data Sync Service
- Updated `DataSyncService` to include web scraping alongside API data collection
- Support for both API sources and scraping sources in unified sync operations
- Custom URL scraping capability

### 3. New API Endpoints (`src/routes/scraping.py`)
- `GET /api/scraping/sources` - List available scraping sources
- `POST /api/scraping/scrape-source` - Scrape a predefined source
- `POST /api/scraping/scrape-url` - Scrape a custom URL
- `POST /api/scraping/sync-all` - Sync all scraping sources
- `POST /api/scraping/test` - Test Firecrawl service

## Predefined Scraping Sources

### State Government Procurement
1. **California eProcure** - https://caleprocure.ca.gov/pages/public-search.aspx
2. **Texas SmartBuy** - https://www.txsmartbuy.com/sp
3. **New York State Procurement** - https://www.ogs.ny.gov/procurement/

### Private Sector RFPs
1. **RFPMart** - https://www.rfpmart.com/

## Setup Requirements

### Environment Variables
```bash
# Required for Firecrawl functionality
export FIRECRAWL_API_KEY="your_firecrawl_api_key_here"

# Optional: Existing API keys for federal sources
export SAM_API_KEY="your_sam_gov_api_key"
```

### Dependencies
The following packages have been added:
- `firecrawl-py` - Official Firecrawl Python SDK
- `aiohttp` - Async HTTP client (dependency)
- `pydantic` - Data validation (dependency)
- `python-dotenv` - Environment variable management

## Usage Examples

### 1. Test Firecrawl Service
```bash
curl -X POST http://localhost:5000/api/scraping/test \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### 2. Get Available Scraping Sources
```bash
curl http://localhost:5000/api/scraping/sources
```

### 3. Scrape a Predefined Source
```bash
curl -X POST http://localhost:5000/api/scraping/scrape-source \
  -H "Content-Type: application/json" \
  -d '{"source_key": "california_procurement"}'
```

### 4. Scrape a Custom URL
```bash
curl -X POST http://localhost:5000/api/scraping/scrape-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example-procurement-site.com",
    "source_name": "Example Procurement"
  }'
```

### 5. Sync All Sources (APIs + Scraping)
```bash
curl -X POST http://localhost:5000/api/sync
```

## Data Extraction Capabilities

### Automatic Field Extraction
The RFPExtractor can automatically identify and extract:
- **Title**: Opportunity title or name
- **Description**: Detailed description or summary
- **Opportunity Number**: RFP/Grant numbers and IDs
- **Agency Name**: Issuing organization
- **Posted Date**: When the opportunity was published
- **Due Date**: Application/proposal deadline
- **Estimated Value**: Contract or grant amount
- **Category**: Type of opportunity (technology, construction, etc.)
- **Location**: Place of performance
- **Contact Information**: Contact details for questions

### Pattern Recognition
The extractor uses sophisticated pattern matching to identify:
- RFP indicators: "RFP", "Request for Proposal", "Solicitation"
- Grant indicators: "Grant Opportunity", "Funding Opportunity"
- Date patterns: Various date formats and keywords
- Value patterns: Currency amounts with multipliers
- Contact patterns: Email addresses and phone numbers

## Integration with Scoring System

All scraped opportunities are automatically:
1. **Validated** using the same validation rules as API data
2. **Scored** using the 4-component scoring algorithm
3. **Stored** in the database with proper source attribution
4. **Deduplicated** to prevent duplicate entries

## Error Handling

### Graceful Degradation
- If Firecrawl API key is not set, scraping features are disabled but core functionality remains
- Individual scraping failures don't affect API data collection
- Comprehensive error logging for debugging

### Rate Limiting
- Respects Firecrawl API rate limits
- Implements retry logic for transient failures
- Configurable timeouts for long-running scraping operations

## Monitoring and Logging

### Sync Logs
All scraping activities are logged in the `sync_logs` table with:
- Source identification
- Records processed/added/updated
- Error counts and messages
- Execution timing

### Health Checks
- Scraping source availability monitoring
- API key validation
- Service health endpoints

## Future Enhancements

### Planned Features
1. **Scheduled Scraping**: Automated periodic scraping of sources
2. **Machine Learning**: Improved opportunity extraction using ML models
3. **Custom Extractors**: User-defined extraction rules for specific sites
4. **Crawl Jobs**: Support for large-scale site crawling
5. **Content Monitoring**: Alerts for new opportunities on watched sites

### Additional Sources
- More state procurement portals
- Federal agency-specific sites
- International opportunity sources
- Industry-specific RFP aggregators

## Testing

### Test Coverage
- Unit tests for extraction logic
- Integration tests for Firecrawl API
- End-to-end tests for complete scraping workflow
- Performance tests for large-scale scraping

### Test Commands
```bash
# Run backend tests (includes Firecrawl tests)
python test_backend.py

# Test specific scraping functionality
curl -X POST http://localhost:5000/api/scraping/test
```

## Security Considerations

### Data Privacy
- No sensitive data is stored in scraped content
- Respects robots.txt and site terms of service
- Rate limiting prevents site overload

### API Security
- Firecrawl API key stored securely in environment variables
- HTTPS-only communication with external services
- Input validation for all scraping requests

## Performance Optimization

### Caching
- Intelligent caching of scraped content
- Duplicate detection prevents redundant processing
- Optimized database queries for large datasets

### Scalability
- Async processing for multiple sources
- Configurable concurrency limits
- Memory-efficient content processing

This integration significantly expands the opportunity dashboard's data collection capabilities, enabling comprehensive coverage of RFP and grant sources across federal, state, and private sectors.

