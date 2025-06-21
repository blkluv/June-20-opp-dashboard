// Advanced Analytics & User Tracking System
// Comprehensive user behavior tracking with privacy-first approach

import React from 'react'

// Safe imports with fallbacks
let monitoring, experimentManager
try {
  monitoring = require('./monitoring').monitoring
} catch (e) {
  monitoring = { captureApiCall: () => {}, captureError: () => {} }
}

try {
  experimentManager = require('./experiments').experimentManager
} catch (e) {
  experimentManager = { getActiveExperiments: () => [], getVariant: () => null }
}

class AnalyticsManager {
  constructor() {
    try {
      // Initialize privacy mode first
      const privacyMode = localStorage.getItem('analytics_privacy_mode') === 'true'
      
      this.config = {
        enabled: import.meta.env.PROD || import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
        enableLogging: import.meta.env.DEV,
        apiEndpoint: '/api/analytics',
        batchSize: 20,
        flushInterval: 30000, // 30 seconds
        maxQueueSize: 1000,
        enableHeatmaps: true,
        enableScrollTracking: true,
        enableClickTracking: true,
        enableFormTracking: true,
        privacyMode: privacyMode
      }
      
      // Set user and session IDs after config is initialized
      this.config.userId = this.getUserId()
      this.config.sessionId = this.getSessionId()
      
      this.eventQueue = []
      this.userProperties = new Map()
      this.sessionProperties = new Map()
      this.pageViewId = null
      this.startTime = Date.now()
      this.isInitialized = false
      
      this.init()
    } catch (error) {
      console.warn('Analytics initialization failed:', error)
      // Set up minimal config to prevent further errors
      this.config = { enabled: false, enableLogging: false }
      this.eventQueue = []
      this.userProperties = new Map()
      this.sessionProperties = new Map()
      this.isInitialized = false
    }
  }

  async init() {
    if (this.isInitialized || !this.config.enabled) return
    
    await this.loadUserProperties()
    this.identifyUser()
    this.setupAutoTracking()
    this.startBatchProcessor()
    
    this.isInitialized = true
    this.log('Analytics manager initialized')
  }

  getUserId() {
    let userId = localStorage.getItem('analytics_user_id')
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      // Check privacy mode safely
      const privacyMode = localStorage.getItem('analytics_privacy_mode') === 'true'
      if (!privacyMode) {
        localStorage.setItem('analytics_user_id', userId)
      }
    }
    return userId
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('analytics_session_id', sessionId)
    }
    return sessionId
  }

  async loadUserProperties() {
    try {
      if (!this.config.privacyMode) {
        const stored = localStorage.getItem('user_properties')
        if (stored) {
          const properties = JSON.parse(stored)
          Object.entries(properties).forEach(([key, value]) => {
            this.userProperties.set(key, value)
          })
        }
      }
    } catch (error) {
      this.log('Failed to load user properties:', error)
    }
  }

  saveUserProperties() {
    if (this.config.privacyMode) return
    
    try {
      const properties = Object.fromEntries(this.userProperties)
      localStorage.setItem('user_properties', JSON.stringify(properties))
    } catch (error) {
      this.log('Failed to save user properties:', error)
    }
  }

  identifyUser() {
    // Set up basic user context
    this.setUserProperty('first_seen', this.userProperties.get('first_seen') || Date.now())
    this.setUserProperty('sessions_count', (this.userProperties.get('sessions_count') || 0) + 1)
    this.setUserProperty('user_agent', navigator.userAgent)
    this.setUserProperty('language', navigator.language)
    this.setUserProperty('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone)
    this.setUserProperty('screen_resolution', `${screen.width}x${screen.height}`)
    
    // Session properties
    this.setSessionProperty('session_start', Date.now())
    this.setSessionProperty('referrer', document.referrer)
    this.setSessionProperty('landing_page', window.location.href)
    this.setSessionProperty('device_type', this.getDeviceType())
    this.setSessionProperty('browser', this.getBrowser())
    this.setSessionProperty('os', this.getOS())
  }

  setupAutoTracking() {
    this.trackPageView()
    this.setupScrollTracking()
    this.setupClickTracking()
    this.setupFormTracking()
    this.setupNavigationTracking()
    this.setupVisibilityTracking()
    this.setupErrorTracking()
  }

  trackPageView() {
    this.pageViewId = 'pv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    this.track('page_view', {
      page_id: this.pageViewId,
      url: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now()
    })
  }

  setupScrollTracking() {
    if (!this.config.enableScrollTracking) return
    
    let maxScrollDepth = 0
    let scrollMilestones = [25, 50, 75, 90, 100]
    let trackedMilestones = new Set()
    
    const trackScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / documentHeight) * 100)
      
      maxScrollDepth = Math.max(maxScrollDepth, scrollPercent)
      
      scrollMilestones.forEach(milestone => {
        if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
          trackedMilestones.add(milestone)
          this.track('scroll_depth', {
            page_id: this.pageViewId,
            depth_percent: milestone,
            max_depth: maxScrollDepth,
            timestamp: Date.now()
          })
        }
      })
    }
    
    let scrollTimeout
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(trackScroll, 100)
    })
    
    // Track scroll depth on page unload
    window.addEventListener('beforeunload', () => {
      if (maxScrollDepth > 0) {
        this.track('scroll_depth_final', {
          page_id: this.pageViewId,
          max_depth: maxScrollDepth,
          timestamp: Date.now()
        })
      }
    })
  }

  setupClickTracking() {
    if (!this.config.enableClickTracking) return
    
    document.addEventListener('click', (event) => {
      const element = event.target
      const clickData = {
        page_id: this.pageViewId,
        element_type: element.tagName.toLowerCase(),
        element_text: element.textContent?.trim().substring(0, 100) || '',
        element_id: element.id || '',
        element_class: element.className || '',
        x: event.clientX,
        y: event.clientY,
        timestamp: Date.now()
      }
      
      // Track specific element types
      if (element.tagName === 'A') {
        clickData.link_url = element.href
        clickData.link_target = element.target
      }
      
      if (element.tagName === 'BUTTON' || element.type === 'submit') {
        clickData.button_type = element.type || 'button'
      }
      
      // Track data attributes for custom tracking
      if (element.hasAttribute('data-analytics-event')) {
        clickData.custom_event = element.getAttribute('data-analytics-event')
        clickData.custom_data = element.getAttribute('data-analytics-data')
      }
      
      this.track('click', clickData)
    })
  }

  setupFormTracking() {
    if (!this.config.enableFormTracking) return
    
    const trackedForms = new Map()
    
    // Track form starts
    document.addEventListener('focusin', (event) => {
      const form = event.target.closest('form')
      if (form && !trackedForms.has(form)) {
        trackedForms.set(form, {
          start_time: Date.now(),
          fields_interacted: new Set()
        })
        
        this.track('form_start', {
          page_id: this.pageViewId,
          form_id: form.id || '',
          form_class: form.className || '',
          timestamp: Date.now()
        })
      }
    })
    
    // Track field interactions
    document.addEventListener('input', (event) => {
      const form = event.target.closest('form')
      if (form && trackedForms.has(form)) {
        const formData = trackedForms.get(form)
        formData.fields_interacted.add(event.target.name || event.target.id)
      }
    })
    
    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target
      const formData = trackedForms.get(form)
      
      this.track('form_submit', {
        page_id: this.pageViewId,
        form_id: form.id || '',
        form_class: form.className || '',
        fields_count: form.elements.length,
        fields_interacted: formData ? formData.fields_interacted.size : 0,
        time_to_submit: formData ? Date.now() - formData.start_time : 0,
        timestamp: Date.now()
      })
    })
  }

  setupNavigationTracking() {
    // Track page unload
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - this.startTime
      this.track('page_unload', {
        page_id: this.pageViewId,
        time_on_page: timeOnPage,
        timestamp: Date.now()
      }, true) // Force immediate send
    })
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.track('visibility_change', {
        page_id: this.pageViewId,
        visibility_state: document.visibilityState,
        timestamp: Date.now()
      })
    })
  }

  setupVisibilityTracking() {
    let sessionStart = Date.now()
    let sessionActive = true
    
    const trackSessionEnd = () => {
      if (sessionActive) {
        this.track('session_end', {
          session_duration: Date.now() - sessionStart,
          pages_viewed: this.getSessionProperty('pages_viewed') || 1,
          timestamp: Date.now()
        })
        sessionActive = false
      }
    }
    
    window.addEventListener('beforeunload', trackSessionEnd)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        trackSessionEnd()
      }
    })
  }

  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.track('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        page_id: this.pageViewId,
        timestamp: Date.now()
      })
    })
  }

  startBatchProcessor() {
    setInterval(() => {
      this.flush()
    }, this.config.flushInterval)
  }

  // Core tracking methods
  track(eventName, properties = {}, immediate = false) {
    if (!this.config.enabled) return
    
    const event = {
      event: eventName,
      properties: {
        ...properties,
        user_id: this.config.userId,
        session_id: this.config.sessionId,
        timestamp: Date.now(),
        page_url: window.location.href,
        user_agent: navigator.userAgent
      },
      user_properties: Object.fromEntries(this.userProperties),
      session_properties: Object.fromEntries(this.sessionProperties)
    }
    
    // Add experiment context
    this.addExperimentContext(event)
    
    this.eventQueue.push(event)
    
    // Prevent queue overflow
    if (this.eventQueue.length > this.config.maxQueueSize) {
      this.eventQueue = this.eventQueue.slice(-this.config.maxQueueSize * 0.8)
    }
    
    if (immediate) {
      this.flush()
    }
    
    this.log(`Tracked: ${eventName}`, properties)
  }

  addExperimentContext(event) {
    try {
      const assignments = experimentManager.userAssignments
      if (assignments.size > 0) {
        event.experiments = {}
        assignments.forEach((assignment, experimentId) => {
          event.experiments[experimentId] = assignment.variant
        })
      }
    } catch (error) {
      // Experiment manager not available
    }
  }

  identify(userId, properties = {}) {
    if (userId) {
      this.config.userId = userId
      if (!this.config.privacyMode) {
        localStorage.setItem('analytics_user_id', userId)
      }
    }
    
    Object.entries(properties).forEach(([key, value]) => {
      this.setUserProperty(key, value)
    })
    
    this.track('identify', { user_id: userId, ...properties })
  }

  setUserProperty(key, value) {
    this.userProperties.set(key, value)
    this.saveUserProperties()
  }

  setSessionProperty(key, value) {
    this.sessionProperties.set(key, value)
  }

  getUserProperty(key) {
    return this.userProperties.get(key)
  }

  getSessionProperty(key) {
    return this.sessionProperties.get(key)
  }

  // Custom event tracking methods
  trackConversion(conversionType, value = null, currency = 'USD') {
    this.track('conversion', {
      conversion_type: conversionType,
      value,
      currency,
      page_id: this.pageViewId
    })
  }

  trackSearch(query, resultsCount = null, filters = {}) {
    this.track('search', {
      query,
      results_count: resultsCount,
      filters,
      page_id: this.pageViewId
    })
  }

  trackFeatureUsage(feature, action = 'used', metadata = {}) {
    this.track('feature_usage', {
      feature,
      action,
      metadata,
      page_id: this.pageViewId
    })
  }

  trackTiming(category, variable, value, label = null) {
    this.track('timing', {
      category,
      variable,
      value,
      label,
      page_id: this.pageViewId
    })
  }

  trackError(errorType, message, metadata = {}) {
    this.track('error', {
      error_type: errorType,
      message,
      metadata,
      page_id: this.pageViewId
    })
  }

  // E-commerce tracking
  trackPurchase(transactionId, items, revenue, currency = 'USD') {
    this.track('purchase', {
      transaction_id: transactionId,
      items,
      revenue,
      currency,
      page_id: this.pageViewId
    })
  }

  trackAddToCart(item, quantity = 1) {
    this.track('add_to_cart', {
      item,
      quantity,
      page_id: this.pageViewId
    })
  }

  // Funnel tracking
  trackFunnelStep(funnelName, stepName, stepNumber, metadata = {}) {
    this.track('funnel_step', {
      funnel_name: funnelName,
      step_name: stepName,
      step_number: stepNumber,
      metadata,
      page_id: this.pageViewId
    })
  }

  async flush() {
    if (this.eventQueue.length === 0) return
    
    const batch = {
      events: this.eventQueue.splice(0, this.config.batchSize),
      user_id: this.config.userId,
      session_id: this.config.sessionId,
      timestamp: Date.now()
    }
    
    try {
      await this.sendBatch(batch)
    } catch (error) {
      this.log('Failed to send analytics batch:', error)
      // Re-queue failed events (up to a limit)
      if (this.eventQueue.length < this.config.maxQueueSize / 2) {
        this.eventQueue.unshift(...batch.events)
      }
    }
  }

  async sendBatch(batch) {
    if (!batch.events.length) return
    
    // Use sendBeacon for reliability during page unload
    if (navigator.sendBeacon && document.visibilityState === 'hidden') {
      navigator.sendBeacon(
        this.config.apiEndpoint,
        JSON.stringify(batch)
      )
      return
    }
    
    // Regular fetch for normal operations
    await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batch),
      keepalive: true
    })
  }

  // Utility methods
  getDeviceType() {
    const userAgent = navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet'
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile'
    return 'desktop'
  }

  getBrowser() {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  getOS() {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  // Privacy controls
  optOut() {
    this.config.enabled = false
    this.config.privacyMode = true
    localStorage.setItem('analytics_privacy_mode', 'true')
    localStorage.removeItem('analytics_user_id')
    localStorage.removeItem('user_properties')
    this.log('Analytics opt-out enabled')
  }

  optIn() {
    this.config.enabled = true
    this.config.privacyMode = false
    localStorage.setItem('analytics_privacy_mode', 'false')
    this.log('Analytics opt-in enabled')
  }

  log(message, data = {}) {
    if (this.config.enableLogging) {
      console.log(`📊 Analytics: ${message}`, data)
    }
  }
}

// React hooks for analytics
export const useAnalytics = () => {
  return {
    track: analyticsManager.track.bind(analyticsManager),
    identify: analyticsManager.identify.bind(analyticsManager),
    trackConversion: analyticsManager.trackConversion.bind(analyticsManager),
    trackSearch: analyticsManager.trackSearch.bind(analyticsManager),
    trackFeatureUsage: analyticsManager.trackFeatureUsage.bind(analyticsManager),
    trackTiming: analyticsManager.trackTiming.bind(analyticsManager),
    setUserProperty: analyticsManager.setUserProperty.bind(analyticsManager),
    setSessionProperty: analyticsManager.setSessionProperty.bind(analyticsManager)
  }
}

export const usePageTracking = (pageName, metadata = {}) => {
  React.useEffect(() => {
    analyticsManager.track('page_view', {
      page_name: pageName,
      ...metadata
    })
  }, [pageName, metadata])
}

export const useFeatureTracking = (featureName) => {
  return {
    trackUsage: (action = 'used', metadata = {}) => {
      analyticsManager.trackFeatureUsage(featureName, action, metadata)
    },
    trackClick: (elementName) => {
      analyticsManager.track('feature_click', {
        feature: featureName,
        element: elementName
      })
    },
    trackView: () => {
      analyticsManager.track('feature_view', {
        feature: featureName
      })
    }
  }
}

// HOC for component analytics
export const withAnalytics = (WrappedComponent, componentName) => {
  return function AnalyticsWrappedComponent(props) {
    React.useEffect(() => {
      analyticsManager.track('component_mount', {
        component: componentName
      })
      
      return () => {
        analyticsManager.track('component_unmount', {
          component: componentName
        })
      }
    }, [])
    
    return React.createElement(WrappedComponent, props)
  }
}

// Create singleton instance
const analyticsManager = new AnalyticsManager()

export { analyticsManager }
export default AnalyticsManager

