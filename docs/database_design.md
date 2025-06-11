# Database Schema Design for Opportunity Dashboard

## Core Tables

### 1. Opportunities Table
This is the main table storing all RFP and grant opportunities from various sources.

```sql
CREATE TABLE opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id VARCHAR(255) UNIQUE NOT NULL,  -- Unique ID from source system
    source_type VARCHAR(50) NOT NULL,        -- 'federal_contract', 'federal_grant', 'state_rfp', 'private_rfp', etc.
    source_name VARCHAR(100) NOT NULL,       -- 'SAM.gov', 'Grants.gov', 'Cal eProcure', etc.
    
    -- Basic Information
    title VARCHAR(500) NOT NULL,
    description TEXT,
    opportunity_number VARCHAR(100),
    
    -- Dates
    posted_date DATE,
    due_date DATE,
    close_date DATE,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Financial Information
    estimated_value DECIMAL(15,2),
    min_award_amount DECIMAL(15,2),
    max_award_amount DECIMAL(15,2),
    
    -- Classification
    category VARCHAR(100),
    subcategory VARCHAR(100),
    naics_code VARCHAR(10),
    psc_code VARCHAR(10),
    cfda_number VARCHAR(20),  -- For grants
    
    -- Location
    place_of_performance_city VARCHAR(100),
    place_of_performance_state VARCHAR(50),
    place_of_performance_country VARCHAR(50) DEFAULT 'USA',
    
    -- Agency/Organization Information
    agency_name VARCHAR(200),
    department VARCHAR(200),
    office VARCHAR(200),
    
    -- Contact Information
    contact_name VARCHAR(200),
    contact_email VARCHAR(200),
    contact_phone VARCHAR(50),
    
    -- Status and Type
    status VARCHAR(50) DEFAULT 'active',  -- 'active', 'closed', 'awarded', 'cancelled'
    opportunity_type VARCHAR(50),         -- 'rfp', 'rfq', 'grant', 'contract', etc.
    set_aside_type VARCHAR(100),          -- Small business, veteran-owned, etc.
    
    -- URLs and Documents
    source_url TEXT,
    document_urls TEXT,  -- JSON array of document URLs
    
    -- Scoring
    relevance_score DECIMAL(5,2) DEFAULT 0,
    urgency_score DECIMAL(5,2) DEFAULT 0,
    value_score DECIMAL(5,2) DEFAULT 0,
    competition_score DECIMAL(5,2) DEFAULT 0,
    total_score DECIMAL(5,2) DEFAULT 0,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Keywords Table
For storing and matching relevant keywords to opportunities.

```sql
CREATE TABLE keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    weight DECIMAL(3,2) DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Opportunity Keywords Junction Table
Many-to-many relationship between opportunities and keywords.

```sql
CREATE TABLE opportunity_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opportunity_id INTEGER NOT NULL,
    keyword_id INTEGER NOT NULL,
    relevance_score DECIMAL(3,2) DEFAULT 1.0,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
    FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE,
    UNIQUE(opportunity_id, keyword_id)
);
```

### 4. Data Sources Table
Configuration for different data sources and their API settings.

```sql
CREATE TABLE data_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,  -- 'api', 'scraper', 'rss'
    base_url VARCHAR(500),
    api_key_required BOOLEAN DEFAULT FALSE,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    last_sync DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    configuration TEXT,  -- JSON configuration for source-specific settings
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Sync Log Table
Track synchronization activities and errors.

```sql
CREATE TABLE sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    sync_start DATETIME NOT NULL,
    sync_end DATETIME,
    records_processed INTEGER DEFAULT 0,
    records_added INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'running',  -- 'running', 'completed', 'failed'
    error_message TEXT,
    FOREIGN KEY (source_id) REFERENCES data_sources(id)
);
```

## Indexes for Performance

```sql
-- Primary search indexes
CREATE INDEX idx_opportunities_due_date ON opportunities(due_date);
CREATE INDEX idx_opportunities_posted_date ON opportunities(posted_date);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_source_type ON opportunities(source_type);
CREATE INDEX idx_opportunities_total_score ON opportunities(total_score DESC);
CREATE INDEX idx_opportunities_estimated_value ON opportunities(estimated_value DESC);

-- Search indexes
CREATE INDEX idx_opportunities_title ON opportunities(title);
CREATE INDEX idx_opportunities_agency ON opportunities(agency_name);
CREATE INDEX idx_opportunities_location ON opportunities(place_of_performance_state, place_of_performance_city);

-- Composite indexes for common queries
CREATE INDEX idx_opportunities_active_score ON opportunities(status, total_score DESC) WHERE status = 'active';
CREATE INDEX idx_opportunities_due_soon ON opportunities(due_date, status) WHERE status = 'active';
```

## Data Field Mappings by Source

### SAM.gov API Mapping
- source_id → noticeId
- title → title
- opportunity_number → solicitationNumber
- agency_name → department
- office → office
- posted_date → postedDate
- due_date → responseDeadLine
- naics_code → naicsCode
- psc_code → classificationCode
- source_url → uiLink

### Grants.gov API Mapping
- source_id → oppId (from search results)
- title → oppTitle
- agency_name → agencyName
- posted_date → openDate
- due_date → closeDate
- cfda_number → cfdaNumbers
- estimated_value → awardCeiling
- description → oppDescription

### USASpending.gov API Mapping
- source_id → award_id
- title → description
- agency_name → awarding_agency_name
- estimated_value → total_obligation
- place_of_performance_city → recipient_location_city_name
- place_of_performance_state → recipient_location_state_code

