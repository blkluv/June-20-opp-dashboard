"""
Advanced Web Scraping Sources Configuration
Comprehensive RFP source database for 50+ platforms
"""

# State and Local Government Portals (All 50 States)
STATE_GOVERNMENT_SOURCES = {
    'alabama': {
        'name': 'Alabama Bid Express',
        'url': 'https://www.bidexpress.com/businesses/6251/home',
        'type': 'state_rfp',
        'firecrawl_config': {
            'extract_schema': {
                'opportunities': {
                    'type': 'array',
                    'items': {
                        'title': {'type': 'string'},
                        'agency': {'type': 'string'},
                        'due_date': {'type': 'string'},
                        'description': {'type': 'string'},
                        'value': {'type': 'string'}
                    }
                }
            }
        }
    },
    'alaska': {
        'name': 'Alaska Online Public Notice System',
        'url': 'https://aws.state.ak.us/OnlinePublicNotices/',
        'type': 'state_rfp'
    },
    'arizona': {
        'name': 'Arizona Procurement Office',
        'url': 'https://azdoa.gov/procurement',
        'type': 'state_rfp'
    },
    'arkansas': {
        'name': 'Arkansas Department of Finance',
        'url': 'https://www.dfa.arkansas.gov/offices/procurement/',
        'type': 'state_rfp'
    },
    'california': {
        'name': 'California eProcurement',
        'url': 'https://caleprocure.ca.gov/pages/public-search.aspx',
        'type': 'state_rfp'
    },
    'colorado': {
        'name': 'Colorado Procurement',
        'url': 'https://www.colorado.gov/pacific/oit/procurement-services',
        'type': 'state_rfp'
    },
    'connecticut': {
        'name': 'Connecticut Procurement Portal',
        'url': 'https://portal.ct.gov/DAS/CTSource/CTSource',
        'type': 'state_rfp'
    },
    'delaware': {
        'name': 'Delaware Government Support Services',
        'url': 'https://gss.omb.delaware.gov/procurement/',
        'type': 'state_rfp'
    },
    'florida': {
        'name': 'Florida Vendor Bid System',
        'url': 'https://www.myflorida.com/apps/vbs/vbs_www.main_menu',
        'type': 'state_rfp'
    },
    'georgia': {
        'name': 'Georgia Procurement Registry',
        'url': 'https://doas.ga.gov/state-purchasing',
        'type': 'state_rfp'
    },
    'hawaii': {
        'name': 'Hawaii State Procurement Office',
        'url': 'https://spo.hawaii.gov/',
        'type': 'state_rfp'
    },
    'idaho': {
        'name': 'Idaho Division of Purchasing',
        'url': 'https://purchasing.idaho.gov/',
        'type': 'state_rfp'
    },
    'illinois': {
        'name': 'Illinois Procurement Bulletin',
        'url': 'https://www2.illinois.gov/cms/business/sell2/Pages/default.aspx',
        'type': 'state_rfp'
    },
    'indiana': {
        'name': 'Indiana InSite Portal',
        'url': 'https://www.in.gov/idoa/procurement/',
        'type': 'state_rfp'
    },
    'iowa': {
        'name': 'Iowa Department of Administrative Services',
        'url': 'https://das.iowa.gov/procurement',
        'type': 'state_rfp'
    },
    'kansas': {
        'name': 'Kansas Office of Procurement',
        'url': 'https://admin.ks.gov/offices/procurement-and-contracts',
        'type': 'state_rfp'
    },
    'kentucky': {
        'name': 'Kentucky Finance Cabinet',
        'url': 'https://finance.ky.gov/services/eprocurement/Pages/default.aspx',
        'type': 'state_rfp'
    },
    'louisiana': {
        'name': 'Louisiana State Procurement',
        'url': 'https://www.doa.la.gov/pages/osp/procurement.aspx',
        'type': 'state_rfp'
    },
    'maine': {
        'name': 'Maine Bureau of General Services',
        'url': 'https://www.maine.gov/dafs/bbm/procurementservices/',
        'type': 'state_rfp'
    },
    'maryland': {
        'name': 'Maryland eMarylandMarketplace',
        'url': 'https://www.emp.maryland.gov/',
        'type': 'state_rfp'
    },
    'massachusetts': {
        'name': 'Massachusetts COMMBUYS',
        'url': 'https://www.commbuys.com/',
        'type': 'state_rfp'
    },
    'michigan': {
        'name': 'Michigan SIGMA VMS',
        'url': 'https://www.michigan.gov/dtmb/resources/procurement',
        'type': 'state_rfp'
    },
    'minnesota': {
        'name': 'Minnesota SWIFT',
        'url': 'https://mn.gov/admin/government/procurement/',
        'type': 'state_rfp'
    },
    'mississippi': {
        'name': 'Mississippi Office of Purchasing',
        'url': 'https://www.dfa.ms.gov/dfa-offices/office-of-purchasing-travel-and-fleet-management/',
        'type': 'state_rfp'
    },
    'missouri': {
        'name': 'Missouri State Procurement',
        'url': 'https://oa.mo.gov/purchasing',
        'type': 'state_rfp'
    },
    'montana': {
        'name': 'Montana State Procurement Bureau',
        'url': 'https://gsd.mt.gov/procurement',
        'type': 'state_rfp'
    },
    'nebraska': {
        'name': 'Nebraska State Purchasing Bureau',
        'url': 'https://das.nebraska.gov/materiel/purchasing/',
        'type': 'state_rfp'
    },
    'nevada': {
        'name': 'Nevada Purchasing Division',
        'url': 'https://purchasing.nv.gov/',
        'type': 'state_rfp'
    },
    'new_hampshire': {
        'name': 'New Hampshire Bureau of Purchase',
        'url': 'https://www.das.nh.gov/purchasing/',
        'type': 'state_rfp'
    },
    'new_jersey': {
        'name': 'New Jersey Treasury Procurement',
        'url': 'https://www.state.nj.us/treasury/purchase/',
        'type': 'state_rfp'
    },
    'new_mexico': {
        'name': 'New Mexico State Purchasing',
        'url': 'https://www.generalservices.state.nm.us/state-purchasing/',
        'type': 'state_rfp'
    },
    'new_york': {
        'name': 'New York State Procurement',
        'url': 'https://www.ogs.ny.gov/procurement/',
        'type': 'state_rfp'
    },
    'north_carolina': {
        'name': 'North Carolina eProcurement',
        'url': 'https://www.ips.state.nc.us/',
        'type': 'state_rfp'
    },
    'north_dakota': {
        'name': 'North Dakota Central Services',
        'url': 'https://www.nd.gov/omb/agency/central-services/procurement',
        'type': 'state_rfp'
    },
    'ohio': {
        'name': 'Ohio Department of Administrative Services',
        'url': 'https://das.ohio.gov/Divisions/General-Services/Procurement',
        'type': 'state_rfp'
    },
    'oklahoma': {
        'name': 'Oklahoma Central Purchasing',
        'url': 'https://www.ok.gov/dcs/Central_Purchasing/',
        'type': 'state_rfp'
    },
    'oregon': {
        'name': 'Oregon Procurement Information Network',
        'url': 'https://orpin.oregon.gov/',
        'type': 'state_rfp'
    },
    'pennsylvania': {
        'name': 'Pennsylvania eMarketplace',
        'url': 'https://www.emarketplace.state.pa.us/',
        'type': 'state_rfp'
    },
    'rhode_island': {
        'name': 'Rhode Island Division of Purchases',
        'url': 'https://www.purchasing.ri.gov/',
        'type': 'state_rfp'
    },
    'south_carolina': {
        'name': 'South Carolina Procurement Services',
        'url': 'https://procurement.sc.gov/',
        'type': 'state_rfp'
    },
    'south_dakota': {
        'name': 'South Dakota Bureau of Administration',
        'url': 'https://boa.sd.gov/central-services/procurement-management/',
        'type': 'state_rfp'
    },
    'tennessee': {
        'name': 'Tennessee Central Procurement Office',
        'url': 'https://www.tn.gov/generalservices/procurement.html',
        'type': 'state_rfp'
    },
    'texas': {
        'name': 'Texas SmartBuy',
        'url': 'https://www.txsmartbuy.com/sp',
        'type': 'state_rfp'
    },
    'utah': {
        'name': 'Utah Division of Purchasing',
        'url': 'https://purchasing.utah.gov/',
        'type': 'state_rfp'
    },
    'vermont': {
        'name': 'Vermont Department of Buildings',
        'url': 'https://bgs.vermont.gov/purchasing-contracting',
        'type': 'state_rfp'
    },
    'virginia': {
        'name': 'Virginia eVA Portal',
        'url': 'https://www.eva.virginia.gov/',
        'type': 'state_rfp'
    },
    'washington': {
        'name': 'Washington State Department of Enterprise Services',
        'url': 'https://des.wa.gov/services/contracting-purchasing',
        'type': 'state_rfp'
    },
    'west_virginia': {
        'name': 'West Virginia Purchasing Division',
        'url': 'https://purchase.wv.gov/',
        'type': 'state_rfp'
    },
    'wisconsin': {
        'name': 'Wisconsin Procurement',
        'url': 'https://www.wi.gov/Pages/Procurement.aspx',
        'type': 'state_rfp'
    },
    'wyoming': {
        'name': 'Wyoming Procurement Services',
        'url': 'https://ai.wyo.gov/divisions/procurement-services',
        'type': 'state_rfp'
    }
}

# Major City Government Portals
CITY_GOVERNMENT_SOURCES = {
    'nyc': {
        'name': 'NYC Procurement',
        'url': 'https://www1.nyc.gov/site/mocs/business/business-opportunities.page',
        'type': 'local_rfp'
    },
    'chicago': {
        'name': 'Chicago Procurement',
        'url': 'https://www.chicago.gov/city/en/depts/dps/provdrs/contract_admin.html',
        'type': 'local_rfp'
    },
    'los_angeles': {
        'name': 'Los Angeles Procurement',
        'url': 'https://www.lacity.org/government/popular-information/doing-business-city/bidding-opportunities',
        'type': 'local_rfp'
    },
    'houston': {
        'name': 'Houston Procurement',
        'url': 'https://www.houstontx.gov/business/',
        'type': 'local_rfp'
    },
    'phoenix': {
        'name': 'Phoenix Procurement',
        'url': 'https://www.phoenix.gov/business',
        'type': 'local_rfp'
    },
    'philadelphia': {
        'name': 'Philadelphia Procurement',
        'url': 'https://www.phila.gov/departments/office-of-the-chief-administrative-officer/procurement/',
        'type': 'local_rfp'
    },
    'san_antonio': {
        'name': 'San Antonio Procurement',
        'url': 'https://www.sanantonio.gov/Finance/Procurement',
        'type': 'local_rfp'
    },
    'san_diego': {
        'name': 'San Diego Procurement',
        'url': 'https://www.sandiego.gov/purchasing',
        'type': 'local_rfp'
    },
    'dallas': {
        'name': 'Dallas Procurement Services',
        'url': 'https://dallascityhall.com/departments/procurement-services/Pages/default.aspx',
        'type': 'local_rfp'
    },
    'austin': {
        'name': 'Austin Procurement',
        'url': 'https://www.austintexas.gov/department/small-minority-business-resources',
        'type': 'local_rfp'
    }
}

# Private Sector RFP Sources (Fortune 500 & Major Companies)
PRIVATE_SECTOR_SOURCES = {
    # Technology Companies
    'microsoft': {
        'name': 'Microsoft Supplier Portal',
        'url': 'https://www.microsoft.com/en-us/procurement/',
        'type': 'private_rfp',
        'industry': 'technology'
    },
    'apple': {
        'name': 'Apple Supplier Portal',
        'url': 'https://supplier.apple.com/',
        'type': 'private_rfp',
        'industry': 'technology'
    },
    'google': {
        'name': 'Google Supplier Portal',
        'url': 'https://www.google.com/suppliers/',
        'type': 'private_rfp',
        'industry': 'technology'
    },
    'amazon': {
        'name': 'Amazon Supplier Portal',
        'url': 'https://supplier.amazon.com/',
        'type': 'private_rfp',
        'industry': 'technology'
    },
    'ibm': {
        'name': 'IBM PartnerWorld',
        'url': 'https://www.ibm.com/partnerworld/',
        'type': 'private_rfp',
        'industry': 'technology'
    },
    
    # Healthcare Companies
    'johnson_johnson': {
        'name': 'Johnson & Johnson Procurement',
        'url': 'https://www.jnj.com/suppliers',
        'type': 'private_rfp',
        'industry': 'healthcare'
    },
    'pfizer': {
        'name': 'Pfizer Supplier Portal',
        'url': 'https://www.pfizer.com/suppliers',
        'type': 'private_rfp',
        'industry': 'healthcare'
    },
    'merck': {
        'name': 'Merck Supplier Portal',
        'url': 'https://www.merck.com/suppliers/',
        'type': 'private_rfp',
        'industry': 'healthcare'
    },
    
    # Financial Services
    'jpmorgan': {
        'name': 'JPMorgan Chase Supplier Portal',
        'url': 'https://www.jpmorganchase.com/about/suppliers',
        'type': 'private_rfp',
        'industry': 'financial'
    },
    'bank_of_america': {
        'name': 'Bank of America Supplier Portal',
        'url': 'https://about.bankofamerica.com/en/supplier-information',
        'type': 'private_rfp',
        'industry': 'financial'
    },
    'wells_fargo': {
        'name': 'Wells Fargo Supplier Portal',
        'url': 'https://www.wellsfargo.com/about/corporate-responsibility/supplier-diversity/',
        'type': 'private_rfp',
        'industry': 'financial'
    },
    
    # Energy Companies
    'exxonmobil': {
        'name': 'ExxonMobil Supplier Portal',
        'url': 'https://corporate.exxonmobil.com/suppliers',
        'type': 'private_rfp',
        'industry': 'energy'
    },
    'chevron': {
        'name': 'Chevron Supplier Portal',
        'url': 'https://www.chevron.com/suppliers',
        'type': 'private_rfp',
        'industry': 'energy'
    },
    
    # Manufacturing
    'boeing': {
        'name': 'Boeing Supplier Portal',
        'url': 'https://www.boeing.com/suppliers/',
        'type': 'private_rfp',
        'industry': 'aerospace'
    },
    'lockheed_martin': {
        'name': 'Lockheed Martin Supplier Portal',
        'url': 'https://www.lockheedmartin.com/suppliers',
        'type': 'private_rfp',
        'industry': 'defense'
    },
    'general_electric': {
        'name': 'GE Supplier Portal',
        'url': 'https://www.ge.com/suppliers',
        'type': 'private_rfp',
        'industry': 'manufacturing'
    }
}

# International Organizations
INTERNATIONAL_SOURCES = {
    'world_bank': {
        'name': 'World Bank Procurement',
        'url': 'https://projects.worldbank.org/en/projects-operations/procurement',
        'type': 'international',
        'region': 'global'
    },
    'un_global_marketplace': {
        'name': 'UN Global Marketplace',
        'url': 'https://www.ungm.org/',
        'type': 'international',
        'region': 'global'
    },
    'european_union': {
        'name': 'EU TED (Tenders Electronic Daily)',
        'url': 'https://ted.europa.eu/',
        'type': 'international',
        'region': 'europe'
    },
    'african_development_bank': {
        'name': 'African Development Bank',
        'url': 'https://www.afdb.org/en/about-us/corporate-procurement',
        'type': 'international',
        'region': 'africa'
    },
    'asian_development_bank': {
        'name': 'Asian Development Bank',
        'url': 'https://www.adb.org/business/operational-procurement',
        'type': 'international',
        'region': 'asia'
    },
    'inter_american_development_bank': {
        'name': 'Inter-American Development Bank',
        'url': 'https://www.iadb.org/en/procurement',
        'type': 'international',
        'region': 'americas'
    }
}

# University and Research Institutions
UNIVERSITY_SOURCES = {
    'harvard': {
        'name': 'Harvard University Procurement',
        'url': 'https://procurement.harvard.edu/',
        'type': 'university',
        'state': 'massachusetts'
    },
    'stanford': {
        'name': 'Stanford University Procurement',
        'url': 'https://fingate.stanford.edu/procurement',
        'type': 'university',
        'state': 'california'
    },
    'mit': {
        'name': 'MIT Procurement',
        'url': 'https://vpf.mit.edu/procurement',
        'type': 'university',
        'state': 'massachusetts'
    },
    'berkeley': {
        'name': 'UC Berkeley Procurement',
        'url': 'https://procurement.berkeley.edu/',
        'type': 'university',
        'state': 'california'
    },
    'university_of_michigan': {
        'name': 'University of Michigan Procurement',
        'url': 'https://procurement.umich.edu/',
        'type': 'university',
        'state': 'michigan'
    },
    'johns_hopkins': {
        'name': 'Johns Hopkins Procurement',
        'url': 'https://www.hopkinsmedicine.org/finance/procurement/',
        'type': 'university',
        'state': 'maryland'
    }
}

# Industry-Specific Platforms
INDUSTRY_PLATFORMS = {
    # Healthcare
    'healthcare_purchasing_news': {
        'name': 'Healthcare Purchasing News',
        'url': 'https://www.hpnonline.com/sourcing/',
        'type': 'industry_platform',
        'industry': 'healthcare'
    },
    'premier_healthcare': {
        'name': 'Premier Healthcare Alliance',
        'url': 'https://www.premierinc.com/suppliers',
        'type': 'industry_platform',
        'industry': 'healthcare'
    },
    
    # Defense & Aerospace
    'defense_procurement': {
        'name': 'Defense Procurement Network',
        'url': 'https://www.defenseprocurement.com/',
        'type': 'industry_platform',
        'industry': 'defense'
    },
    'aerospace_manufacturing': {
        'name': 'Aerospace Manufacturing Portal',
        'url': 'https://www.aerospacemfg.com/suppliers/',
        'type': 'industry_platform',
        'industry': 'aerospace'
    },
    
    # Energy & Utilities
    'energy_procurement': {
        'name': 'Energy Procurement Portal',
        'url': 'https://www.energyprocurement.com/',
        'type': 'industry_platform',
        'industry': 'energy'
    },
    'utility_dive': {
        'name': 'Utility Dive Procurement',
        'url': 'https://www.utilitydive.com/suppliers/',
        'type': 'industry_platform',
        'industry': 'utilities'
    },
    
    # Construction
    'construction_dive': {
        'name': 'Construction Dive Procurement',
        'url': 'https://www.constructiondive.com/suppliers/',
        'type': 'industry_platform',
        'industry': 'construction'
    },
    'dodge_data': {
        'name': 'Dodge Data & Analytics',
        'url': 'https://www.construction.com/',
        'type': 'industry_platform',
        'industry': 'construction'
    }
}

# Nonprofit and Foundation Sources
NONPROFIT_SOURCES = {
    'gates_foundation': {
        'name': 'Bill & Melinda Gates Foundation',
        'url': 'https://www.gatesfoundation.org/about/how-we-work/general-information/information-for-vendors',
        'type': 'nonprofit',
        'focus': 'global_health'
    },
    'ford_foundation': {
        'name': 'Ford Foundation',
        'url': 'https://www.fordfoundation.org/about/how-we-work/procurement/',
        'type': 'nonprofit',
        'focus': 'social_justice'
    },
    'rockefeller_foundation': {
        'name': 'Rockefeller Foundation',
        'url': 'https://www.rockefellerfoundation.org/about-us/procurement/',
        'type': 'nonprofit',
        'focus': 'resilience'
    },
    'red_cross': {
        'name': 'American Red Cross',
        'url': 'https://www.redcross.org/about-us/procurement',
        'type': 'nonprofit',
        'focus': 'disaster_relief'
    },
    'united_way': {
        'name': 'United Way Worldwide',
        'url': 'https://www.unitedway.org/about/procurement',
        'type': 'nonprofit',
        'focus': 'community'
    }
}

# Specialized RFP Aggregators and Marketplaces
RFP_MARKETPLACES = {
    'govwin': {
        'name': 'GovWin IQ (Deltek)',
        'url': 'https://www.deltek.com/en/products/govwin-iq',
        'type': 'marketplace',
        'focus': 'government'
    },
    'bidsync': {
        'name': 'BidSync',
        'url': 'https://www.bidsync.com/',
        'type': 'marketplace',
        'focus': 'government'
    },
    'bidnet': {
        'name': 'BidNet',
        'url': 'https://www.bidnet.com/',
        'type': 'marketplace',
        'focus': 'government'
    },
    'rfpmart': {
        'name': 'RFPMart',
        'url': 'https://www.rfpmart.com/',
        'type': 'marketplace',
        'focus': 'private'
    },
    'rfp_database': {
        'name': 'RFP Database',
        'url': 'https://www.rfpdb.com/',
        'type': 'marketplace',
        'focus': 'private'
    },
    'government_bids': {
        'name': 'Government Bids',
        'url': 'https://www.governmentbids.com/',
        'type': 'marketplace',
        'focus': 'government'
    }
}

# Complete source compilation
ALL_SCRAPING_SOURCES = {
    **STATE_GOVERNMENT_SOURCES,
    **CITY_GOVERNMENT_SOURCES,
    **PRIVATE_SECTOR_SOURCES,
    **INTERNATIONAL_SOURCES,
    **UNIVERSITY_SOURCES,
    **INDUSTRY_PLATFORMS,
    **NONPROFIT_SOURCES,
    **RFP_MARKETPLACES
}

# Source categories for organized scraping
SOURCE_CATEGORIES = {
    'government': {
        'state': STATE_GOVERNMENT_SOURCES,
        'local': CITY_GOVERNMENT_SOURCES
    },
    'private': PRIVATE_SECTOR_SOURCES,
    'international': INTERNATIONAL_SOURCES,
    'education': UNIVERSITY_SOURCES,
    'industry': INDUSTRY_PLATFORMS,
    'nonprofit': NONPROFIT_SOURCES,
    'marketplaces': RFP_MARKETPLACES
}

def get_sources_by_category(category):
    """Get all sources for a specific category"""
    return SOURCE_CATEGORIES.get(category, {})

def get_sources_by_type(source_type):
    """Get all sources of a specific type"""
    return {k: v for k, v in ALL_SCRAPING_SOURCES.items() if v.get('type') == source_type}

def get_sources_by_industry(industry):
    """Get all sources for a specific industry"""
    return {k: v for k, v in ALL_SCRAPING_SOURCES.items() if v.get('industry') == industry}

def get_high_priority_sources():
    """Get high-priority sources for initial implementation"""
    return {
        # Top 10 states by economy
        'california': STATE_GOVERNMENT_SOURCES['california'],
        'texas': STATE_GOVERNMENT_SOURCES['texas'],
        'new_york': STATE_GOVERNMENT_SOURCES['new_york'],
        'florida': STATE_GOVERNMENT_SOURCES['florida'],
        'illinois': STATE_GOVERNMENT_SOURCES['illinois'],
        
        # Major cities
        'nyc': CITY_GOVERNMENT_SOURCES['nyc'],
        'chicago': CITY_GOVERNMENT_SOURCES['chicago'],
        'los_angeles': CITY_GOVERNMENT_SOURCES['los_angeles'],
        
        # Key private sector
        'microsoft': PRIVATE_SECTOR_SOURCES['microsoft'],
        'amazon': PRIVATE_SECTOR_SOURCES['amazon'],
        'google': PRIVATE_SECTOR_SOURCES['google'],
        
        # International
        'world_bank': INTERNATIONAL_SOURCES['world_bank'],
        'un_global_marketplace': INTERNATIONAL_SOURCES['un_global_marketplace'],
        
        # Marketplaces
        'bidnet': RFP_MARKETPLACES['bidnet'],
        'rfpmart': RFP_MARKETPLACES['rfpmart']
    }

# Scraping configuration for different source types
SCRAPING_CONFIGS = {
    'state_rfp': {
        'extract_schema': {
            'opportunities': {
                'type': 'array',
                'items': {
                    'title': {'type': 'string'},
                    'agency': {'type': 'string'},
                    'due_date': {'type': 'string'},
                    'posted_date': {'type': 'string'},
                    'description': {'type': 'string'},
                    'value': {'type': 'string'},
                    'contact': {'type': 'string'},
                    'location': {'type': 'string'}
                }
            }
        },
        'rate_limit': 'conservative',  # 1 request per 10 seconds
        'retry_attempts': 3
    },
    'private_rfp': {
        'extract_schema': {
            'opportunities': {
                'type': 'array',
                'items': {
                    'title': {'type': 'string'},
                    'department': {'type': 'string'},
                    'deadline': {'type': 'string'},
                    'description': {'type': 'string'},
                    'value': {'type': 'string'},
                    'requirements': {'type': 'string'}
                }
            }
        },
        'rate_limit': 'aggressive',  # 1 request per 30 seconds
        'retry_attempts': 2
    },
    'international': {
        'extract_schema': {
            'opportunities': {
                'type': 'array',
                'items': {
                    'title': {'type': 'string'},
                    'organization': {'type': 'string'},
                    'deadline': {'type': 'string'},
                    'description': {'type': 'string'},
                    'budget': {'type': 'string'},
                    'location': {'type': 'string'},
                    'sector': {'type': 'string'}
                }
            }
        },
        'rate_limit': 'conservative',
        'retry_attempts': 3
    }
}

if __name__ == "__main__":
    print(f"Total scraping sources configured: {len(ALL_SCRAPING_SOURCES)}")
    print(f"Source breakdown:")
    for category, sources in SOURCE_CATEGORIES.items():
        if isinstance(sources, dict):
            count = len(sources) if not any(isinstance(v, dict) for v in sources.values()) else sum(len(v) for v in sources.values() if isinstance(v, dict))
            print(f"  {category}: {count} sources")
    
    print(f"\nHigh priority sources: {len(get_high_priority_sources())}")