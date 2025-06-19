/**
 * PostHog Analytics Configuration
 * Comprehensive analytics tracking for the Opportunity Dashboard
 */

let posthog = null

// Mock PostHog for development/fallback
const mockPostHog = {
  init: () => console.log('📊 PostHog (Mock): Initialized'),
  capture: (event, properties) => console.log('📊 PostHog (Mock):', event, properties),
  identify: (userId, properties) => console.log('📊 PostHog (Mock): Identified', userId, properties),
  alias: (alias) => console.log('📊 PostHog (Mock): Aliased', alias),
  group: (groupType, groupKey, properties) => console.log('📊 PostHog (Mock): Group', groupType, groupKey, properties),
  reset: () => console.log('📊 PostHog (Mock): Reset'),
  isFeatureEnabled: () => false,
  getFeatureFlag: () => null,
  onFeatureFlags: (callback) => callback([]),
  startSessionRecording: () => console.log('📊 PostHog (Mock): Session recording started'),
  stopSessionRecording: () => console.log('📊 PostHog (Mock): Session recording stopped')
}

// PostHog configuration
const POSTHOG_CONFIG = {
  api_host: 'https://app.posthog.com',
  autocapture: true,
  capture_pageview: true,
  capture_pageleave: true,
  disable_session_recording: false,
  enable_recording_console_log: true,
  session_recording: {
    maskAllInputs: false,
    maskInputOptions: {
      password: true,
      email: false
    }
  },
  bootstrap: {
    featureFlags: {}
  },
  loaded: (posthog) => {
    console.log('📊 PostHog: Successfully loaded')
    if (import.meta.env.DEV) {
      posthog.debug()
    }
  }
}

/**
 * Initialize PostHog analytics
 */
export const initializePostHog = async () => {
  try {
    // Only initialize in browser environment
    if (typeof window === 'undefined') {
      return mockPostHog
    }

    // Check if PostHog key is available
    const posthogKey = import.meta.env.VITE_POSTHOG_KEY
    if (!posthogKey) {
      console.warn('📊 PostHog: No API key found, using mock implementation')
      return mockPostHog
    }

    // Dynamically import PostHog to avoid SSR issues
    const { default: posthogModule } = await import('posthog-js')
    
    // Initialize PostHog
    posthogModule.init(posthogKey, POSTHOG_CONFIG)
    
    posthog = posthogModule
    return posthog
  } catch (error) {
    console.error('📊 PostHog: Failed to initialize', error)
    return mockPostHog
  }
}

/**
 * Analytics Event Tracking
 */
export const analytics = {
  // Page and navigation tracking
  page: (pageName, properties = {}) => {
    posthog?.capture('$pageview', {
      page_name: pageName,
      ...properties
    })
  },

  // Opportunity tracking
  opportunity: {
    viewed: (opportunityId, properties = {}) => {
      posthog?.capture('opportunity_viewed', {
        opportunity_id: opportunityId,
        ...properties
      })
    },
    
    saved: (opportunityId, properties = {}) => {
      posthog?.capture('opportunity_saved', {
        opportunity_id: opportunityId,
        ...properties
      })
    },
    
    applied: (opportunityId, properties = {}) => {
      posthog?.capture('opportunity_applied', {
        opportunity_id: opportunityId,
        ...properties
      })
    },
    
    searched: (query, filters = {}, resultCount = 0) => {
      posthog?.capture('opportunity_searched', {
        search_query: query,
        filters: filters,
        result_count: resultCount
      })
    }
  },

  // Scraping and discovery tracking
  scraping: {
    started: (sourceType, sourceCount = 1) => {
      posthog?.capture('scraping_started', {
        source_type: sourceType,
        source_count: sourceCount
      })
    },
    
    completed: (sourceType, opportunitiesFound = 0, duration = 0) => {
      posthog?.capture('scraping_completed', {
        source_type: sourceType,
        opportunities_found: opportunitiesFound,
        duration_seconds: duration
      })
    },
    
    failed: (sourceType, errorMessage = '') => {
      posthog?.capture('scraping_failed', {
        source_type: sourceType,
        error_message: errorMessage
      })
    }
  },

  // AI and discovery tracking
  ai: {
    queryStarted: (queryType, keywords = '') => {
      posthog?.capture('ai_query_started', {
        query_type: queryType,
        keywords: keywords
      })
    },
    
    queryCompleted: (queryType, resultCount = 0, duration = 0) => {
      posthog?.capture('ai_query_completed', {
        query_type: queryType,
        result_count: resultCount,
        duration_seconds: duration
      })
    },
    
    intelligenceViewed: (intelligenceType) => {
      posthog?.capture('intelligence_viewed', {
        intelligence_type: intelligenceType
      })
    }
  },

  // User interaction tracking
  user: {
    registered: (method = 'email') => {
      posthog?.capture('user_registered', {
        registration_method: method
      })
    },
    
    loggedIn: (method = 'email') => {
      posthog?.capture('user_logged_in', {
        login_method: method
      })
    },
    
    preferencesUpdated: (changedFields = []) => {
      posthog?.capture('user_preferences_updated', {
        changed_fields: changedFields
      })
    },
    
    onboarded: (completedSteps = []) => {
      posthog?.capture('user_onboarding_completed', {
        completed_steps: completedSteps
      })
    }
  },

  // Feature usage tracking
  feature: {
    used: (featureName, properties = {}) => {
      posthog?.capture('feature_used', {
        feature_name: featureName,
        ...properties
      })
    },
    
    enabled: (featureName) => {
      posthog?.capture('feature_enabled', {
        feature_name: featureName
      })
    },
    
    disabled: (featureName) => {
      posthog?.capture('feature_disabled', {
        feature_name: featureName
      })
    }
  },

  // Performance tracking
  performance: {
    apiCall: (endpoint, method, duration, status) => {
      posthog?.capture('api_call_performance', {
        endpoint: endpoint,
        method: method,
        duration_ms: duration,
        status: status
      })
    },
    
    pageLoad: (pageName, loadTime) => {
      posthog?.capture('page_load_performance', {
        page_name: pageName,
        load_time_ms: loadTime
      })
    }
  },

  // Error tracking
  error: {
    occurred: (errorType, errorMessage, context = {}) => {
      posthog?.capture('error_occurred', {
        error_type: errorType,
        error_message: errorMessage,
        context: context
      })
    },
    
    boundary: (componentName, error, errorInfo) => {
      posthog?.capture('error_boundary_triggered', {
        component_name: componentName,
        error_message: error.message,
        error_stack: error.stack,
        error_info: errorInfo
      })
    }
  },

  // Custom event tracking
  custom: (eventName, properties = {}) => {
    posthog?.capture(eventName, properties)
  }
}

/**
 * User identification and properties
 */
export const identify = (userId, properties = {}) => {
  posthog?.identify(userId, {
    email: properties.email,
    name: properties.name,
    signup_date: properties.signupDate,
    subscription_tier: properties.subscriptionTier,
    company: properties.company,
    industry: properties.industry,
    ...properties
  })
}

/**
 * Group tracking (for organizations/teams)
 */
export const group = (groupType, groupKey, properties = {}) => {
  posthog?.group(groupType, groupKey, {
    name: properties.name,
    industry: properties.industry,
    size: properties.size,
    plan: properties.plan,
    ...properties
  })
}

/**
 * Feature flags
 */
export const featureFlags = {
  isEnabled: (flagKey) => {
    return posthog?.isFeatureEnabled(flagKey) || false
  },
  
  getValue: (flagKey, defaultValue = null) => {
    return posthog?.getFeatureFlag(flagKey) || defaultValue
  },
  
  onFlagsLoaded: (callback) => {
    posthog?.onFeatureFlags(callback)
  }
}

/**
 * Session recording
 */
export const sessionRecording = {
  start: () => {
    posthog?.startSessionRecording()
    analytics.custom('session_recording_started')
  },
  
  stop: () => {
    posthog?.stopSessionRecording()
    analytics.custom('session_recording_stopped')
  }
}

/**
 * Reset analytics (useful for logout)
 */
export const reset = () => {
  posthog?.reset()
}

// Export the initialized PostHog instance
export { posthog }