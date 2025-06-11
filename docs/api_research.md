
# API Research for Opportunity Dashboard

## Federal Government APIs

### SAM.gov Get Opportunities Public API
- **URL**: https://api.sam.gov/opportunities/v2/search (Production)
- **Purpose**: Federal contract opportunities and RFPs
- **Authentication**: Requires API key (free registration)
- **Rate Limits**: Limited based on federal/non-federal roles
- **Data Types**: 
  - Justification (J&A)
  - Pre solicitation
  - Award Notice
  - Sources Sought
  - Special Notice
  - Solicitation
  - Sale of Surplus
- **Key Features**:
  - Daily updates for active notices
  - Weekly updates for archived notices
  - Comprehensive opportunity details including awards, contacts, descriptions
  - Pagination support
  - Search by various parameters (department, office, NAICS code, etc.)



### Grants.gov Search2 API
- **URL**: https://api.grants.gov/v1/api/search2
- **Purpose**: Federal grant opportunities search
- **Authentication**: No authentication required (public API)
- **Method**: POST request
- **Key Features**:
  - Search by keywords, opportunity numbers, agencies
  - Filter by eligibilities, funding instruments, categories
  - Date range filtering (open date, close date)
  - Status filtering (posted, closed, archived, forecasted)
  - Pagination support
  - Returns opportunity details including agency, title, dates, status, document type


### USASpending.gov API
- **URL**: https://api.usaspending.gov/
- **Purpose**: Comprehensive U.S. government spending data including contracts and grants
- **Authentication**: No authentication required (public API)
- **Version**: V2 (V1 deprecated)
- **Key Features**:
  - Award details (contracts, grants, loans)
  - Agency breakdowns and spending
  - Geographic breakdowns
  - Federal account information
  - Recipient information
  - Search and autocomplete functionality
  - Historical spending data
  - No rate limits mentioned


## State and Local Government APIs

### California Cal eProcure
- **URL**: https://caleprocure.ca.gov/
- **Purpose**: California state procurement and bidding system
- **API Availability**: No public API found, appears to be a web portal only
- **Key Features**:
  - California State Contracts Register (CSCR) for bid opportunities
  - State Contracting and Procurement Registration System (SCPRS)
  - Certified Small Business and Disabled Veteran Business Enterprise search
  - Contract search

### Texas SmartBuy
- **URL**: https://www.txsmartbuy.gov/
- **Purpose**: Texas state procurement system
- **API Availability**: No public API found, appears to be a web portal only
- **Key Features**:
  - Contract search
  - Electronic State Business Daily Search (ESBD)
  - Vendor Performance Tracking System (VPTS)
  - Purchase order lookup

### New York State Procurement
- **URL**: Various department websites
- **Purpose**: New York state procurement opportunities
- **API Availability**: No centralized API found
- **Key Features**:
  - Decentralized across multiple department websites
  - New York State Contract Reporter for opportunities
  - Department-specific RFP listings


## Private Foundation and Grant APIs

### Candid Grants API (formerly Foundation Center)
- **URL**: https://developer.candid.org/
- **Purpose**: Comprehensive foundation and grant data
- **Authentication**: API key required (paid service)
- **Key Features**:
  - Grant transactions with funder, recipient, and grant details
  - Funder search and analysis
  - Recipient funding activities
  - Summary statistics and aggregations
  - Search by subject area, location, amount ranges
  - Historical grant data from multiple sources (990 forms, foundation websites, etc.)

### OpenGrants API
- **URL**: https://opengrants.io/opengrants-api/
- **Purpose**: Grant funding database and marketplace
- **Authentication**: API key required (paid service)
- **Key Features**:
  - Grant matching using AI engine
  - Consultant and technical assistance provider marketplace
  - Custom integration capabilities
  - Developer portal for API management


## Private Sector and Mixed RFP Sources

### RFP Database (RFPDB.com)
- **URL**: https://www.rfpdb.com/
- **Purpose**: Government, for-profit, and non-profit RFPs
- **API Availability**: No public API found, acquired by MyGovWatch.com
- **Key Features**:
  - Free access to RFP listings
  - Categories include business services, construction, creative, health services, professional services
  - Government and private sector opportunities
  - No subscription fees mentioned

### RFPMart.com
- **URL**: https://www.rfpmart.com/
- **Purpose**: Government RFPs from multiple countries
- **API Availability**: API & Email Preferences mentioned but details not clear
- **Key Features**:
  - RFPs from USA, Canada, Australia, UK, India
  - Categories include web design, mobile development, call center, data entry, AI/ML
  - Both active and expired RFPs
  - Digital and physical submission types
  - RSS/Atom feeds available
  - Premium subscription services


## Summary of Free APIs Available

### Confirmed Free APIs:
1. **SAM.gov Get Opportunities Public API** - Federal contracts and RFPs (requires free API key)
2. **Grants.gov Search2 API** - Federal grant opportunities (no authentication required)
3. **USASpending.gov API** - Federal spending data including contracts and grants (no authentication required)

### Limited or No API Access:
1. **State Government Systems** - Most state procurement systems (California Cal eProcure, Texas SmartBuy, New York) appear to be web portals only without public APIs
2. **Private Foundation APIs** - Candid and OpenGrants require paid subscriptions
3. **Private Sector RFPs** - RFPDB and RFPMart have limited or unclear API access

### Potential Data Sources for Web Scraping:
1. **State Procurement Portals** - Could be scraped but would require careful compliance with terms of service
2. **RFP Aggregator Sites** - RFPMart offers RSS feeds which could be used
3. **Individual Agency Websites** - Many agencies post RFPs on their own websites

### Recommendations for MVP:
1. Start with the three confirmed free federal APIs
2. Implement web scraping for key state procurement portals
3. Add RSS feed integration for RFPMart
4. Consider paid APIs for foundation grants in future versions

