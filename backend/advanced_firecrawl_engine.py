"""
Advanced Firecrawl Scraping Engine
Handles scraping from 100+ RFP sources with intelligent rate limiting,
error handling, and data normalization
"""
import os
import json
import time
import logging
import asyncio
import aiohttp
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
import random
from urllib.parse import urlparse, urljoin

from advanced_scraping_sources import (
    ALL_SCRAPING_SOURCES,
    get_high_priority_sources,
    get_sources_by_category,
    SCRAPING_CONFIGS
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ScrapingResult:
    source_key: str
    source_name: str
    success: bool
    opportunities_found: int
    opportunities: List[Dict]
    error_message: Optional[str] = None
    scrape_duration: Optional[float] = None
    rate_limited: bool = False

class AdvancedFirecrawlEngine:
    """Advanced web scraping engine using Firecrawl with intelligent handling"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('FIRECRAWL_API_KEY')
        if not self.api_key:
            raise ValueError("FIRECRAWL_API_KEY is required")
        
        self.session = aiohttp.ClientSession()
        self.base_url = "https://api.firecrawl.dev/v0"
        self.headers = {
            'Authorization': f'Bearer {self.api_key.strip()}',
            'Content-Type': 'application/json',
            'User-Agent': 'AdvancedRFPScraper/2.0'
        }
        
        # Rate limiting configuration
        self.rate_limits = {
            'conservative': 10,  # 10 seconds between requests
            'moderate': 5,       # 5 seconds between requests  
            'aggressive': 30     # 30 seconds between requests (for sensitive sites)
        }
        
        # Success tracking
        self.scraping_stats = {
            'total_attempted': 0,
            'total_successful': 0,
            'total_opportunities': 0,
            'sources_by_type': {},
            'errors': []
        }
    
    async def scrape_all_sources(self, 
                                source_limit: int = None,
                                category_filter: str = None,
                                high_priority_only: bool = False) -> List[ScrapingResult]:
        """Scrape opportunities from all configured sources"""
        
        # Determine which sources to scrape
        if high_priority_only:
            sources_to_scrape = get_high_priority_sources()
        elif category_filter:
            sources_to_scrape = get_sources_by_category(category_filter)
            if isinstance(sources_to_scrape, dict) and any(isinstance(v, dict) for v in sources_to_scrape.values()):
                # Flatten nested categories
                flattened = {}
                for category_sources in sources_to_scrape.values():
                    if isinstance(category_sources, dict):
                        flattened.update(category_sources)
                sources_to_scrape = flattened
        else:
            sources_to_scrape = ALL_SCRAPING_SOURCES
        
        if source_limit:
            sources_to_scrape = dict(list(sources_to_scrape.items())[:source_limit])
        
        logger.info(f"Starting scraping of {len(sources_to_scrape)} sources")
        
        # Scrape sources with intelligent batching
        results = []
        batch_size = 5  # Process 5 sources concurrently
        
        source_items = list(sources_to_scrape.items())
        for i in range(0, len(source_items), batch_size):
            batch = source_items[i:i + batch_size]
            
            # Process batch concurrently
            batch_tasks = []
            for source_key, source_config in batch:
                task = self.scrape_single_source(source_key, source_config)
                batch_tasks.append(task)
            
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            
            # Process results and handle exceptions
            for result in batch_results:
                if isinstance(result, Exception):
                    logger.error(f"Batch processing error: {result}")
                else:
                    results.append(result)
                    self._update_stats(result)
            
            # Rate limiting between batches
            if i + batch_size < len(source_items):
                wait_time = random.uniform(2, 5)  # Random delay between batches
                logger.info(f"Waiting {wait_time:.1f}s before next batch...")
                await asyncio.sleep(wait_time)
        
        logger.info(f"Scraping completed. Total results: {len(results)}")
        self._log_final_stats()
        
        return results
    
    async def scrape_single_source(self, source_key: str, source_config: Dict) -> ScrapingResult:
        """Scrape a single source with intelligent error handling"""
        start_time = time.time()
        
        try:
            self.scraping_stats['total_attempted'] += 1
            
            logger.info(f"Scraping {source_key}: {source_config['name']}")
            
            # Get scraping configuration for this source type
            source_type = source_config.get('type', 'state_rfp')
            scraping_config = SCRAPING_CONFIGS.get(source_type, SCRAPING_CONFIGS['state_rfp'])
            
            # Prepare Firecrawl payload
            payload = self._build_firecrawl_payload(source_config, scraping_config)
            
            # Apply rate limiting
            rate_limit_type = scraping_config.get('rate_limit', 'moderate')
            await self._apply_rate_limit(rate_limit_type)
            
            # Make the scraping request
            opportunities = await self._make_firecrawl_request(
                source_config['url'], 
                payload, 
                scraping_config.get('retry_attempts', 2)
            )
            
            # Normalize the extracted data
            normalized_opportunities = self._normalize_opportunities(
                opportunities, 
                source_key, 
                source_config
            )
            
            scrape_duration = time.time() - start_time
            
            result = ScrapingResult(
                source_key=source_key,
                source_name=source_config['name'],
                success=True,
                opportunities_found=len(normalized_opportunities),
                opportunities=normalized_opportunities,
                scrape_duration=scrape_duration
            )
            
            logger.info(f"✅ {source_key}: Found {len(normalized_opportunities)} opportunities ({scrape_duration:.1f}s)")
            return result
            
        except Exception as e:
            scrape_duration = time.time() - start_time
            error_msg = str(e)
            
            logger.error(f"❌ {source_key}: {error_msg} ({scrape_duration:.1f}s)")
            
            # Check if it's a rate limiting error
            is_rate_limited = 'rate limit' in error_msg.lower() or '429' in error_msg
            
            result = ScrapingResult(
                source_key=source_key,
                source_name=source_config['name'],
                success=False,
                opportunities_found=0,
                opportunities=[],
                error_message=error_msg,
                scrape_duration=scrape_duration,
                rate_limited=is_rate_limited
            )
            
            self.scraping_stats['errors'].append({
                'source': source_key,
                'error': error_msg,
                'timestamp': datetime.now().isoformat()
            })
            
            return result
    
    async def _make_firecrawl_request(self, url: str, payload: Dict, retry_attempts: int) -> List[Dict]:
        """Make Firecrawl API request with retries"""
        
        for attempt in range(retry_attempts + 1):
            try:
                async with self.session.post(
                    f"{self.base_url}/scrape",
                    headers=self.headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        opportunities = self._extract_opportunities_from_response(data)
                        return opportunities
                    
                    elif response.status == 429:  # Rate limited
                        if attempt < retry_attempts:
                            wait_time = (2 ** attempt) * 30  # Exponential backoff
                            logger.warning(f"Rate limited, waiting {wait_time}s before retry...")
                            await asyncio.sleep(wait_time)
                            continue
                        else:
                            raise Exception(f"Rate limited after {retry_attempts} retries")
                    
                    elif response.status == 402:  # Payment required
                        raise Exception("Firecrawl quota exceeded")
                    
                    elif response.status == 401:  # Unauthorized
                        raise Exception("Firecrawl API key invalid")
                    
                    else:
                        error_text = await response.text()
                        raise Exception(f"HTTP {response.status}: {error_text}")
            
            except asyncio.TimeoutError:
                if attempt < retry_attempts:
                    logger.warning(f"Timeout on attempt {attempt + 1}, retrying...")
                    await asyncio.sleep(5)
                    continue
                else:
                    raise Exception("Request timed out after retries")
            
            except Exception as e:
                if attempt < retry_attempts:
                    logger.warning(f"Error on attempt {attempt + 1}: {e}, retrying...")
                    await asyncio.sleep(2)
                    continue
                else:
                    raise e
        
        return []
    
    def _build_firecrawl_payload(self, source_config: Dict, scraping_config: Dict) -> Dict:
        """Build Firecrawl payload for the specific source"""
        
        # Base payload
        payload = {
            'url': source_config['url'],
            'extract': scraping_config['extract_schema']
        }
        
        # Add source-specific configurations
        source_type = source_config.get('type')
        
        if source_type == 'private_rfp':
            # More conservative for private sector
            payload['pageOptions'] = {
                'waitFor': 3000,  # Wait longer for dynamic content
                'screenshot': False,
                'headers': {
                    'User-Agent': 'Mozilla/5.0 (compatible; RFPBot/1.0)'
                }
            }
        
        elif source_type in ['state_rfp', 'local_rfp']:
            # Government sites often have anti-bot measures
            payload['pageOptions'] = {
                'waitFor': 2000,
                'screenshot': False,
                'headers': {
                    'User-Agent': 'Mozilla/5.0 (compatible; GovBot/1.0)'
                }
            }
        
        elif source_type == 'international':
            # International sites may need special handling
            payload['pageOptions'] = {
                'waitFor': 4000,
                'screenshot': False
            }
        
        # Add custom extraction hints if available
        if 'extraction_hints' in source_config:
            payload['extractionHints'] = source_config['extraction_hints']
        
        return payload
    
    def _extract_opportunities_from_response(self, response_data: Dict) -> List[Dict]:
        """Extract opportunities from Firecrawl response"""
        opportunities = []
        
        # Try different response structures
        if 'data' in response_data:
            if 'extract' in response_data['data']:
                extract_data = response_data['data']['extract']
            else:
                extract_data = response_data['data']
        elif 'extract' in response_data:
            extract_data = response_data['extract']
        else:
            extract_data = response_data
        
        # Extract opportunities array
        if isinstance(extract_data, dict) and 'opportunities' in extract_data:
            opportunities = extract_data['opportunities']
        elif isinstance(extract_data, list):
            opportunities = extract_data
        
        # Fallback: try to extract from content
        if not opportunities and 'content' in response_data.get('data', {}):
            opportunities = self._extract_from_content(response_data['data']['content'])
        
        return opportunities if isinstance(opportunities, list) else []
    
    def _extract_from_content(self, content: str) -> List[Dict]:
        """Extract opportunities from raw content using patterns"""
        # This is a fallback method when structured extraction fails
        # Implementation would include regex patterns and NLP
        
        opportunities = []
        
        # Simple pattern matching for common RFP indicators
        rfp_indicators = [
            'request for proposal', 'rfp', 'solicitation', 'bid opportunity',
            'procurement notice', 'contract opportunity', 'grant opportunity'
        ]
        
        lines = content.split('\n')
        current_opportunity = {}
        
        for line in lines:
            line = line.strip().lower()
            
            if any(indicator in line for indicator in rfp_indicators):
                if current_opportunity:
                    opportunities.append(current_opportunity)
                
                current_opportunity = {
                    'title': line[:100],  # Take first 100 chars as title
                    'description': line,
                    'source': 'content_extraction'
                }
        
        if current_opportunity:
            opportunities.append(current_opportunity)
        
        return opportunities[:10]  # Limit to 10 opportunities from content extraction
    
    def _normalize_opportunities(self, opportunities: List[Dict], source_key: str, source_config: Dict) -> List[Dict]:
        """Normalize opportunities to standard format"""
        normalized = []
        
        for i, opp in enumerate(opportunities):
            if not opp or not isinstance(opp, dict):
                continue
            
            # Build normalized opportunity
            normalized_opp = {
                'id': f"{source_key}-{i+1:03d}",
                'title': self._extract_title(opp),
                'description': self._extract_description(opp),
                'agency_name': self._extract_agency(opp, source_config),
                'estimated_value': self._extract_value(opp),
                'due_date': self._extract_due_date(opp),
                'posted_date': self._extract_posted_date(opp),
                'status': 'active',
                'source_type': source_config.get('type', 'scraped'),
                'source_name': f"Firecrawl - {source_config['name']}",
                'source_url': source_config['url'],
                'opportunity_number': f"FC-{source_key.upper()}-{i+1:03d}",
                'contact_info': self._extract_contact(opp),
                'location': self._extract_location(opp, source_config),
                'industry': source_config.get('industry'),
                'total_score': self._calculate_base_score(opp, source_config),
                'scraped_at': datetime.now().isoformat()
            }
            
            # Only include if we have minimum required data
            if normalized_opp['title'] and len(normalized_opp['title']) > 10:
                normalized.append(normalized_opp)
        
        return normalized
    
    def _extract_title(self, opp: Dict) -> str:
        """Extract title from opportunity data"""
        title_fields = ['title', 'name', 'subject', 'opportunity_title', 'solicitation_title']
        
        for field in title_fields:
            if field in opp and opp[field]:
                title = str(opp[field]).strip()
                if len(title) > 10:  # Minimum title length
                    return title[:200]  # Max title length
        
        return "Scraped Opportunity"
    
    def _extract_description(self, opp: Dict) -> str:
        """Extract description from opportunity data"""
        desc_fields = ['description', 'summary', 'details', 'scope', 'requirements', 'overview']
        
        for field in desc_fields:
            if field in opp and opp[field]:
                desc = str(opp[field]).strip()
                if len(desc) > 20:
                    return desc[:1000]  # Limit description length
        
        return "No description available"
    
    def _extract_agency(self, opp: Dict, source_config: Dict) -> str:
        """Extract agency/organization name"""
        agency_fields = ['agency', 'organization', 'department', 'entity', 'client', 'company']
        
        for field in agency_fields:
            if field in opp and opp[field]:
                return str(opp[field]).strip()[:100]
        
        # Fallback to source name
        return source_config.get('name', 'Unknown Agency')
    
    def _extract_value(self, opp: Dict) -> Optional[float]:
        """Extract estimated value"""
        value_fields = ['value', 'budget', 'amount', 'contract_value', 'estimated_value', 'award_amount']
        
        for field in value_fields:
            if field in opp and opp[field]:
                value_str = str(opp[field])
                return self._parse_currency_value(value_str)
        
        return None
    
    def _parse_currency_value(self, value_str: str) -> Optional[float]:
        """Parse currency string to float"""
        import re
        
        if not value_str:
            return None
        
        # Remove currency symbols and clean
        cleaned = re.sub(r'[,$€£¥]', '', value_str)
        cleaned = re.sub(r'[^\d.,]', '', cleaned)
        
        if not cleaned:
            return None
        
        try:
            # Handle different decimal separators
            if ',' in cleaned and '.' in cleaned:
                # Assume comma is thousands separator
                cleaned = cleaned.replace(',', '')
            elif ',' in cleaned:
                # Could be decimal separator (European style)
                if len(cleaned.split(',')[-1]) <= 2:
                    cleaned = cleaned.replace(',', '.')
                else:
                    cleaned = cleaned.replace(',', '')
            
            value = float(cleaned)
            
            # Handle millions/billions notation
            original_lower = value_str.lower()
            if 'million' in original_lower or 'm' in original_lower:
                value *= 1000000
            elif 'billion' in original_lower or 'b' in original_lower:
                value *= 1000000000
            elif 'thousand' in original_lower or 'k' in original_lower:
                value *= 1000
            
            return value
            
        except ValueError:
            return None
    
    def _extract_due_date(self, opp: Dict) -> Optional[str]:
        """Extract due date"""
        date_fields = ['due_date', 'deadline', 'closing_date', 'submission_deadline', 'expires']
        
        for field in date_fields:
            if field in opp and opp[field]:
                date_str = str(opp[field]).strip()
                parsed_date = self._parse_date(date_str)
                if parsed_date:
                    return parsed_date
        
        return None
    
    def _extract_posted_date(self, opp: Dict) -> Optional[str]:
        """Extract posted date"""
        date_fields = ['posted_date', 'published_date', 'issue_date', 'created_date']
        
        for field in date_fields:
            if field in opp and opp[field]:
                date_str = str(opp[field]).strip()
                parsed_date = self._parse_date(date_str)
                if parsed_date:
                    return parsed_date
        
        # Default to today if no posted date found
        return datetime.now().strftime('%Y-%m-%d')
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse various date formats to ISO format"""
        import re
        from dateutil import parser
        
        if not date_str:
            return None
        
        try:
            # Try direct parsing with dateutil
            parsed = parser.parse(date_str, fuzzy=True)
            return parsed.strftime('%Y-%m-%d')
        except:
            # Try regex patterns for common formats
            patterns = [
                r'(\d{4}-\d{2}-\d{2})',
                r'(\d{2}/\d{2}/\d{4})',
                r'(\d{1,2}/\d{1,2}/\d{4})',
                r'(\d{2}-\d{2}-\d{4})'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, date_str)
                if match:
                    try:
                        parsed = parser.parse(match.group(1))
                        return parsed.strftime('%Y-%m-%d')
                    except:
                        continue
        
        return None
    
    def _extract_contact(self, opp: Dict) -> Optional[str]:
        """Extract contact information"""
        contact_fields = ['contact', 'contact_info', 'contact_person', 'email', 'phone']
        
        contact_parts = []
        for field in contact_fields:
            if field in opp and opp[field]:
                contact_parts.append(f"{field}: {opp[field]}")
        
        return "; ".join(contact_parts) if contact_parts else None
    
    def _extract_location(self, opp: Dict, source_config: Dict) -> Optional[str]:
        """Extract location information"""
        location_fields = ['location', 'state', 'city', 'region', 'country']
        
        for field in location_fields:
            if field in opp and opp[field]:
                return str(opp[field]).strip()
        
        # Fallback to source location info
        if 'state' in source_config:
            return source_config['state']
        elif 'region' in source_config:
            return source_config['region']
        
        return None
    
    def _calculate_base_score(self, opp: Dict, source_config: Dict) -> int:
        """Calculate base relevance score for opportunity"""
        score = 50  # Base score
        
        # Higher score for government sources
        if source_config.get('type') in ['state_rfp', 'local_rfp', 'federal_contract']:
            score += 15
        
        # Higher score if value is specified
        if self._extract_value(opp):
            score += 10
        
        # Higher score for recent postings
        posted_date = self._extract_posted_date(opp)
        if posted_date:
            try:
                posted = datetime.fromisoformat(posted_date)
                days_old = (datetime.now() - posted).days
                if days_old <= 7:
                    score += 10
                elif days_old <= 30:
                    score += 5
            except:
                pass
        
        # Higher score for detailed descriptions
        description = self._extract_description(opp)
        if len(description) > 200:
            score += 5
        
        return min(100, score)  # Cap at 100
    
    async def _apply_rate_limit(self, rate_limit_type: str):
        """Apply rate limiting between requests"""
        wait_time = self.rate_limits.get(rate_limit_type, 5)
        # Add some randomness to avoid synchronized requests
        actual_wait = wait_time + random.uniform(0, 2)
        await asyncio.sleep(actual_wait)
    
    def _update_stats(self, result: ScrapingResult):
        """Update scraping statistics"""
        if result.success:
            self.scraping_stats['total_successful'] += 1
            self.scraping_stats['total_opportunities'] += result.opportunities_found
        
        # Track by source type
        source_type = result.source_key.split('_')[0] if '_' in result.source_key else 'unknown'
        if source_type not in self.scraping_stats['sources_by_type']:
            self.scraping_stats['sources_by_type'][source_type] = {
                'attempted': 0, 'successful': 0, 'opportunities': 0
            }
        
        self.scraping_stats['sources_by_type'][source_type]['attempted'] += 1
        if result.success:
            self.scraping_stats['sources_by_type'][source_type]['successful'] += 1
            self.scraping_stats['sources_by_type'][source_type]['opportunities'] += result.opportunities_found
    
    def _log_final_stats(self):
        """Log final scraping statistics"""
        stats = self.scraping_stats
        success_rate = (stats['total_successful'] / max(1, stats['total_attempted'])) * 100
        
        logger.info(f"""
🎯 SCRAPING COMPLETED
=====================================
📊 Sources: {stats['total_attempted']} attempted, {stats['total_successful']} successful ({success_rate:.1f}%)
🎯 Opportunities: {stats['total_opportunities']} total found
❌ Errors: {len(stats['errors'])}

📈 By Source Type:""")
        
        for source_type, type_stats in stats['sources_by_type'].items():
            type_success_rate = (type_stats['successful'] / max(1, type_stats['attempted'])) * 100
            logger.info(f"   {source_type}: {type_stats['opportunities']} opportunities ({type_success_rate:.1f}% success)")
    
    async def close(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()

# Convenience functions for easy use

async def quick_scrape_high_priority(api_key: str = None) -> List[ScrapingResult]:
    """Quick scraping of high-priority sources"""
    engine = AdvancedFirecrawlEngine(api_key)
    try:
        results = await engine.scrape_all_sources(high_priority_only=True)
        return results
    finally:
        await engine.close()

async def scrape_by_category(category: str, api_key: str = None) -> List[ScrapingResult]:
    """Scrape sources by category (government, private, international, etc.)"""
    engine = AdvancedFirecrawlEngine(api_key)
    try:
        results = await engine.scrape_all_sources(category_filter=category)
        return results
    finally:
        await engine.close()

async def full_scrape_session(source_limit: int = 50, api_key: str = None) -> List[ScrapingResult]:
    """Full scraping session with all sources"""
    engine = AdvancedFirecrawlEngine(api_key)
    try:
        results = await engine.scrape_all_sources(source_limit=source_limit)
        return results
    finally:
        await engine.close()

if __name__ == "__main__":
    # Example usage
    async def main():
        # Test with high priority sources
        results = await quick_scrape_high_priority()
        
        print(f"Scraped {len(results)} sources")
        for result in results:
            if result.success:
                print(f"✅ {result.source_name}: {result.opportunities_found} opportunities")
            else:
                print(f"❌ {result.source_name}: {result.error_message}")
    
    # Run the example
    # asyncio.run(main())