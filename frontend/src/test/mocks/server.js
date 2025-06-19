import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock data
const mockOpportunities = [
  {
    id: '1',
    title: 'AI Development Services',
    description: 'Artificial intelligence and machine learning development for government applications',
    agency_name: 'Department of Defense',
    estimated_value: 2500000,
    due_date: '2024-08-15',
    posted_date: '2024-06-15',
    status: 'active',
    source_type: 'federal_contract',
    source_name: 'SAM.gov',
    total_score: 85,
    opportunity_number: 'DOD-AI-2024-001'
  },
  {
    id: '2',
    title: 'Cybersecurity Infrastructure Upgrade',
    description: 'Comprehensive cybersecurity assessment and infrastructure modernization',
    agency_name: 'Department of Homeland Security',
    estimated_value: 1800000,
    due_date: '2024-09-20',
    posted_date: '2024-07-01',
    status: 'active',
    source_type: 'federal_contract',
    source_name: 'SAM.gov',
    total_score: 92,
    opportunity_number: 'DHS-CYBER-2024-003'
  }
]

const mockUserPreferences = {
  success: true,
  preferences: {
    company: 'Test Company',
    capabilities: 'AI and Cybersecurity',
    keywords: ['Artificial Intelligence', 'Cybersecurity'],
    naicsCodes: ['541511'],
    minValue: 100000,
    maxValue: 5000000,
    agencies: ['Department of Defense'],
    emailAlerts: true,
    alertFrequency: 'daily',
    minScoreThreshold: 70,
    isOnboarded: true
  }
}

const mockAnalytics = {
  win_probability: 78.5,
  market_growth: 34.2,
  predicted_value: 28500000,
  time_to_award: 45,
  competitive_landscape: {
    low_competition: 25.0,
    medium_competition: 45.0,
    high_competition: 30.0
  },
  sector_forecast: [
    { name: 'AI & Machine Learning', growth_rate: 45, opportunity_count: 12, confidence: 85 },
    { name: 'Cybersecurity', growth_rate: 38, opportunity_count: 8, confidence: 90 }
  ],
  agency_insights: [
    { name: 'Department of Defense', opportunity_count: 15, avg_value: 2500000, avg_score: 85, is_preferred: true },
    { name: 'Department of Homeland Security', opportunity_count: 10, avg_value: 1800000, avg_score: 88, is_preferred: true }
  ],
  recommendations: [
    'Focus on Department of Defense - they have the most matching opportunities',
    'Your keyword alignment is excellent - maintain current strategy'
  ]
}

// Request handlers
export const handlers = [
  // API health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      service: 'opportunity-dashboard-backend'
    })
  }),

  // Opportunities endpoints
  http.get('/api/opportunities', () => {
    return HttpResponse.json({
      opportunities: mockOpportunities,
      total: mockOpportunities.length,
      message: 'Live data from 2 sources: SAM.gov, Grants.gov'
    })
  }),

  http.get('/api/opportunities/personalized', () => {
    return HttpResponse.json({
      success: true,
      opportunities: mockOpportunities,
      total: mockOpportunities.length,
      insights: {
        total_matches: mockOpportunities.length,
        avg_score: 88.5,
        top_agencies: [
          { name: 'Department of Defense', count: 1 },
          { name: 'Department of Homeland Security', count: 1 }
        ],
        value_distribution: {
          under_1M: 0,
          '1M_to_5M': 2,
          '5M_to_10M': 0,
          over_10M: 0
        },
        recommendations: mockAnalytics.recommendations
      },
      preferences_applied: {
        keywords: ['Artificial Intelligence', 'Cybersecurity'],
        value_range: '$100,000 - $5,000,000',
        preferred_agencies: ['Department of Defense'],
        min_score_threshold: 70
      }
    })
  }),

  // User preferences endpoints
  http.get('/api/user/preferences', () => {
    return HttpResponse.json(mockUserPreferences)
  }),

  http.post('/api/user/preferences', async ({ request }) => {
    const preferences = await request.json()
    return HttpResponse.json({
      success: true,
      message: 'Preferences saved successfully',
      saved_at: new Date().toISOString()
    })
  }),

  // Analytics endpoints
  http.get('/api/analytics/predictive', () => {
    return HttpResponse.json(mockAnalytics)
  }),

  http.get('/api/analytics/personalized', () => {
    return HttpResponse.json({
      ...mockAnalytics,
      total_opportunities_analyzed: mockOpportunities.length,
      preferences_applied: mockUserPreferences.preferences
    })
  }),

  // Market intelligence
  http.get('/api/market/intelligence', () => {
    return HttpResponse.json({
      live_metrics: {
        active_opportunities: 1247,
        market_value: 2847000000,
        market_activity_score: 94,
        critical_alerts: 3
      },
      live_alerts: [
        {
          id: 1,
          message: 'High-value AI contract posted by DoD',
          severity: 'critical',
          timestamp: new Date().toISOString()
        }
      ],
      sector_performance: [
        { name: 'Technology', score: 95, trend: 'up' },
        { name: 'Cybersecurity', score: 88, trend: 'up' }
      ]
    })
  }),

  // Error simulation endpoints for testing
  http.get('/api/test/network-error', () => {
    return HttpResponse.error()
  }),

  http.get('/api/test/timeout', () => {
    return new Promise(() => {}) // Never resolves to simulate timeout
  }),

  http.get('/api/test/server-error', () => {
    return new HttpResponse(null, { status: 500 })
  }),

  http.get('/api/test/unauthorized', () => {
    return new HttpResponse(null, { status: 401 })
  })
]

// Setup server
export const server = setupServer(...handlers)