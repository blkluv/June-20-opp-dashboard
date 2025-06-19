import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import ErrorBoundary from '@/components/ErrorBoundary'

// Custom render function that includes providers
export function renderWithProviders(ui, options = {}) {
  const { initialRoute = '/', ...renderOptions } = options

  function Wrapper({ children }) {
    // Set initial route if specified
    if (initialRoute !== '/') {
      window.history.pushState({}, 'Test page', initialRoute)
    }

    return (
      <ErrorBoundary>
        <BrowserRouter>
          {children}
          <Toaster />
        </BrowserRouter>
      </ErrorBoundary>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock API client for tests
export class MockApiClient {
  constructor(responses = {}) {
    this.responses = responses
    this.calls = []
  }

  async request(endpoint, options = {}) {
    this.calls.push({ endpoint, options })
    
    if (this.responses[endpoint]) {
      const response = this.responses[endpoint]
      if (response instanceof Error) {
        throw response
      }
      return response
    }

    // Default responses
    const defaultResponses = {
      '/opportunities': {
        opportunities: [],
        total: 0,
        message: 'Mock data'
      },
      '/user/preferences': {
        success: true,
        preferences: {
          keywords: [],
          agencies: [],
          minValue: 50000,
          maxValue: 10000000
        }
      }
    }

    return defaultResponses[endpoint] || { success: true }
  }

  // Helper methods for testing
  getLastCall() {
    return this.calls[this.calls.length - 1]
  }

  getCalls() {
    return this.calls
  }

  clearCalls() {
    this.calls = []
  }
}

// Test data factories
export const createMockOpportunity = (overrides = {}) => ({
  id: '1',
  title: 'Test Opportunity',
  description: 'Test description',
  agency_name: 'Test Agency',
  estimated_value: 1000000,
  due_date: '2024-12-31',
  posted_date: '2024-01-01',
  status: 'active',
  source_type: 'federal_contract',
  source_name: 'SAM.gov',
  total_score: 85,
  opportunity_number: 'TEST-001',
  ...overrides
})

export const createMockUserPreferences = (overrides = {}) => ({
  company: 'Test Company',
  capabilities: 'Testing services',
  keywords: ['Testing', 'Quality Assurance'],
  naicsCodes: ['541511'],
  minValue: 100000,
  maxValue: 5000000,
  agencies: ['Test Agency'],
  emailAlerts: true,
  alertFrequency: 'daily',
  minScoreThreshold: 70,
  isOnboarded: true,
  ...overrides
})

// Wait utilities
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Custom matchers for common patterns
export const expectToBeLoading = (element) => {
  expect(element).toBeInTheDocument()
  expect(element).toHaveTextContent(/loading/i)
}

export const expectToShowError = (container, errorMessage) => {
  expect(container).toHaveTextContent(/error|failed|something went wrong/i)
  if (errorMessage) {
    expect(container).toHaveTextContent(errorMessage)
  }
}

// Mock localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Setup/teardown helpers
export const setupTest = () => {
  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
  })
}

export const teardownTest = () => {
  vi.restoreAllMocks()
}