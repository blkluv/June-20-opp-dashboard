// Comprehensive Error Reporting & Performance Monitoring System
// Production-ready monitoring integrated with analytics providers

// Safe import for analytics
let analyticsManager
try {
  analyticsManager = require('./analytics').analyticsManager
} catch (e) {
  analyticsManager = require('./analytics-safe').analyticsManager
}

class MonitoringService {
  constructor() {
    this.config = {
      apiEndpoint: '/api/monitoring',
      environment: import.meta.env.MODE || 'development',
      version: '1.0.0',
      enabled: import.meta.env.PROD || false,
      maxErrors: 100, // Max errors to store locally
      maxPerformanceEntries: 50,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
    }
    
    this.errorQueue = []
    this.performanceQueue = []
    this.userSession = this.initializeSession()
    this.isInitialized = false
    this.analytics = analyticsManager
    
    this.init()
  }

  initializeSession() {
    return {
      id: this.generateSessionId(),
      startTime: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    }
  }

  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  init() {
    if (this.isInitialized || !this.config.enabled) return
    
    // Initialize analytics integration
    this.analytics.init()
    
    this.setupErrorHandlers()
    this.setupPerformanceMonitoring()
    this.setupUnloadHandler()
    this.startBatchProcessor()
    
    this.isInitialized = true
    console.log('🔍 Monitoring service initialized')
    
    // Track monitoring initialization
    this.analytics.track('monitoring_service_initialized', {
      environment: this.config.environment,
      version: this.config.version
    })
  }

  setupErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'promise_rejection',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
      })
    })

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.captureError({
          type: 'resource',
          message: `Failed to load: ${event.target.src || event.target.href}`,
          element: event.target.tagName,
          timestamp: Date.now(),
        })
      }
    }, true)
  }

  setupPerformanceMonitoring() {
    // Web Vitals monitoring
    this.observeWebVitals()
    
    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.captureNavigationTiming()
      }, 0)
    })

    // Long task monitoring
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.capturePerformance({
                type: 'long_task',
                duration: entry.duration,
                startTime: entry.startTime,
                timestamp: Date.now(),
              })
            }
          })
        })
        observer.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // Long task API not supported
      }
    }
  }

  observeWebVitals() {
    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
        })
        observer.observe({ entryTypes: ['layout-shift'] })

        // Report CLS on page visibility change
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            this.captureWebVital('CLS', clsValue)
          }
        })
      } catch (e) {
        // Layout shift API not supported
      }
    }

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.captureWebVital('LCP', lastEntry.startTime)
        })
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        // LCP API not supported
      }
    }

    // First Input Delay (FID)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.captureWebVital('FID', entry.processingStart - entry.startTime)
          })
        })
        observer.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        // FID API not supported
      }
    }
  }

  captureNavigationTiming() {
    const navigation = performance.getEntriesByType('navigation')[0]
    if (navigation) {
      this.capturePerformance({
        type: 'navigation',
        metrics: {
          dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp_connect: navigation.connectEnd - navigation.connectStart,
          request_response: navigation.responseEnd - navigation.requestStart,
          dom_parse: navigation.domContentLoadedEventEnd - navigation.responseEnd,
          total_load_time: navigation.loadEventEnd - navigation.navigationStart,
        },
        timestamp: Date.now(),
      })
    }
  }

  captureWebVital(name, value) {
    this.capturePerformance({
      type: 'web_vital',
      metric: name,
      value: value,
      rating: this.getWebVitalRating(name, value),
      timestamp: Date.now(),
    })
  }

  getWebVitalRating(metric, value) {
    const thresholds = {
      CLS: { good: 0.1, needs_improvement: 0.25 },
      LCP: { good: 2500, needs_improvement: 4000 },
      FID: { good: 100, needs_improvement: 300 },
    }

    const threshold = thresholds[metric]
    if (!threshold) return 'unknown'
    
    if (value <= threshold.good) return 'good'
    if (value <= threshold.needs_improvement) return 'needs_improvement'
    return 'poor'
  }

  setupUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      this.flush()
    })

    // Use Page Visibility API for better reliability
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush()
      }
    })
  }

  startBatchProcessor() {
    setInterval(() => {
      this.processBatch()
    }, this.config.flushInterval)
  }

  captureError(errorData) {
    if (!this.config.enabled) return

    const enrichedError = {
      ...errorData,
      session_id: this.userSession.id,
      url: window.location.href,
      user_agent: navigator.userAgent,
      environment: this.config.environment,
      version: this.config.version,
      breadcrumbs: this.getBreadcrumbs(),
    }

    this.errorQueue.push(enrichedError)
    
    // Immediate flush for critical errors
    if (errorData.type === 'javascript' || errorData.type === 'promise_rejection') {
      setTimeout(() => this.processBatch(), 1000)
    }

    // Prevent queue overflow
    if (this.errorQueue.length > this.config.maxErrors) {
      this.errorQueue = this.errorQueue.slice(-this.config.maxErrors * 0.8)
    }
  }

  capturePerformance(performanceData) {
    if (!this.config.enabled) return

    const enrichedPerformance = {
      ...performanceData,
      session_id: this.userSession.id,
      url: window.location.href,
      environment: this.config.environment,
      version: this.config.version,
    }

    this.performanceQueue.push(enrichedPerformance)

    // Prevent queue overflow
    if (this.performanceQueue.length > this.config.maxPerformanceEntries) {
      this.performanceQueue = this.performanceQueue.slice(-this.config.maxPerformanceEntries * 0.8)
    }
  }

  // User interaction tracking
  captureUserAction(action, data = {}) {
    if (!this.config.enabled) return

    this.captureCustomEvent('user_action', {
      action,
      data,
      timestamp: Date.now(),
    })
  }

  // API performance tracking
  captureApiCall(endpoint, method, duration, status, error = null) {
    this.capturePerformance({
      type: 'api_call',
      endpoint,
      method,
      duration,
      status,
      error: error?.message,
      timestamp: Date.now(),
    })
    
    // Send to analytics
    this.analytics.performanceMetric('api_response_time', duration, {
      endpoint,
      method,
      status
    })
    
    // Track errors in analytics
    if (error) {
      this.analytics.trackError(error, {
        api: { endpoint, method, status, duration }
      })
    }
  }

  // Custom event tracking
  captureCustomEvent(type, data) {
    if (!this.config.enabled) return

    this.capturePerformance({
      type: 'custom_event',
      event_type: type,
      data,
      timestamp: Date.now(),
    })
  }

  getBreadcrumbs() {
    // Simple breadcrumb implementation
    const path = window.location.pathname
    const parts = path.split('/').filter(Boolean)
    return parts.length > 0 ? parts : ['home']
  }

  async processBatch() {
    if (this.errorQueue.length === 0 && this.performanceQueue.length === 0) return

    const batch = {
      errors: this.errorQueue.splice(0, this.config.batchSize),
      performance: this.performanceQueue.splice(0, this.config.batchSize),
      session: this.userSession,
      timestamp: Date.now(),
    }

    try {
      await this.sendBatch(batch)
    } catch (error) {
      // Silently fail - don't want monitoring to break the app
      console.warn('Failed to send monitoring batch:', error)
    }
  }

  async sendBatch(batch) {
    if (batch.errors.length === 0 && batch.performance.length === 0) return

    // Use sendBeacon for reliability during page unload
    if (navigator.sendBeacon && document.visibilityState === 'hidden') {
      navigator.sendBeacon(
        this.config.apiEndpoint,
        JSON.stringify(batch)
      )
      return
    }

    // Regular fetch for normal operations
    try {
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
        keepalive: true,
      })
    } catch (error) {
      // Store failed batches in localStorage for retry
      this.storeFailedBatch(batch)
    }
  }

  storeFailedBatch(batch) {
    try {
      const stored = JSON.parse(localStorage.getItem('monitoring_failed_batches') || '[]')
      stored.push(batch)
      
      // Keep only last 10 failed batches
      const limited = stored.slice(-10)
      localStorage.setItem('monitoring_failed_batches', JSON.stringify(limited))
    } catch (e) {
      // localStorage full or unavailable
    }
  }

  async retryFailedBatches() {
    try {
      const failed = JSON.parse(localStorage.getItem('monitoring_failed_batches') || '[]')
      if (failed.length === 0) return

      for (const batch of failed) {
        await this.sendBatch(batch)
      }

      localStorage.removeItem('monitoring_failed_batches')
    } catch (error) {
      // Retry failed, keep batches for next time
    }
  }

  flush() {
    if (this.errorQueue.length > 0 || this.performanceQueue.length > 0) {
      this.processBatch()
    }
  }

  // Public API methods
  setUser(userData) {
    this.userSession.user = userData
  }

  setContext(key, value) {
    this.userSession.context = this.userSession.context || {}
    this.userSession.context[key] = value
  }

  // Feature flag integration
  captureFeatureFlag(flag, value) {
    this.captureCustomEvent('feature_flag', { flag, value })
  }

  // A/B test integration
  captureExperiment(experimentId, variant) {
    this.captureCustomEvent('experiment', { experimentId, variant })
  }
}

// Create singleton instance
export const monitoring = new MonitoringService()

// React Error Boundary integration
export const captureComponentError = (error, errorInfo) => {
  monitoring.captureError({
    type: 'react_error',
    message: error.message,
    stack: error.stack,
    component_stack: errorInfo.componentStack,
    timestamp: Date.now(),
  })
}

// API client integration helper
export const withApiMonitoring = (apiClient) => {
  const originalRequest = apiClient.request.bind(apiClient)
  
  apiClient.request = async (endpoint, options = {}) => {
    const startTime = performance.now()
    const method = options.method || 'GET'
    
    try {
      const result = await originalRequest(endpoint, options)
      const duration = performance.now() - startTime
      
      monitoring.captureApiCall(endpoint, method, duration, 'success')
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      const status = error.status || 'error'
      
      monitoring.captureApiCall(endpoint, method, duration, status, error)
      throw error
    }
  }
  
  return apiClient
}

// React hook for user action tracking
export const useUserActionTracking = () => {
  return {
    trackClick: (element, data) => monitoring.captureUserAction('click', { element, ...data }),
    trackFormSubmit: (form, data) => monitoring.captureUserAction('form_submit', { form, ...data }),
    trackPageView: (page) => monitoring.captureUserAction('page_view', { page }),
    trackSearch: (query, results) => monitoring.captureUserAction('search', { query, results }),
    trackCustom: (action, data) => monitoring.captureUserAction(action, data),
  }
}

// Performance monitoring utilities
export const measureComponentRender = (componentName) => {
  return {
    start: () => performance.mark(`${componentName}-start`),
    end: () => {
      performance.mark(`${componentName}-end`)
      performance.measure(componentName, `${componentName}-start`, `${componentName}-end`)
      
      const measure = performance.getEntriesByName(componentName)[0]
      if (measure) {
        monitoring.capturePerformance({
          type: 'component_render',
          component: componentName,
          duration: measure.duration,
          timestamp: Date.now(),
        })
      }
    }
  }
}

export default monitoring