// Safe imports with fallbacks
let monitoring, analyticsManager

try {
  monitoring = require('./monitoring').monitoring
} catch (e) {
  monitoring = { 
    captureApiCall: () => {},
    captureError: () => {}
  }
}

try {
  analyticsManager = require('./analytics').analyticsManager
} catch (e) {
  // Fallback to safe analytics manager
  analyticsManager = require('./analytics-safe').analyticsManager
}

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend-fev91zedw-jacobs-projects-cf4c7bdb.vercel.app/api'

// API client class
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
      ...options,
    }

    const startTime = performance.now()
    const method = config.method || 'GET'

    try {
      console.log(`API Base URL: ${this.baseURL}`)
      console.log(`Making API request to: ${url}`)
      const response = await fetch(url, config)
      console.log(`API response for ${endpoint}:`, response.status, response.statusText)
      
      const duration = performance.now() - startTime
      
      if (!response.ok) {
        // Capture failed API call
        monitoring.captureApiCall(endpoint, method, duration, response.status)
        
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Capture successful API call
      monitoring.captureApiCall(endpoint, method, duration, 'success')
      
      // Track API success in analytics
      analyticsManager.performanceMetric('api_response_time', duration, {
        endpoint,
        method,
        status: 'success'
      })
      
      console.log(`API data for ${endpoint}:`, data)
      return data
    } catch (error) {
      const duration = performance.now() - startTime
      
      // Capture error details
      monitoring.captureApiCall(endpoint, method, duration, 'error', error)
      
      // Track API error in analytics
      analyticsManager.trackError(error, {
        api: { endpoint, method, duration, status: 'error' }
      })
      
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Opportunities endpoints
  async getOpportunities(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const result = await this.request(`/opportunities${queryString ? `?${queryString}` : ''}`)
    
    // Track opportunity listing view
    analyticsManager.track('opportunities_listed', {
      filter_count: Object.keys(params).length,
      result_count: result?.opportunities?.length || 0
    })
    
    return result
  }

  async getOpportunity(id) {
    const result = await this.request(`/opportunities/${id}`)
    
    // Track individual opportunity view
    analyticsManager.opportunityViewed(id, {
      source_type: result?.source_type,
      estimated_value: result?.estimated_value,
      score: result?.total_score
    })
    
    return result
  }

  async searchOpportunities(searchData) {
    const result = await this.request('/opportunities/search', {
      method: 'POST',
      body: JSON.stringify(searchData),
    })
    
    // Track search performed
    analyticsManager.searchPerformed(
      searchData.query || '',
      searchData.filters || {},
      result?.opportunities?.length || 0
    )
    
    return result
  }

  async discoverOpportunities(discoveryData) {
    // Track AI query start
    analyticsManager.aiQueryStarted('perplexity_discovery', discoveryData.keywords || '')
    
    const startTime = performance.now()
    const result = await this.request('/perplexity/discover', {
      method: 'POST',
      body: JSON.stringify(discoveryData),
    })
    const duration = (performance.now() - startTime) / 1000
    
    // Track AI query completion
    analyticsManager.aiQueryCompleted(
      'perplexity_discovery', 
      result?.opportunities?.length || 0,
      duration
    )
    
    return result
  }

  async getDailyIntelligence() {
    return this.request('/intelligence/daily')
  }

  async getPredictiveAnalytics() {
    return this.request('/analytics/predictive')
  }

  async getMarketIntelligence() {
    return this.request('/market/intelligence')
  }

  async getSmartMatches(preferences = {}) {
    return this.request('/matching/smart', {
      method: 'POST',
      body: JSON.stringify(preferences)
    })
  }

  async getOpportunityStats() {
    return this.request('/opportunities/stats')
  }

  async getScoreExplanation(id, keywords = []) {
    const queryString = keywords.length > 0 ? `?keywords=${keywords.join(',')}` : ''
    return this.request(`/opportunities/${id}/score-explanation${queryString}`)
  }

  // Sync endpoints
  async syncData() {
    return this.request('/sync', { method: 'POST' })
  }

  async getSyncStatus() {
    return this.request('/sync/status')
  }

  // Scraping endpoints
  async getScrapingSources() {
    return this.request('/scraping/sources')
  }

  async scrapeSource(sourceKey) {
    return this.request('/scraping/scrape-source', {
      method: 'POST',
      body: JSON.stringify({ source_key: sourceKey }),
    })
  }

  async scrapeCustomUrl(url, sourceName = 'Custom') {
    return this.request('/scraping/scrape-url', {
      method: 'POST',
      body: JSON.stringify({ url, source_name: sourceName }),
    })
  }

  async syncAllScraping() {
    return this.request('/scraping/sync-all', { method: 'POST' })
  }

  async testFirecrawl(url = 'https://example.com') {
    return this.request('/scraping/test', {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
  }

  async runAdvancedScraping() {
    // Track scraping start
    analyticsManager.scrapingStarted('advanced_scraping', 100) // High priority sources
    
    const startTime = performance.now()
    const result = await this.request('/scraping/advanced')
    const duration = (performance.now() - startTime) / 1000
    
    // Track scraping completion
    analyticsManager.scrapingCompleted(
      'advanced_scraping',
      result?.total_opportunities || 0,
      duration
    )
    
    return result
  }
}

// Create and export API client instance
export const apiClient = new ApiClient()

// Utility functions for data formatting
export const formatCurrency = (amount) => {
  if (!amount) return 'N/A'
  
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`
  } else if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  } else {
    return `$${amount.toLocaleString()}`
  }
}

export const formatDate = (dateString) => {
  if (!dateString || dateString === null) return 'Not yet synced'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    return 'Invalid Date'
  }
}

export const formatRelativeDate = (dateString) => {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days ago`
    } else if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Tomorrow'
    } else if (diffDays <= 7) {
      return `In ${diffDays} days`
    } else if (diffDays <= 30) {
      return `In ${Math.ceil(diffDays / 7)} weeks`
    } else {
      return `In ${Math.ceil(diffDays / 30)} months`
    }
  } catch (error) {
    return 'Invalid Date'
  }
}

export const getScoreColor = (score) => {
  if (score >= 90) return 'text-green-600 dark:text-green-400'
  if (score >= 80) return 'text-blue-600 dark:text-blue-400'
  if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
  if (score >= 60) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

export const getScoreBadgeColor = (score) => {
  if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  if (score >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  if (score >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  if (score >= 60) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

export const getUrgencyColor = (dueDate) => {
  if (!dueDate) return 'text-gray-500'
  
  try {
    const date = new Date(dueDate)
    const now = new Date()
    const diffTime = date - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'text-red-600 dark:text-red-400'
    if (diffDays <= 7) return 'text-red-600 dark:text-red-400'
    if (diffDays <= 14) return 'text-orange-600 dark:text-orange-400'
    if (diffDays <= 30) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  } catch (error) {
    return 'text-gray-500'
  }
}

export const getSourceTypeLabel = (sourceType) => {
  const labels = {
    'federal_contract': 'Federal Contract',
    'federal_grant': 'Federal Grant',
    'state_rfp': 'State RFP',
    'private_rfp': 'Private RFP',
    'scraped': 'Web Scraped'
  }
  return labels[sourceType] || sourceType
}

export const getSourceTypeColor = (sourceType) => {
  const colors = {
    'federal_contract': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'federal_grant': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'state_rfp': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'private_rfp': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'scraped': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
  return colors[sourceType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

