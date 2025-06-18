# Additional Firecrawl Sources

## More State Government Sources
```javascript
// Add these to your SCRAPE_SOURCES
'virginia_procurement': {
    'url': 'https://eva.virginia.gov/',
    'name': 'Virginia eVA',
    'type': 'state_rfp'
},
'ohio_procurement': {
    'url': 'https://procurement.ohio.gov/',
    'name': 'Ohio Procurement',
    'type': 'state_rfp'
},
'georgia_procurement': {
    'url': 'https://doas.ga.gov/state-purchasing',
    'name': 'Georgia State Purchasing',
    'type': 'state_rfp'
},
'washington_procurement': {
    'url': 'https://des.wa.gov/services/contracting-purchasing',
    'name': 'Washington State Procurement',
    'type': 'state_rfp'
},
'colorado_procurement': {
    'url': 'https://www.colorado.gov/pacific/oit/procurement-opportunities',
    'name': 'Colorado Procurement',
    'type': 'state_rfp'
}
```

## Federal Agency Direct Sources
```javascript
'gsa_schedules': {
    'url': 'https://www.gsa.gov/buying-selling/purchasing-programs/gsa-schedules',
    'name': 'GSA Schedules',
    'type': 'federal_direct'
},
'va_procurement': {
    'url': 'https://www.va.gov/oal/business/dbids/',
    'name': 'VA Procurement Opportunities',
    'type': 'federal_direct'
},
'dhs_procurement': {
    'url': 'https://www.dhs.gov/how-do-business-dhs',
    'name': 'DHS Business Opportunities',
    'type': 'federal_direct'
},
'doe_procurement': {
    'url': 'https://www.energy.gov/management/office-management/operational-management/procurement-acquisition',
    'name': 'Department of Energy Procurement',
    'type': 'federal_direct'
}
```

## Education & Research Grants
```javascript
'nsf_grants': {
    'url': 'https://www.nsf.gov/funding/',
    'name': 'National Science Foundation Grants',
    'type': 'federal_grant'
},
'ed_grants': {
    'url': 'https://www.ed.gov/fund/grants-apply.html',
    'name': 'Department of Education Grants',
    'type': 'federal_grant'
},
'gates_foundation': {
    'url': 'https://www.gatesfoundation.org/how-we-work/quick-links/grants-database',
    'name': 'Gates Foundation Grants',
    'type': 'private_grant'
}
```

## More Private Sector RFP Sources
```javascript
'rfp_gurus': {
    'url': 'https://www.rfpgurus.com/',
    'name': 'RFP Gurus',
    'type': 'private_rfp'
},
'find_rfp': {
    'url': 'https://www.findrfp.com/',
    'name': 'Find RFP',
    'type': 'private_rfp'
},
'government_bids': {
    'url': 'https://www.governmentbids.com/',
    'name': 'Government Bids',
    'type': 'private_rfp'
}
```

## Healthcare & Medical
```javascript
'cdc_procurement': {
    'url': 'https://www.cdc.gov/contracts/',
    'name': 'CDC Procurement Opportunities',
    'type': 'federal_direct'
},
'cms_procurement': {
    'url': 'https://www.cms.gov/About-CMS/Agency-Information/OFM/PrivateSectorInquiries',
    'name': 'CMS Business Opportunities',
    'type': 'federal_direct'
}
```

## Technology & Innovation
```javascript
'in_q_tel': {
    'url': 'https://www.iqt.org/',
    'name': 'In-Q-Tel Investment Opportunities',
    'type': 'private_investment'
},
'darpa_opportunities': {
    'url': 'https://www.darpa.mil/work-with-us/opportunities',
    'name': 'DARPA Opportunities',
    'type': 'federal_direct'
}
```

## International Development
```javascript
'usaid_procurement': {
    'url': 'https://www.usaid.gov/work-with-us',
    'name': 'USAID Business Opportunities',
    'type': 'federal_international'
},
'world_bank_consultants': {
    'url': 'https://consultants.worldbank.org/',
    'name': 'World Bank Consultant Opportunities',
    'type': 'international'
},
'asian_development_bank': {
    'url': 'https://www.adb.org/work-with-us/opportunities',
    'name': 'Asian Development Bank Opportunities',
    'type': 'international'
}
```

## More Major Cities
```javascript
'sf_procurement': {
    'url': 'https://sf.gov/departments/city-administrator/contract-administration/doing-business-city-and-county-san-francisco',
    'name': 'San Francisco Procurement',
    'type': 'local_rfp'
},
'houston_procurement': {
    'url': 'https://www.houstontx.gov/purchasing/',
    'name': 'Houston Procurement',
    'type': 'local_rfp'
},
'phoenix_procurement': {
    'url': 'https://www.phoenix.gov/finance/procurement',
    'name': 'Phoenix Procurement',
    'type': 'local_rfp'
},
'philadelphia_procurement': {
    'url': 'https://www.phila.gov/departments/office-of-procurement/',
    'name': 'Philadelphia Procurement',
    'type': 'local_rfp'
}
```

## Non-Profit & Foundation Grants
```javascript
'robert_wood_johnson': {
    'url': 'https://www.rwjf.org/en/how-we-work/grants-and-grant-programs.html',
    'name': 'Robert Wood Johnson Foundation',
    'type': 'private_grant'
},
'ford_foundation': {
    'url': 'https://www.fordfoundation.org/work/our-grants/',
    'name': 'Ford Foundation Grants',
    'type': 'private_grant'
}
```

## How to Add New Sources

1. **Add to backend API**: Edit the sources array in `/backend/api/index.py`
2. **Add to full service**: Edit `SCRAPE_SOURCES` in `/backend/src/services/firecrawl_service.py`
3. **Deploy**: Run `vercel deploy --prod --yes`

## Source Types Available
- `state_rfp` - State government procurement
- `federal_direct` - Direct federal agency opportunities  
- `federal_grant` - Federal research/program grants
- `private_rfp` - Private sector RFPs
- `private_grant` - Private foundation grants
- `international` - International organizations
- `local_rfp` - City/county procurement
- `private_investment` - Investment opportunities

## Rate Limiting Notes
- Firecrawl has generous rate limits (varies by plan)
- Each source can be scraped independently
- Built-in retry logic and error handling
- Respects robots.txt and site policies