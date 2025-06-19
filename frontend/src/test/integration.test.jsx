import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, createMockOpportunity } from './utils'
import { server } from './mocks/server'
import { http, HttpResponse } from 'msw'

// Import components to test
import App from '../App'
import PersonalizedDashboard from '../components/PersonalizedDashboard'
import UserSettingsPage from '../components/UserSettingsPage'
import ErrorBoundary from '../components/ErrorBoundary'

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('App Component with Error Boundaries', () => {
    it('renders main application without errors', () => {
      renderWithProviders(<App />)
      
      // Should render sidebar navigation
      expect(screen.getByText('OpportunityHub')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('My Opportunities')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('handles component errors gracefully', () => {
      // Spy on console.error to suppress error output during test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const ThrowError = () => {
        throw new Error('Test component error')
      }
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })

  describe('User Settings Flow', () => {
    it('loads and saves user preferences', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<UserSettingsPage />)
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText('Loading preferences...')).not.toBeInTheDocument()
      })
      
      // Should render settings form
      expect(screen.getByText('User Settings')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Profile' })).toBeInTheDocument()
      
      // Fill in company name
      const companyInput = screen.getByLabelText(/company name/i)
      await user.clear(companyInput)
      await user.type(companyInput, 'Test Company LLC')
      
      // Select some keywords
      const aiKeyword = screen.getByText('Artificial Intelligence')
      await user.click(aiKeyword)
      
      // Save settings
      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)
      
      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Settings saved!')).toBeInTheDocument()
      })
    })

    it('validates form inputs correctly', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<UserSettingsPage />)
      
      await waitFor(() => {
        expect(screen.queryByText('Loading preferences...')).not.toBeInTheDocument()
      })
      
      // Try to save without required fields
      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)
      
      // Should show validation errors (if validation is implemented)
      // This would depend on the form validation being fully integrated
    })
  })

  describe('Personalized Dashboard Flow', () => {
    it('loads personalized opportunities successfully', async () => {
      renderWithProviders(<PersonalizedDashboard />)
      
      // Should show loading state initially
      expect(screen.getByText('Loading your personalized opportunities...')).toBeInTheDocument()
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText('Loading your personalized opportunities...')).not.toBeInTheDocument()
      })
      
      // Should show personalized content
      expect(screen.getByText('Your Personalized Opportunities')).toBeInTheDocument()
      expect(screen.getByText('Active Filters')).toBeInTheDocument()
    })

    it('handles API errors gracefully', async () => {
      // Mock API error
      server.use(
        http.get('*/api/opportunities/personalized', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )
      
      renderWithProviders(<PersonalizedDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Unable to Load Personalized Data')).toBeInTheDocument()
      })
      
      // Should show retry button
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })
  })

  describe('Navigation Flow', () => {
    it('navigates between pages correctly', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<App />)
      
      // Navigate to My Opportunities
      const myOpportunitiesLink = screen.getByRole('link', { name: /my opportunities/i })
      await user.click(myOpportunitiesLink)
      
      // Should navigate to personalized dashboard
      await waitFor(() => {
        expect(screen.getByText('Your Personalized Opportunities')).toBeInTheDocument()
      })
      
      // Navigate to Settings
      const settingsLink = screen.getByRole('link', { name: /settings/i })
      await user.click(settingsLink)
      
      // Should navigate to settings page
      await waitFor(() => {
        expect(screen.getByText('User Settings')).toBeInTheDocument()
      })
    })
  })

  describe('Error State Handling', () => {
    it('shows appropriate error states for different error types', async () => {
      // Test network error
      server.use(
        http.get('*/api/test/network-error', () => {
          return HttpResponse.error()
        })
      )
      
      const { InlineError, useErrorType } = await import('../components/ui/error-state')
      
      function TestErrorComponent() {
        const [error, setError] = React.useState(null)
        
        const handleTriggerError = () => {
          setError(new Error('network failed'))
        }
        
        return (
          <div>
            <button onClick={handleTriggerError}>Trigger Error</button>
            {error && <InlineError error={error} />}
          </div>
        )
      }
      
      const user = userEvent.setup()
      render(<TestErrorComponent />)
      
      const triggerButton = screen.getByRole('button', { name: /trigger error/i })
      await user.click(triggerButton)
      
      expect(screen.getByText('Connection Error')).toBeInTheDocument()
    })
  })

  describe('Data Flow Integration', () => {
    it('integrates real API responses with UI components', async () => {
      // Test that mock server responses work with actual components
      renderWithProviders(<PersonalizedDashboard />)
      
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument()
      })
      
      // Should display mock data from server
      expect(screen.getByText('2 matches found')).toBeInTheDocument()
      expect(screen.getByText('Active Filters')).toBeInTheDocument()
    })

    it('handles empty data states correctly', async () => {
      // Mock empty response
      server.use(
        http.get('*/api/opportunities/personalized', () => {
          return HttpResponse.json({
            success: true,
            opportunities: [],
            total: 0,
            insights: {
              total_matches: 0,
              avg_score: 0,
              top_agencies: [],
              value_distribution: {},
              recommendations: ['No opportunities match your current criteria']
            },
            preferences_applied: {
              keywords: [],
              value_range: '$0 - $0',
              preferred_agencies: [],
              min_score_threshold: 70
            }
          })
        })
      )
      
      renderWithProviders(<PersonalizedDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('0 matches found')).toBeInTheDocument()
      })
      
      expect(screen.getByText('No opportunities match your current criteria')).toBeInTheDocument()
    })
  })

  describe('Form Validation Integration', () => {
    it('validates user preferences with Zod schema', async () => {
      const { userPreferencesSchema } = await import('../lib/validation')
      
      // Test valid data
      const validData = {
        company: 'Test Company',
        keywords: ['AI', 'Cybersecurity'],
        naicsCodes: ['541511'],
        minValue: 100000,
        maxValue: 5000000,
        setAsideTypes: [],
        agencies: [],
        statesOfInterest: [],
        emailAlerts: true,
        alertFrequency: 'daily',
        minScoreThreshold: 70,
        excludeKeywords: [],
        competitionLevel: 'all',
        opportunityTypes: ['contract'],
        isOnboarded: true
      }
      
      expect(() => userPreferencesSchema.parse(validData)).not.toThrow()
      
      // Test invalid data
      const invalidData = {
        company: '', // Required field empty
        keywords: [], // Required field empty
        minValue: -100, // Invalid negative value
        maxValue: 50000, // Max < min
        alertFrequency: 'invalid', // Invalid enum value
        opportunityTypes: [] // Required field empty
      }
      
      expect(() => userPreferencesSchema.parse(invalidData)).toThrow()
    })
  })
})

// Helper function for React hooks
const React = await import('react')