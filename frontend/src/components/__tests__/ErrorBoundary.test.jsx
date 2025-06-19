import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary, { PageErrorFallback, ComponentErrorFallback } from '../ErrorBoundary'

// Component that throws an error for testing
function ThrowError({ shouldThrow = false }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('An unexpected error occurred while loading this page')).toBeInTheDocument()
  })

  it('renders custom fallback component when provided', () => {
    const CustomFallback = ({ error, resetError }) => (
      <div>
        <span>Custom error: {error.message}</span>
        <button onClick={resetError}>Reset</button>
      </div>
    )

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
  })

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('resets error state when Try Again is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('navigates home when Go Home is clicked', () => {
    const originalLocation = window.location
    delete window.location
    window.location = { href: '' }

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: /go home/i }))

    expect(window.location.href).toBe('/')

    window.location = originalLocation
  })
})

describe('PageErrorFallback', () => {
  it('renders page error fallback', () => {
    const mockResetError = vi.fn()
    const mockGoHome = vi.fn()
    const error = new Error('Page error')

    render(
      <PageErrorFallback 
        error={error}
        resetError={mockResetError}
        goHome={mockGoHome}
      />
    )

    expect(screen.getByText('Page Error')).toBeInTheDocument()
    expect(screen.getByText('This page encountered an error and couldn\'t load properly')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('calls resetError when retry button is clicked', () => {
    const mockResetError = vi.fn()
    const error = new Error('Page error')

    render(
      <PageErrorFallback 
        error={error}
        resetError={mockResetError}
        goHome={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(mockResetError).toHaveBeenCalledOnce()
  })
})

describe('ComponentErrorFallback', () => {
  it('renders component error fallback', () => {
    const mockResetError = vi.fn()
    const error = new Error('Component error')

    render(
      <ComponentErrorFallback 
        error={error}
        resetError={mockResetError}
      />
    )

    expect(screen.getByText('Component failed to load')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('calls resetError when retry button is clicked', () => {
    const mockResetError = vi.fn()
    const error = new Error('Component error')

    render(
      <ComponentErrorFallback 
        error={error}
        resetError={mockResetError}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(mockResetError).toHaveBeenCalledOnce()
  })
})