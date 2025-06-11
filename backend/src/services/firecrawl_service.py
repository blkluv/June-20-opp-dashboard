from firecrawl import FirecrawlApp
import os
import re
import json
from datetime import datetime, date
from typing import Dict, List, Any, Optional
from dateutil import parser
import logging


class FirecrawlClient:
    """Client for Firecrawl API to scrape RFP and grant opportunities from websites"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('FIRECRAWL_API_KEY')
        if not self.api_key:
            raise ValueError("Firecrawl API key not provided. Set FIRECRAWL_API_KEY environment variable.")
        
        self.app = FirecrawlApp(api_key=self.api_key)
        self.logger = logging.getLogger(__name__)
    
    def scrape_url(self, url: str, extract_schema: Optional[Dict] = None) -> Dict[str, Any]:
        """Scrape a single URL and extract structured data"""
        try:
            scrape_params = {
                'formats': ['markdown', 'html'],
                'includeTags': ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'a', 'table', 'div'],
                'excludeTags': ['script', 'style', 'nav', 'footer', 'header'],
                'waitFor': 2000  # Wait 2 seconds for dynamic content
            }
            
            if extract_schema:
                scrape_params['extract'] = {
                    'schema': extract_schema,
                    'systemPrompt': 'Extract RFP and grant opportunity information from this page.'
                }
            
            result = self.app.scrape_url(url, scrape_params)
            
            if result.get('success'):
                return {
                    'success': True,
                    'data': result.get('data', {}),
                    'markdown': result.get('data', {}).get('markdown', ''),
                    'html': result.get('data', {}).get('html', ''),
                    'metadata': result.get('data', {}).get('metadata', {}),
                    'extract': result.get('data', {}).get('extract', {})
                }
            else:
                return {
                    'success': False,
                    'error': result.get('error', 'Unknown error')
                }
                
        except Exception as e:
            self.logger.error(f"Error scraping {url}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def crawl_site(self, url: str, max_pages: int = 50, include_patterns: Optional[List[str]] = None) -> Dict[str, Any]:
        """Crawl a website to find RFP/grant opportunities"""
        try:
            crawl_params = {
                'limit': max_pages,
                'scrapeOptions': {
                    'formats': ['markdown'],
                    'includeTags': ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'a', 'table'],
                    'excludeTags': ['script', 'style', 'nav', 'footer']
                }
            }
            
            if include_patterns:
                crawl_params['includePaths'] = include_patterns
            
            # Start crawl job
            crawl_result = self.app.crawl_url(url, crawl_params)
            
            if crawl_result.get('success'):
                return {
                    'success': True,
                    'job_id': crawl_result.get('id'),
                    'data': crawl_result.get('data', [])
                }
            else:
                return {
                    'success': False,
                    'error': crawl_result.get('error', 'Crawl failed')
                }
                
        except Exception as e:
            self.logger.error(f"Error crawling {url}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_crawl_status(self, job_id: str) -> Dict[str, Any]:
        """Get status of a crawl job"""
        try:
            status = self.app.check_crawl_status(job_id)
            return {
                'success': True,
                'status': status.get('status'),
                'completed': status.get('completed', 0),
                'total': status.get('total', 0),
                'data': status.get('data', [])
            }
        except Exception as e:
            self.logger.error(f"Error checking crawl status {job_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


class RFPExtractor:
    """Extract RFP/grant opportunity data from scraped content"""
    
    # Schema for extracting opportunity data
    OPPORTUNITY_SCHEMA = {
        "type": "object",
        "properties": {
            "opportunities": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "Title of the RFP or grant opportunity"},
                        "description": {"type": "string", "description": "Description or summary of the opportunity"},
                        "opportunity_number": {"type": "string", "description": "RFP number, solicitation number, or grant number"},
                        "agency_name": {"type": "string", "description": "Name of the issuing agency or organization"},
                        "posted_date": {"type": "string", "description": "Date when the opportunity was posted"},
                        "due_date": {"type": "string", "description": "Application or proposal due date"},
                        "estimated_value": {"type": "string", "description": "Estimated contract value or grant amount"},
                        "category": {"type": "string", "description": "Category or type of opportunity"},
                        "location": {"type": "string", "description": "Place of performance or geographic location"},
                        "contact_info": {"type": "string", "description": "Contact information for questions"},
                        "source_url": {"type": "string", "description": "URL where this opportunity was found"}
                    },
                    "required": ["title"]
                }
            }
        }
    }
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def extract_opportunities_from_content(self, content: str, source_url: str) -> List[Dict[str, Any]]:
        """Extract opportunities from scraped content using pattern matching"""
        opportunities = []
        
        # Common RFP/grant indicators
        rfp_patterns = [
            r'(?i)rfp\s*[#:]?\s*(\w+[-\w]*)',
            r'(?i)request\s+for\s+proposal[s]?\s*[#:]?\s*(\w+[-\w]*)',
            r'(?i)solicitation\s*[#:]?\s*(\w+[-\w]*)',
            r'(?i)grant\s+opportunity\s*[#:]?\s*(\w+[-\w]*)',
            r'(?i)funding\s+opportunity\s*[#:]?\s*(\w+[-\w]*)'
        ]
        
        # Date patterns
        date_patterns = [
            r'(?i)due\s+date[:\s]+([^\n\r]+)',
            r'(?i)deadline[:\s]+([^\n\r]+)',
            r'(?i)closes?\s+on[:\s]+([^\n\r]+)',
            r'(?i)submission\s+date[:\s]+([^\n\r]+)'
        ]
        
        # Value patterns
        value_patterns = [
            r'\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|k|thousand))?',
            r'(?i)estimated\s+value[:\s]+\$?[\d,]+',
            r'(?i)contract\s+value[:\s]+\$?[\d,]+',
            r'(?i)award\s+amount[:\s]+\$?[\d,]+'
        ]
        
        # Split content into potential opportunity sections
        sections = self._split_into_sections(content)
        
        for section in sections:
            opportunity = self._extract_opportunity_from_section(section, source_url)
            if opportunity:
                opportunities.append(opportunity)
        
        return opportunities
    
    def _split_into_sections(self, content: str) -> List[str]:
        """Split content into sections that might contain individual opportunities"""
        # Split by common section delimiters
        delimiters = [
            r'\n\s*#{1,3}\s+',  # Markdown headers
            r'\n\s*\d+\.\s+',   # Numbered lists
            r'\n\s*[-*]\s+',    # Bullet points
            r'\n\s*RFP\s*[#:]',  # RFP indicators
            r'\n\s*Grant\s+',   # Grant indicators
        ]
        
        sections = [content]
        
        for delimiter in delimiters:
            new_sections = []
            for section in sections:
                parts = re.split(delimiter, section)
                new_sections.extend([part.strip() for part in parts if part.strip()])
            sections = new_sections
        
        # Filter sections that are likely to contain opportunities
        filtered_sections = []
        for section in sections:
            if len(section) > 100 and any(keyword in section.lower() for keyword in 
                ['rfp', 'request for proposal', 'grant', 'solicitation', 'opportunity', 'funding']):
                filtered_sections.append(section)
        
        return filtered_sections[:20]  # Limit to first 20 sections
    
    def _extract_opportunity_from_section(self, section: str, source_url: str) -> Optional[Dict[str, Any]]:
        """Extract opportunity data from a content section"""
        # Extract title (usually first line or header)
        lines = section.split('\n')
        title = None
        
        for line in lines[:5]:  # Check first 5 lines
            line = line.strip()
            if len(line) > 10 and len(line) < 200:
                # Remove markdown formatting
                title = re.sub(r'[#*_`]', '', line).strip()
                if title:
                    break
        
        if not title:
            return None
        
        # Extract other fields
        opportunity = {
            'title': title,
            'description': self._extract_description(section),
            'opportunity_number': self._extract_opportunity_number(section),
            'agency_name': self._extract_agency_name(section),
            'posted_date': self._extract_date(section, 'posted'),
            'due_date': self._extract_date(section, 'due'),
            'estimated_value': self._extract_value(section),
            'category': self._extract_category(section),
            'location': self._extract_location(section),
            'contact_info': self._extract_contact_info(section),
            'source_url': source_url,
            'source_type': 'scraped',
            'source_name': 'Firecrawl'
        }
        
        return opportunity
    
    def _extract_description(self, section: str) -> str:
        """Extract description from section"""
        # Remove title line and get first paragraph
        lines = section.split('\n')[1:]
        description_lines = []
        
        for line in lines:
            line = line.strip()
            if len(line) > 20 and not line.startswith(('Due:', 'Deadline:', 'Contact:', 'Value:')):
                description_lines.append(line)
                if len(' '.join(description_lines)) > 500:  # Limit description length
                    break
        
        return ' '.join(description_lines)[:1000]  # Max 1000 chars
    
    def _extract_opportunity_number(self, section: str) -> Optional[str]:
        """Extract opportunity/RFP number"""
        patterns = [
            r'(?i)rfp\s*[#:]?\s*([A-Z0-9-]+)',
            r'(?i)solicitation\s*[#:]?\s*([A-Z0-9-]+)',
            r'(?i)grant\s*[#:]?\s*([A-Z0-9-]+)',
            r'(?i)opportunity\s*[#:]?\s*([A-Z0-9-]+)',
            r'(?i)number\s*[#:]?\s*([A-Z0-9-]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, section)
            if match:
                return match.group(1)
        
        return None
    
    def _extract_agency_name(self, section: str) -> Optional[str]:
        """Extract agency or organization name"""
        patterns = [
            r'(?i)agency[:\s]+([^\n\r]+)',
            r'(?i)department[:\s]+([^\n\r]+)',
            r'(?i)organization[:\s]+([^\n\r]+)',
            r'(?i)issued\s+by[:\s]+([^\n\r]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, section)
            if match:
                return match.group(1).strip()[:200]
        
        return None
    
    def _extract_date(self, section: str, date_type: str) -> Optional[date]:
        """Extract dates from section"""
        if date_type == 'due':
            patterns = [
                r'(?i)due\s+date[:\s]+([^\n\r]+)',
                r'(?i)deadline[:\s]+([^\n\r]+)',
                r'(?i)closes?\s+on[:\s]+([^\n\r]+)',
                r'(?i)submission\s+date[:\s]+([^\n\r]+)'
            ]
        else:  # posted date
            patterns = [
                r'(?i)posted\s+date[:\s]+([^\n\r]+)',
                r'(?i)published[:\s]+([^\n\r]+)',
                r'(?i)issued[:\s]+([^\n\r]+)'
            ]
        
        for pattern in patterns:
            match = re.search(pattern, section)
            if match:
                date_str = match.group(1).strip()
                try:
                    return parser.parse(date_str).date()
                except:
                    continue
        
        return None
    
    def _extract_value(self, section: str) -> Optional[float]:
        """Extract estimated value"""
        patterns = [
            r'\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion))?',
            r'(?i)estimated\s+value[:\s]+\$?([\d,]+)',
            r'(?i)contract\s+value[:\s]+\$?([\d,]+)',
            r'(?i)award\s+amount[:\s]+\$?([\d,]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, section)
            if match:
                value_str = match.group(0) if '$' in match.group(0) else match.group(1)
                try:
                    # Clean and convert to float
                    value_str = re.sub(r'[,$]', '', value_str)
                    value = float(value_str)
                    
                    # Handle millions/billions
                    if 'million' in section.lower():
                        value *= 1000000
                    elif 'billion' in section.lower():
                        value *= 1000000000
                    
                    return value
                except:
                    continue
        
        return None
    
    def _extract_category(self, section: str) -> Optional[str]:
        """Extract opportunity category"""
        categories = {
            'technology': ['software', 'it', 'technology', 'computer', 'digital', 'cyber'],
            'construction': ['construction', 'building', 'infrastructure', 'engineering'],
            'services': ['services', 'consulting', 'professional', 'support'],
            'healthcare': ['medical', 'health', 'clinical', 'hospital'],
            'education': ['education', 'training', 'academic', 'school'],
            'research': ['research', 'development', 'innovation', 'study']
        }
        
        section_lower = section.lower()
        for category, keywords in categories.items():
            if any(keyword in section_lower for keyword in keywords):
                return category
        
        return None
    
    def _extract_location(self, section: str) -> Optional[str]:
        """Extract location information"""
        patterns = [
            r'(?i)location[:\s]+([^\n\r]+)',
            r'(?i)place\s+of\s+performance[:\s]+([^\n\r]+)',
            r'(?i)state[:\s]+([A-Z]{2})',
            r'(?i)city[:\s]+([^\n\r,]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, section)
            if match:
                return match.group(1).strip()[:100]
        
        return None
    
    def _extract_contact_info(self, section: str) -> Optional[str]:
        """Extract contact information"""
        patterns = [
            r'(?i)contact[:\s]+([^\n\r]+)',
            r'(?i)questions[:\s]+([^\n\r]+)',
            r'[\w\.-]+@[\w\.-]+\.\w+',  # Email pattern
            r'\(\d{3}\)\s*\d{3}-\d{4}'  # Phone pattern
        ]
        
        contacts = []
        for pattern in patterns:
            matches = re.findall(pattern, section)
            contacts.extend(matches)
        
        return '; '.join(contacts[:3]) if contacts else None  # Max 3 contact items


class FirecrawlScrapeService:
    """Service for scraping RFP opportunities using Firecrawl"""
    
    # Predefined sources to scrape
    SCRAPE_SOURCES = {
        'california_procurement': {
            'url': 'https://caleprocure.ca.gov/pages/public-search.aspx',
            'name': 'California eProcure',
            'type': 'state_rfp',
            'include_patterns': ['/event/', '/solicitation/']
        },
        'texas_procurement': {
            'url': 'https://www.txsmartbuy.com/sp',
            'name': 'Texas SmartBuy',
            'type': 'state_rfp',
            'include_patterns': ['/solicitation/', '/rfp/']
        },
        'new_york_procurement': {
            'url': 'https://www.ogs.ny.gov/procurement/',
            'name': 'New York State Procurement',
            'type': 'state_rfp',
            'include_patterns': ['/solicitation/', '/rfp/', '/bid/']
        },
        'rfpmart': {
            'url': 'https://www.rfpmart.com/',
            'name': 'RFPMart',
            'type': 'private_rfp',
            'include_patterns': ['/rfp/', '/solicitation/']
        }
    }
    
    def __init__(self, api_key: Optional[str] = None):
        self.firecrawl_client = FirecrawlClient(api_key)
        self.extractor = RFPExtractor()
        self.logger = logging.getLogger(__name__)
    
    def scrape_source(self, source_key: str) -> Dict[str, Any]:
        """Scrape a predefined source for opportunities"""
        if source_key not in self.SCRAPE_SOURCES:
            return {
                'success': False,
                'error': f'Unknown source: {source_key}'
            }
        
        source_config = self.SCRAPE_SOURCES[source_key]
        
        try:
            # First, scrape the main page
            main_result = self.firecrawl_client.scrape_url(
                source_config['url'],
                extract_schema=self.extractor.OPPORTUNITY_SCHEMA
            )
            
            if not main_result['success']:
                return main_result
            
            opportunities = []
            
            # Extract opportunities from main page
            if main_result.get('markdown'):
                main_opportunities = self.extractor.extract_opportunities_from_content(
                    main_result['markdown'],
                    source_config['url']
                )
                opportunities.extend(main_opportunities)
            
            # If extraction schema was used, add those results too
            if main_result.get('extract', {}).get('opportunities'):
                for opp in main_result['extract']['opportunities']:
                    opp['source_type'] = source_config['type']
                    opp['source_name'] = source_config['name']
                    opportunities.append(opp)
            
            return {
                'success': True,
                'source': source_config['name'],
                'opportunities': opportunities,
                'total_found': len(opportunities)
            }
            
        except Exception as e:
            self.logger.error(f"Error scraping {source_key}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def scrape_custom_url(self, url: str, source_name: str = 'Custom') -> Dict[str, Any]:
        """Scrape a custom URL for opportunities"""
        try:
            result = self.firecrawl_client.scrape_url(
                url,
                extract_schema=self.extractor.OPPORTUNITY_SCHEMA
            )
            
            if not result['success']:
                return result
            
            opportunities = []
            
            # Extract opportunities from content
            if result.get('markdown'):
                extracted_opportunities = self.extractor.extract_opportunities_from_content(
                    result['markdown'],
                    url
                )
                opportunities.extend(extracted_opportunities)
            
            # Add schema-extracted opportunities
            if result.get('extract', {}).get('opportunities'):
                opportunities.extend(result['extract']['opportunities'])
            
            # Set source information
            for opp in opportunities:
                opp['source_name'] = source_name
                opp['source_type'] = 'scraped'
            
            return {
                'success': True,
                'source': source_name,
                'url': url,
                'opportunities': opportunities,
                'total_found': len(opportunities)
            }
            
        except Exception as e:
            self.logger.error(f"Error scraping {url}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_available_sources(self) -> List[Dict[str, str]]:
        """Get list of available scraping sources"""
        return [
            {
                'key': key,
                'name': config['name'],
                'url': config['url'],
                'type': config['type']
            }
            for key, config in self.SCRAPE_SOURCES.items()
        ]

