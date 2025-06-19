/**
 * Unified Analytics Manager
 * Central hub for all analytics providers (PostHog, Sentry, Mixpanel, Hotjar)
 */

import { initializePostHog, analytics as posthogAnalytics, identify as posthogIdentify, reset as posthogReset } from './posthog'
import { initializeSentry, errorTracking, setUser as sentrySetUser, setTags, performance } from './sentry'
import { initializeMixpanel, mixpanelAnalytics, setUserProperties, resetMixpanel } from './mixpanel'
import { initializeHotjar, hotjarTracking, triggerRecording, formAnalysis } from './hotjar'

class AnalyticsManager {
  constructor() {
    this.initialized = false
    this.providers = {
      posthog: null,
      sentry: null,
      mixpanel: null,
      hotjar: null
    }
    this.user = null
    this.isDebugMode = import.meta.env.DEV
  }

  /**
   * Initialize all analytics providers
   */
  async init() {
    if (this.initialized) {
      console.warn('📊 Analytics: Already initialized')
      return
    }

    try {
      console.log('📊 Analytics: Initializing all providers...')

      // Initialize all providers concurrently
      const [posthog, sentry, mixpanel, hotjar] = await Promise.allSettled([
        initializePostHog(),
        initializeSentry(),
        initializeMixpanel(),
        initializeHotjar()
      ])

      // Store provider instances
      this.providers.posthog = posthog.status === 'fulfilled' ? posthog.value : null
      this.providers.sentry = sentry.status === 'fulfilled' ? sentry.value : null
      this.providers.mixpanel = mixpanel.status === 'fulfilled' ? mixpanel.value : null
      this.providers.hotjar = hotjar.status === 'fulfilled' ? hotjar.value : null

      // Set common tags and context
      setTags({
        environment: import.meta.env.MODE,
        version: import.meta.env.VITE_APP_VERSION || '1.0.0'
      })

      this.initialized = true
      console.log('📊 Analytics: Successfully initialized all providers')

      // Track initialization
      this.track('analytics_initialized', {
        providers: Object.keys(this.providers).filter(key => this.providers[key] !== null)
      })
    } catch (error) {
      console.error('📊 Analytics: Failed to initialize', error)
      errorTracking.captureException(error, { context: 'analytics_initialization' })
    }
  }

  /**
   * Identify user across all providers
   */
  identify(userId, properties = {}) {
    if (!this.initialized) {
      console.warn('📊 Analytics: Not initialized, call init() first')
      return
    }

    this.user = { id: userId, ...properties }

    // PostHog identification
    posthogIdentify(userId, properties)

    // Sentry user context
    sentrySetUser({
      id: userId,
      username: properties.username,
      email: properties.email // Be careful with PII
    })

    // Mixpanel identification
    if (this.providers.mixpanel) {
      this.providers.mixpanel.identify(userId)
      setUserProperties({
        $name: properties.name,
        $email: properties.email,
        $created: properties.createdAt || new Date().toISOString(),
        industry: properties.industry,
        company: properties.company,
        plan: properties.plan
      })
    }

    // Hotjar identification
    hotjarTracking.identify(userId, properties)

    console.log('📊 Analytics: User identified', userId)
  }

  /**
   * Track events across all providers
   */
  track(eventName, properties = {}) {
    if (!this.initialized) {
      if (this.isDebugMode) {
        console.log('📊 Analytics (Not Initialized):', eventName, properties)
      }
      return
    }

    const enrichedProperties = {
      ...properties,
      timestamp: new Date().toISOString(),
      user_id: this.user?.id,
      session_id: this.getSessionId()
    }

    // PostHog tracking
    posthogAnalytics.custom(eventName, enrichedProperties)

    // Mixpanel tracking (convert event name to title case)
    const mixpanelEventName = this.formatEventName(eventName)
    if (this.providers.mixpanel) {
      this.providers.mixpanel.track(mixpanelEventName, enrichedProperties)
    }

    // Hotjar event (convert to snake_case)
    const hotjarEventName = eventName.toLowerCase().replace(/ /g, '_')
    hotjarTracking.event(hotjarEventName)

    // Add breadcrumb to Sentry
    errorTracking.addBreadcrumb(
      `Event: ${eventName}`,
      'user',
      'info',
      enrichedProperties
    )

    if (this.isDebugMode) {
      console.log('📊 Analytics: Event tracked', eventName, enrichedProperties)
    }
  }

  /**
   * Track page views
   */
  page(pageName, properties = {}) {
    this.track('page_viewed', {
      page_name: pageName,
      ...properties
    })

    // Hotjar state change for SPAs
    hotjarTracking.stateChange(window.location.href)
  }

  /**
   * Track errors across providers
   */
  trackError(error, context = {}) {
    // Sentry error tracking
    errorTracking.captureException(error, context)

    // PostHog error event
    posthogAnalytics.error.occurred(
      error.name || 'UnknownError',
      error.message,
      context
    )

    // Mixpanel error tracking
    if (this.providers.mixpanel) {
      this.providers.mixpanel.track('Error Occurred', {
        error_type: error.name,
        error_message: error.message,
        ...context
      })
    }

    // Hotjar error trigger
    triggerRecording.errorEncountered()
  }

  /**
   * Convenience methods for common events
   */
  
  // User events
  userRegistered(userId, properties = {}) {
    this.identify(userId, properties)
    this.track('user_registered', properties)
    mixpanelAnalytics.user.registered(userId, properties)
  }

  userLoggedIn(userId, method = 'email') {
    this.identify(userId)
    this.track('user_logged_in', { method })
    mixpanelAnalytics.user.loggedIn(userId, method)
  }

  // Opportunity events
  opportunityViewed(opportunityId, properties = {}) {
    this.track('opportunity_viewed', { opportunity_id: opportunityId, ...properties })
    posthogAnalytics.opportunity.viewed(opportunityId, properties)
    mixpanelAnalytics.opportunities.viewed(opportunityId, properties)
    hotjarTracking.opportunities.viewed(opportunityId)
  }

  opportunitySaved(opportunityId, properties = {}) {
    this.track('opportunity_saved', { opportunity_id: opportunityId, ...properties })
    posthogAnalytics.opportunity.saved(opportunityId, properties)
    mixpanelAnalytics.opportunities.saved(opportunityId, properties)
    hotjarTracking.opportunities.saved()
  }

  opportunityApplied(opportunityId, properties = {}) {
    this.track('opportunity_applied', { opportunity_id: opportunityId, ...properties })
    posthogAnalytics.opportunity.applied(opportunityId, properties)
    mixpanelAnalytics.opportunities.applied(opportunityId, properties)
    hotjarTracking.opportunities.applied()
    triggerRecording.opportunityApplied()
  }

  // Search events
  searchPerformed(query, filters = {}, results = 0) {
    this.track('search_performed', { query, filters, result_count: results })
    posthogAnalytics.opportunity.searched(query, filters, results)
    mixpanelAnalytics.search.performed(query, filters, results)
  }

  // AI events
  aiQueryStarted(queryType, keywords = '') {
    this.track('ai_query_started', { query_type: queryType, keywords })
    posthogAnalytics.ai.queryStarted(queryType, keywords)
    mixpanelAnalytics.ai.queryStarted(queryType)
    hotjarTracking.features.aiDiscoveryUsed()
  }

  aiQueryCompleted(queryType, results = 0, duration = 0) {
    this.track('ai_query_completed', { query_type: queryType, result_count: results, duration })
    posthogAnalytics.ai.queryCompleted(queryType, results, duration)
    mixpanelAnalytics.ai.queryCompleted(queryType, results)
  }

  // Scraping events
  scrapingStarted(sourceType, sourceCount = 1) {
    this.track('scraping_started', { source_type: sourceType, source_count: sourceCount })
    posthogAnalytics.scraping.started(sourceType, sourceCount)
    mixpanelAnalytics.scraping.initiated(sourceType, sourceCount)
    hotjarTracking.features.webScrapingStarted()
  }

  scrapingCompleted(sourceType, opportunitiesFound = 0, duration = 0) {
    this.track('scraping_completed', { 
      source_type: sourceType, 
      opportunities_found: opportunitiesFound, 
      duration 
    })
    posthogAnalytics.scraping.completed(sourceType, opportunitiesFound, duration)
    mixpanelAnalytics.scraping.completed(sourceType, opportunitiesFound, duration)
  }

  // Feature usage
  featureUsed(featureName, properties = {}) {
    this.track('feature_used', { feature_name: featureName, ...properties })
    posthogAnalytics.feature.used(featureName, properties)
    mixpanelAnalytics.features.used(featureName, properties)
  }

  // Performance tracking
  performanceMetric(metricName, value, context = {}) {
    this.track('performance_metric', { 
      metric_name: metricName, 
      value, 
      ...context 
    })
    posthogAnalytics.performance.pageLoad(context.page_name, value)
  }

  // Form tracking
  formStarted(formName) {
    this.track('form_started', { form_name: formName })
    formAnalysis.formStarted(formName)
  }

  formCompleted(formName) {
    this.track('form_completed', { form_name: formName })
    formAnalysis.formCompleted(formName)
  }

  formError(formName, fieldName, error) {
    this.track('form_error', { form_name: formName, field_name: fieldName })
    formAnalysis.fieldError(formName, fieldName)
    hotjarTracking.errors.formError(formName)
  }

  /**
   * Reset all analytics (for logout)
   */
  reset() {
    this.user = null
    posthogReset()
    resetMixpanel()
    console.log('📊 Analytics: User data reset')
  }

  /**
   * Utility methods
   */
  
  formatEventName(eventName) {
    // Convert snake_case to Title Case for Mixpanel
    return eventName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  getSessionId() {
    // Simple session ID generation
    if (!window.sessionStorage.getItem('analytics_session_id')) {
      window.sessionStorage.setItem('analytics_session_id', 
        Date.now().toString(36) + Math.random().toString(36).substr(2)
      )
    }
    return window.sessionStorage.getItem('analytics_session_id')
  }

  /**
   * Get current user
   */
  getUser() {
    return this.user
  }

  /**
   * Check if initialized
   */
  isInitialized() {
    return this.initialized
  }
}

// Create singleton instance
export const analyticsManager = new AnalyticsManager()

// Export convenience methods
export const {
  init,
  identify,
  track,
  page,
  trackError,
  userRegistered,
  userLoggedIn,
  opportunityViewed,
  opportunitySaved,
  opportunityApplied,
  searchPerformed,
  aiQueryStarted,
  aiQueryCompleted,
  scrapingStarted,
  scrapingCompleted,
  featureUsed,
  performanceMetric,
  formStarted,
  formCompleted,
  formError,
  reset
} = analyticsManager

// Export analytics manager as default
export default analyticsManager