import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiClient, formatCurrency, formatDate, parseDate } from '../api'
import { server } from '../../test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('ApiClient', () => {
  let apiClient

  beforeEach(() => {
    apiClient = new ApiClient()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('uses default base URL when none provided', () => {
      const client = new ApiClient()
      expect(client.baseURL).toBe('https://backend-fev91zedw-jacobs-projects-cf4c7bdb.vercel.app/api')
    })

    it('uses provided base URL', () => {
      const customURL = 'https://custom-api.com'
      const client = new ApiClient(customURL)
      expect(client.baseURL).toBe(customURL)
    })
  })

  describe('request method', () => {
    it('makes successful GET request', async () => {
      const response = await apiClient.request('/health')
      
      expect(response).toEqual({
        status: 'healthy',
        service: 'opportunity-dashboard-backend'
      })
    })

    it('makes successful POST request', async () => {
      const preferences = { keywords: ['AI'], minValue: 100000 }
      
      const response = await apiClient.request('/user/preferences', {
        method: 'POST',
        body: JSON.stringify(preferences)
      })
      
      expect(response.success).toBe(true)
      expect(response.message).toBe('Preferences saved successfully')
    })

    it('handles network errors', async () => {
      server.use(
        http.get('*/api/test/network-error', () => {
          return HttpResponse.error()
        })
      )

      await expect(apiClient.request('/test/network-error')).rejects.toThrow()
    })

    it('handles HTTP errors', async () => {
      server.use(
        http.get('*/api/test/server-error', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      await expect(apiClient.request('/test/server-error')).rejects.toThrow(/HTTP error! status: 500/)
    })

    it('handles timeout', async () => {
      server.use(
        http.get('*/api/test/timeout', () => {
          return new Promise(() => {}) // Never resolves
        })
      )

      const timeoutPromise = apiClient.request('/test/timeout')
      
      // Fast-forward time to trigger timeout
      vi.advanceTimersByTime(30000)
      
      await expect(timeoutPromise).rejects.toThrow()
    })

    it('includes authorization header when token provided', async () => {
      let capturedHeaders
      
      server.use(
        http.get('*/api/health', ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries())
          return HttpResponse.json({ status: 'ok' })
        })
      )

      await apiClient.request('/health', {
        headers: { Authorization: 'Bearer test-token' }
      })

      expect(capturedHeaders.authorization).toBe('Bearer test-token')
    })
  })

  describe('convenience methods', () => {
    it('getOpportunities returns formatted data', async () => {
      const response = await apiClient.getOpportunities()
      
      expect(response).toHaveProperty('opportunities')
      expect(response).toHaveProperty('total')
      expect(Array.isArray(response.opportunities)).toBe(true)
    })

    it('getPersonalizedOpportunities returns personalized data', async () => {
      const response = await apiClient.getPersonalizedOpportunities()
      
      expect(response.success).toBe(true)
      expect(response).toHaveProperty('opportunities')
      expect(response).toHaveProperty('insights')
      expect(response).toHaveProperty('preferences_applied')
    })

    it('getUserPreferences returns user preferences', async () => {
      const response = await apiClient.getUserPreferences()
      
      expect(response.success).toBe(true)
      expect(response).toHaveProperty('preferences')
      expect(response.preferences).toHaveProperty('keywords')
    })

    it('saveUserPreferences saves preferences', async () => {
      const preferences = { keywords: ['Test'], minValue: 50000 }
      const response = await apiClient.saveUserPreferences(preferences)
      
      expect(response.success).toBe(true)
      expect(response.message).toBe('Preferences saved successfully')
    })
  })
})

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('formats currency values correctly', () => {
      expect(formatCurrency(1000000)).toBe('$1.0M')
      expect(formatCurrency(500000)).toBe('$500K')
      expect(formatCurrency(1500)).toBe('$1,500')
      expect(formatCurrency(null)).toBe('N/A')
      expect(formatCurrency(undefined)).toBe('N/A')
      expect(formatCurrency(0)).toBe('$0')
    })

    it('handles edge cases', () => {
      expect(formatCurrency(1000)).toBe('$1K')
      expect(formatCurrency(999)).toBe('$999')
      expect(formatCurrency(1000000000)).toBe('$1000.0M')
    })
  })

  describe('formatDate', () => {
    it('formats valid date strings', () => {
      expect(formatDate('2024-06-15')).toBe('Jun 15, 2024')
      expect(formatDate('2024-12-31')).toBe('Dec 31, 2024')
    })

    it('handles invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date')
      expect(formatDate(null)).toBe('N/A')
      expect(formatDate(undefined)).toBe('N/A')
      expect(formatDate('')).toBe('N/A')
    })

    it('formats Date objects', () => {
      const date = new Date('2024-06-15')
      expect(formatDate(date)).toBe('Jun 15, 2024')
    })
  })

  describe('parseDate', () => {
    it('parses various date formats', () => {
      const testCases = [
        '2024-06-15',
        '06/15/2024',
        '15/06/2024',
        'June 15, 2024',
        '2024-06-15T10:30:00Z'
      ]

      testCases.forEach(dateStr => {
        const result = parseDate(dateStr)
        expect(result).toBeInstanceOf(Date)
        expect(result.getFullYear()).toBe(2024)
        expect(result.getMonth()).toBe(5) // June (0-indexed)
      })
    })

    it('returns null for invalid dates', () => {
      expect(parseDate('invalid-date')).toBeNull()
      expect(parseDate('')).toBeNull()
      expect(parseDate(null)).toBeNull()
      expect(parseDate(undefined)).toBeNull()
    })

    it('handles already parsed Date objects', () => {
      const date = new Date('2024-06-15')
      expect(parseDate(date)).toBe(date)
    })
  })
})

describe('API Integration', () => {
  it('handles real API response structure', async () => {
    const response = await apiClient.getOpportunities()
    
    // Verify response has expected structure
    expect(response).toHaveProperty('opportunities')
    expect(response).toHaveProperty('total')
    expect(response).toHaveProperty('message')
    
    if (response.opportunities.length > 0) {
      const opportunity = response.opportunities[0]
      expect(opportunity).toHaveProperty('id')
      expect(opportunity).toHaveProperty('title')
      expect(opportunity).toHaveProperty('agency_name')
      expect(opportunity).toHaveProperty('total_score')
    }
  })

  it('handles analytics API response', async () => {
    const response = await apiClient.getAnalytics()
    
    expect(response).toHaveProperty('win_probability')
    expect(response).toHaveProperty('market_growth')
    expect(response).toHaveProperty('predicted_value')
    expect(response).toHaveProperty('competitive_landscape')
    expect(typeof response.win_probability).toBe('number')
  })
})