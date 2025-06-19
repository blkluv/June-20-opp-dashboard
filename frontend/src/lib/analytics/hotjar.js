/**
 * Hotjar Heatmaps and User Session Recording
 * User behavior analytics and session recordings
 */

let hj = null

// Mock Hotjar for development/fallback
const mockHotjar = {
  init: () => console.log('🔥 Hotjar (Mock): Initialized'),
  hj: (event, data) => console.log('🔥 Hotjar (Mock):', event, data),
  identify: (userId, attributes) => console.log('🔥 Hotjar (Mock): Identified', userId, attributes),
  event: (eventName) => console.log('🔥 Hotjar (Mock): Event', eventName),
  stateChange: (url) => console.log('🔥 Hotjar (Mock): State change', url)
}

/**
 * Initialize Hotjar
 */
export const initializeHotjar = async () => {
  try {
    // Only initialize in browser environment
    if (typeof window === 'undefined') {
      return mockHotjar
    }

    // Check if Hotjar ID is available
    const hotjarId = import.meta.env.VITE_HOTJAR_ID
    const hotjarSnippetVersion = import.meta.env.VITE_HOTJAR_VERSION || 6

    if (!hotjarId) {
      console.warn('🔥 Hotjar: No site ID found, using mock implementation')
      return mockHotjar
    }

    // Initialize Hotjar manually (since there's no npm package)
    window.hj = window.hj || function() {
      (window.hj.q = window.hj.q || []).push(arguments)
    }
    window._hjSettings = { hjid: hotjarId, hjsv: hotjarSnippetVersion }

    // Dynamically load Hotjar script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://static.hotjar.com/c/hotjar-${hotjarId}.js?sv=${hotjarSnippetVersion}`
    document.head.appendChild(script)

    hj = window.hj
    console.log('🔥 Hotjar: Successfully initialized')
    return window.hj
  } catch (error) {
    console.error('🔥 Hotjar: Failed to initialize', error)
    return mockHotjar
  }
}

/**
 * Hotjar tracking utilities
 */
export const hotjarTracking = {
  // User identification
  identify: (userId, attributes = {}) => {
    hj?.('identify', userId, {
      user_id: userId,
      email: attributes.email,
      name: attributes.name,
      company: attributes.company,
      industry: attributes.industry,
      plan: attributes.plan,
      signup_date: attributes.signupDate,
      ...attributes
    })
  },

  // Custom events
  event: (eventName) => {
    hj?.('event', eventName)
  },

  // Page state changes (for SPAs)
  stateChange: (url) => {
    hj?.('stateChange', url)
  },

  // Opportunity-specific events
  opportunities: {
    viewed: (opportunityId) => {
      hotjarTracking.event('opportunity_viewed')
    },
    
    saved: () => {
      hotjarTracking.event('opportunity_saved')
    },
    
    applied: () => {
      hotjarTracking.event('opportunity_applied')
    },
    
    filtered: () => {
      hotjarTracking.event('opportunities_filtered')
    },
    
    exported: () => {
      hotjarTracking.event('opportunities_exported')
    }
  },

  // Feature usage events
  features: {
    aiDiscoveryUsed: () => {
      hotjarTracking.event('ai_discovery_used')
    },
    
    webScrapingStarted: () => {
      hotjarTracking.event('web_scraping_started')
    },
    
    intelligenceViewed: () => {
      hotjarTracking.event('intelligence_viewed')
    },
    
    analyticsViewed: () => {
      hotjarTracking.event('analytics_viewed')
    },
    
    settingsChanged: () => {
      hotjarTracking.event('settings_changed')
    }
  },

  // User journey events
  journey: {
    onboardingStarted: () => {
      hotjarTracking.event('onboarding_started')
    },
    
    onboardingCompleted: () => {
      hotjarTracking.event('onboarding_completed')
    },
    
    firstOpportunityViewed: () => {
      hotjarTracking.event('first_opportunity_viewed')
    },
    
    firstSearchPerformed: () => {
      hotjarTracking.event('first_search_performed')
    },
    
    firstScrapeInitiated: () => {
      hotjarTracking.event('first_scrape_initiated')
    }
  },

  // Error and friction points
  errors: {
    formError: (formName) => {
      hotjarTracking.event(`form_error_${formName}`)
    },
    
    apiError: (endpoint) => {
      hotjarTracking.event('api_error')
    },
    
    loadingTimeout: (feature) => {
      hotjarTracking.event('loading_timeout')
    },
    
    featureNotWorking: (feature) => {
      hotjarTracking.event(`${feature}_not_working`)
    }
  },

  // Engagement and satisfaction
  engagement: {
    longSession: () => {
      hotjarTracking.event('long_session') // 15+ minutes
    },
    
    multipleFeatures: () => {
      hotjarTracking.event('multiple_features_used')
    },
    
    returningUser: () => {
      hotjarTracking.event('returning_user')
    },
    
    highEngagement: () => {
      hotjarTracking.event('high_engagement') // Multiple actions in session
    }
  }
}

/**
 * Trigger recordings for specific scenarios
 */
export const triggerRecording = {
  // High-value user actions
  criticalUserAction: () => {
    hj?.('trigger', 'critical_user_action')
  },
  
  // Error scenarios
  errorEncountered: () => {
    hj?.('trigger', 'error_encountered')
  },
  
  // Feature adoption
  newFeatureUsed: () => {
    hj?.('trigger', 'new_feature_used')
  },
  
  // Conversion events
  opportunityApplied: () => {
    hj?.('trigger', 'opportunity_applied')
  }
}

/**
 * Form analysis helpers
 */
export const formAnalysis = {
  // Track form interactions
  formStarted: (formName) => {
    hotjarTracking.event(`${formName}_form_started`)
  },
  
  formCompleted: (formName) => {
    hotjarTracking.event(`${formName}_form_completed`)
  },
  
  formAbandoned: (formName, fieldName) => {
    hotjarTracking.event(`${formName}_form_abandoned`)
  },
  
  fieldError: (formName, fieldName) => {
    hotjarTracking.event(`${formName}_field_error`)
  }
}

/**
 * Custom surveys and feedback
 */
export const feedback = {
  // Trigger surveys
  triggerSurvey: (surveyId) => {
    hj?.('trigger', `survey_${surveyId}`)
  },
  
  // NPS surveys
  triggerNPS: () => {
    hj?.('trigger', 'nps_survey')
  },
  
  // Feature feedback
  featureFeedback: (featureName) => {
    hj?.('trigger', `${featureName}_feedback`)
  }
}

// Export the initialized Hotjar instance
export { hj }