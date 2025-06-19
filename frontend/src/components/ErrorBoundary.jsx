import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // In production, you would send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { errorInfo } })
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  handleGoHome = () => {
    this.handleReset()
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent } = this.props
      
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={this.state.error}
            resetError={this.handleReset}
            goHome={this.handleGoHome}
          />
        )
      }

      // Default error fallback UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-destructive">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred while loading this page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs bg-muted p-3 rounded">
                  <summary className="cursor-pointer font-medium mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="whitespace-pre-wrap text-destructive">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo.componentStack && (
                    <pre className="mt-2 text-muted-foreground">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
              
              <div className="flex space-x-2">
                <Button 
                  onClick={this.handleReset} 
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                If this problem persists, please contact support
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional error fallback components for specific use cases
export function PageErrorFallback({ error, resetError, goHome }) {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <span>Page Error</span>
          </CardTitle>
          <CardDescription>
            This page encountered an error and couldn't load properly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && error && (
            <div className="bg-muted p-3 rounded text-sm">
              <strong>Error:</strong> {error.message}
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button onClick={resetError} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={goHome}>
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ComponentErrorFallback({ error, resetError }) {
  return (
    <Card className="border-destructive">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-sm">Component failed to load</span>
        </div>
        <Button onClick={resetError} size="sm" variant="outline">
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}

export default ErrorBoundary