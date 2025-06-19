/**
 * Sentry Error Tracking Configuration
 * Comprehensive error monitoring and performance tracking
 */

let Sentry = null

// Mock Sentry for development/fallback
const mockSentry = {
  init: () => console.log('🚨 Sentry (Mock): Initialized'),
  captureException: (error) => console.error('🚨 Sentry (Mock): Exception', error),
  captureMessage: (message, level) => console.log('🚨 Sentry (Mock): Message', message, level),
  addBreadcrumb: (breadcrumb) => console.log('🚨 Sentry (Mock): Breadcrumb', breadcrumb),
  setUser: (user) => console.log('🚨 Sentry (Mock): User', user),
  setTag: (key, value) => console.log('🚨 Sentry (Mock): Tag', key, value),
  setContext: (key, context) => console.log('🚨 Sentry (Mock): Context', key, context),
  configureScope: (callback) => callback({ setTag: mockSentry.setTag, setContext: mockSentry.setContext }),
  withScope: (callback) => callback({ setTag: mockSentry.setTag, setContext: mockSentry.setContext })
}

/**
 * Initialize Sentry error tracking
 */
export const initializeSentry = async () => {
  try {
    // Only initialize in browser environment
    if (typeof window === 'undefined') {
      return mockSentry
    }

    // Check if Sentry DSN is available
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN
    if (!sentryDsn) {
      console.warn('🚨 Sentry: No DSN found, using mock implementation')
      return mockSentry
    }

    // Dynamically import Sentry to avoid SSR issues
    const SentryModule = await import('@sentry/react')
    const { BrowserTracing } = await import('@sentry/tracing')
    
    // Initialize Sentry
    SentryModule.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      integrations: [
        new BrowserTracing({
          // Set sampling rate for performance monitoring
          tracingOrigins: [
            'localhost',
            /^https:\/\/[^/]*\.vercel\.app/,
            /^https:\/\/opportunity-dashboard/
          ]
        })
      ],
      
      // Performance Monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      
      // Error Sampling
      sampleRate: 1.0,
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      
      // Additional configuration
      beforeSend(event, hint) {
        // Filter out development errors
        if (import.meta.env.DEV) {
          console.log('🚨 Sentry: Would send event', event, hint)
          return null // Don't send in development
        }
        
        // Filter sensitive information
        if (event.user) {
          delete event.user.email
        }
        
        return event
      },
      
      beforeBreadcrumb(breadcrumb) {
        // Filter sensitive breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
          return null
        }
        return breadcrumb
      }
    })
    
    Sentry = SentryModule
    console.log('🚨 Sentry: Successfully initialized')
    return SentryModule
  } catch (error) {
    console.error('🚨 Sentry: Failed to initialize', error)
    return mockSentry
  }
}

/**
 * Error tracking utilities
 */
export const errorTracking = {
  // Capture exceptions
  captureException: (error, context = {}) => {
    Sentry?.withScope((scope) => {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key])
      })
      Sentry.captureException(error)
    })
  },
  
  // Capture messages
  captureMessage: (message, level = 'info', context = {}) => {
    Sentry?.withScope((scope) => {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key])
      })
      Sentry.captureMessage(message, level)
    })
  },
  
  // Add breadcrumbs for debugging
  addBreadcrumb: (message, category = 'custom', level = 'info', data = {}) => {
    Sentry?.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000
    })
  },
  
  // API error tracking
  apiError: (endpoint, method, status, error, duration = 0) => {
    errorTracking.captureException(error, {
      api: {
        endpoint,
        method,
        status,
        duration_ms: duration
      }
    })
    
    errorTracking.addBreadcrumb(
      `API Error: ${method} ${endpoint}`,
      'http',
      'error',
      { status, duration_ms: duration }
    )
  },
  
  // Component error tracking
  componentError: (componentName, error, errorInfo) => {
    Sentry?.withScope((scope) => {
      scope.setTag('component', componentName)
      scope.setContext('errorBoundary', {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      })
      Sentry.captureException(error)
    })
  },
  
  // User action errors
  userActionError: (action, error, context = {}) => {
    errorTracking.captureException(error, {
      userAction: {
        action,
        ...context
      }
    })
  },
  
  // Performance issues
  performanceIssue: (issueType, details = {}) => {
    errorTracking.captureMessage(
      `Performance Issue: ${issueType}`,
      'warning',
      { performance: details }
    )
  }
}

/**
 * User context management
 */
export const setUser = (user) => {
  Sentry?.setUser({
    id: user.id,
    username: user.username,
    // Don't send email to Sentry for privacy
    ip_address: '{{auto}}'
  })
}

/**
 * Tag management for filtering
 */
export const setTags = (tags) => {
  Sentry?.configureScope((scope) => {
    Object.keys(tags).forEach(key => {
      scope.setTag(key, tags[key])
    })
  })
}

/**
 * Context management for additional debugging info
 */
export const setContext = (key, context) => {
  Sentry?.setContext(key, context)
}

/**
 * Transaction tracking for performance monitoring
 */
export const performance = {
  startTransaction: (name, op = 'navigation') => {
    return Sentry?.startTransaction({ name, op })
  },
  
  finishTransaction: (transaction) => {
    transaction?.finish()
  },
  
  addSpan: (transaction, spanName, operation, callback) => {
    if (!transaction) return callback()
    
    const span = transaction.startChild({
      op: operation,
      description: spanName
    })
    
    try {
      const result = callback()
      if (result && typeof result.then === 'function') {
        return result.finally(() => span.finish())
      }
      span.finish()
      return result
    } catch (error) {
      span.setStatus('internal_error')
      span.finish()
      throw error
    }
  }
}

// Export the initialized Sentry instance
export { Sentry }