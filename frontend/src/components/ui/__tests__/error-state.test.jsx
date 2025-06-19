import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { 
  ErrorState, 
  NetworkErrorState, 
  TimeoutErrorState, 
  ServerErrorState,
  UnauthorizedErrorState,
  NotFoundErrorState,
  InlineError,
  useErrorType
} from '../error-state'

describe('ErrorState', () => {
  it('renders default error state', () => {
    render(<ErrorState />)
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
  })

  it('renders custom title and description', () => {
    render(
      <ErrorState 
        title="Custom Title"
        description="Custom description"
      />
    )
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom description')).toBeInTheDocument()
  })

  it('shows retry button when onRetry is provided', () => {
    const mockRetry = vi.fn()
    
    render(<ErrorState onRetry={mockRetry} />)
    
    const retryButton = screen.getByRole('button', { name: /try again/i })
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    expect(mockRetry).toHaveBeenCalledOnce()
  })

  it('shows error details in development mode when showDetails is true', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    const error = new Error('Test error message')
    
    render(
      <ErrorState 
        error={error}
        showDetails={true}
      />
    )
    
    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument()
    expect(screen.getByText('Error: Test error message')).toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  it('renders children when provided', () => {
    render(
      <ErrorState>
        <div>Custom content</div>
      </ErrorState>
    )
    
    expect(screen.getByText('Custom content')).toBeInTheDocument()
  })

  it('applies different error types correctly', () => {
    const { rerender } = render(<ErrorState type="network" />)
    expect(screen.getByText('Connection Error')).toBeInTheDocument()
    
    rerender(<ErrorState type="timeout" />)
    expect(screen.getByText('Request Timeout')).toBeInTheDocument()
    
    rerender(<ErrorState type="server" />)
    expect(screen.getByText('Server Error')).toBeInTheDocument()
    
    rerender(<ErrorState type="unauthorized" />)
    expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    
    rerender(<ErrorState type="notFound" />)
    expect(screen.getByText('No Data Found')).toBeInTheDocument()
  })
})

describe('Specialized Error Components', () => {
  it('renders NetworkErrorState with correct content', () => {
    const mockRetry = vi.fn()
    
    render(<NetworkErrorState onRetry={mockRetry} />)
    
    expect(screen.getByText('Connection Error')).toBeInTheDocument()
    expect(screen.getByText('Please check your internet connection and try again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /check connection/i })).toBeInTheDocument()
  })

  it('renders TimeoutErrorState with correct content', () => {
    render(<TimeoutErrorState />)
    
    expect(screen.getByText('Request Timeout')).toBeInTheDocument()
    expect(screen.getByText('The server is taking longer than expected to respond.')).toBeInTheDocument()
  })

  it('renders ServerErrorState with correct content', () => {
    render(<ServerErrorState />)
    
    expect(screen.getByText('Server Error')).toBeInTheDocument()
    expect(screen.getByText('Our team has been notified and is working on a fix.')).toBeInTheDocument()
  })

  it('renders UnauthorizedErrorState with correct content', () => {
    render(<UnauthorizedErrorState />)
    
    expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    expect(screen.getByText('Go to Settings to verify your API keys are correct.')).toBeInTheDocument()
  })

  it('renders NotFoundErrorState with correct content', () => {
    render(<NotFoundErrorState />)
    
    expect(screen.getByText('No Results Found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your search criteria or filters')).toBeInTheDocument()
    expect(screen.getByText('• Broaden your search terms')).toBeInTheDocument()
    expect(screen.getByText('• Check your filter settings')).toBeInTheDocument()
    expect(screen.getByText('• Try different keywords')).toBeInTheDocument()
  })
})

describe('InlineError', () => {
  it('renders inline error with retry button', () => {
    const mockRetry = vi.fn()
    const error = new Error('Network error')
    
    render(<InlineError error={error} onRetry={mockRetry} />)
    
    expect(screen.getByText('Connection Error')).toBeInTheDocument()
    
    const retryButton = screen.getByRole('button', { name: /retry/i })
    fireEvent.click(retryButton)
    expect(mockRetry).toHaveBeenCalledOnce()
  })

  it('renders without retry button when onRetry is not provided', () => {
    const error = new Error('Test error')
    
    render(<InlineError error={error} />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('useErrorType', () => {
  it('returns correct error types based on error messages', () => {
    const { result } = renderHook(() => {
      return {
        network: useErrorType(new Error('network failed')),
        timeout: useErrorType(new Error('request timeout')),
        unauthorized: useErrorType(new Error('401 unauthorized')),
        notFound: useErrorType(new Error('404 not found')),
        server: useErrorType(new Error('500 server error')),
        general: useErrorType(new Error('something else')),
        noError: useErrorType(null)
      }
    })
    
    expect(result.current.network).toBe('network')
    expect(result.current.timeout).toBe('timeout')
    expect(result.current.unauthorized).toBe('unauthorized')
    expect(result.current.notFound).toBe('notFound')
    expect(result.current.server).toBe('server')
    expect(result.current.general).toBe('general')
    expect(result.current.noError).toBe('general')
  })
})

// Helper for testing hooks
function renderHook(hook) {
  let result
  function TestComponent() {
    result = hook()
    return null
  }
  render(<TestComponent />)
  return { result }
}