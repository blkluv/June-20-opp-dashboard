/**
 * Mixpanel Analytics Configuration
 * Advanced event tracking and user analytics
 */

let mixpanel = null

// Mock Mixpanel for development/fallback
const mockMixpanel = {
  init: () => console.log('📈 Mixpanel (Mock): Initialized'),
  track: (event, properties) => console.log('📈 Mixpanel (Mock):', event, properties),
  identify: (userId) => console.log('📈 Mixpanel (Mock): Identified', userId),
  people: {
    set: (properties) => console.log('📈 Mixpanel (Mock): People set', properties),
    increment: (property, value) => console.log('📈 Mixpanel (Mock): People increment', property, value),
    append: (property, value) => console.log('📈 Mixpanel (Mock): People append', property, value)
  },
  register: (properties) => console.log('📈 Mixpanel (Mock): Register', properties),
  reset: () => console.log('📈 Mixpanel (Mock): Reset'),
  time_event: (event) => console.log('📈 Mixpanel (Mock): Time event', event)
}

/**
 * Initialize Mixpanel analytics
 */
export const initializeMixpanel = async () => {
  try {
    // Only initialize in browser environment
    if (typeof window === 'undefined') {
      return mockMixpanel
    }

    // Check if Mixpanel token is available
    const mixpanelToken = import.meta.env.VITE_MIXPANEL_TOKEN
    if (!mixpanelToken) {
      console.warn('📈 Mixpanel: No token found, using mock implementation')
      return mockMixpanel
    }

    // Dynamically import Mixpanel to avoid SSR issues
    const mixpanelModule = await import('mixpanel-browser')
    
    // Initialize Mixpanel
    mixpanelModule.init(mixpanelToken, {
      debug: import.meta.env.DEV,
      track_pageview: true,
      persistence: 'localStorage',
      ip: false, // Don't collect IP for privacy
      property_blacklist: ['$current_url', '$initial_referrer', '$referrer'],
      loaded: () => {
        console.log('📈 Mixpanel: Successfully loaded')
      }
    })
    
    mixpanel = mixpanelModule
    return mixpanelModule
  } catch (error) {
    console.error('📈 Mixpanel: Failed to initialize', error)
    return mockMixpanel
  }
}

/**
 * Enhanced analytics tracking with Mixpanel
 */
export const mixpanelAnalytics = {
  // User lifecycle tracking
  user: {
    registered: (userId, properties = {}) => {
      mixpanel?.identify(userId)
      mixpanel?.track('User Registered', {
        registration_method: properties.method || 'email',
        source: properties.source || 'direct',
        ...properties
      })
      mixpanel?.people.set({
        $first_name: properties.firstName,
        $last_name: properties.lastName,
        $email: properties.email,
        $created: new Date().toISOString(),
        industry: properties.industry,
        company_size: properties.companySize
      })
    },
    
    loggedIn: (userId, method = 'email') => {
      mixpanel?.identify(userId)
      mixpanel?.track('User Logged In', {
        login_method: method
      })
      mixpanel?.people.increment('login_count')
      mixpanel?.people.set({ $last_login: new Date().toISOString() })
    },
    
    profileUpdated: (changes = {}) => {
      mixpanel?.track('Profile Updated', {
        updated_fields: Object.keys(changes)
      })
      mixpanel?.people.set(changes)
    }
  },

  // Opportunity engagement tracking
  opportunities: {
    viewed: (opportunityId, properties = {}) => {
      mixpanel?.track('Opportunity Viewed', {
        opportunity_id: opportunityId,
        source_type: properties.sourceType,
        estimated_value: properties.estimatedValue,
        agency: properties.agency,
        score: properties.score
      })
      mixpanel?.people.increment('opportunities_viewed')
    },
    
    saved: (opportunityId, properties = {}) => {
      mixpanel?.track('Opportunity Saved', {
        opportunity_id: opportunityId,
        source_type: properties.sourceType,
        estimated_value: properties.estimatedValue
      })
      mixpanel?.people.increment('opportunities_saved')
      mixpanel?.people.append('saved_opportunity_types', properties.sourceType)
    },
    
    applied: (opportunityId, properties = {}) => {
      mixpanel?.track('Opportunity Applied', {
        opportunity_id: opportunityId,
        estimated_value: properties.estimatedValue,
        application_method: properties.method
      })
      mixpanel?.people.increment('opportunities_applied')
      mixpanel?.people.set({ last_application: new Date().toISOString() })
    },
    
    won: (opportunityId, value = 0) => {
      mixpanel?.track('Opportunity Won', {
        opportunity_id: opportunityId,
        contract_value: value
      })
      mixpanel?.people.increment('opportunities_won')
      mixpanel?.people.increment('total_contract_value', value)
    }
  },

  // Search and discovery tracking
  search: {
    performed: (query, filters = {}, results = 0) => {
      mixpanel?.track('Search Performed', {
        search_query: query,
        filters_used: Object.keys(filters),
        result_count: results,
        has_filters: Object.keys(filters).length > 0
      })
      mixpanel?.people.increment('searches_performed')
    },
    
    filterUsed: (filterType, filterValue) => {
      mixpanel?.track('Search Filter Used', {
        filter_type: filterType,
        filter_value: filterValue
      })
    },
    
    saved: (searchName, criteria = {}) => {
      mixpanel?.track('Search Saved', {
        search_name: searchName,
        criteria_count: Object.keys(criteria).length
      })
      mixpanel?.people.increment('saved_searches')
    }
  },

  // AI and discovery features
  ai: {
    queryStarted: (queryType, complexity = 'medium') => {
      mixpanel?.time_event('AI Query Completed')
      mixpanel?.track('AI Query Started', {
        query_type: queryType,
        complexity: complexity
      })
    },
    
    queryCompleted: (queryType, results = 0, satisfaction = null) => {
      mixpanel?.track('AI Query Completed', {
        query_type: queryType,
        result_count: results,
        user_satisfaction: satisfaction
      })
      mixpanel?.people.increment('ai_queries_completed')
    },
    
    feedbackProvided: (queryType, rating, feedback = '') => {
      mixpanel?.track('AI Feedback Provided', {
        query_type: queryType,
        rating: rating,
        has_written_feedback: feedback.length > 0
      })
    }
  },

  // Scraping and data collection
  scraping: {
    initiated: (sourceType, sourceCount = 1) => {
      mixpanel?.time_event('Scraping Completed')
      mixpanel?.track('Scraping Initiated', {
        source_type: sourceType,
        source_count: sourceCount
      })
    },
    
    completed: (sourceType, opportunitiesFound = 0, duration = 0) => {
      mixpanel?.track('Scraping Completed', {
        source_type: sourceType,
        opportunities_found: opportunitiesFound,
        duration_seconds: duration,
        success: opportunitiesFound > 0
      })
      mixpanel?.people.increment('scraping_sessions')
      mixpanel?.people.increment('total_opportunities_scraped', opportunitiesFound)
    },
    
    sourceSelected: (sourceName, category) => {
      mixpanel?.track('Scraping Source Selected', {
        source_name: sourceName,
        source_category: category
      })
    }
  },

  // Feature usage and engagement
  features: {
    used: (featureName, context = {}) => {
      mixpanel?.track('Feature Used', {
        feature_name: featureName,
        ...context
      })
      mixpanel?.people.append('features_used', featureName)
    },
    
    experimentViewed: (experimentName, variant) => {
      mixpanel?.track('Experiment Viewed', {
        experiment_name: experimentName,
        variant: variant
      })
    },
    
    experimentConverted: (experimentName, variant, conversionType) => {
      mixpanel?.track('Experiment Converted', {
        experiment_name: experimentName,
        variant: variant,
        conversion_type: conversionType
      })
    }
  },

  // Business intelligence and insights
  insights: {
    dashboardViewed: (dashboardType) => {
      mixpanel?.track('Dashboard Viewed', {
        dashboard_type: dashboardType
      })
    },
    
    reportGenerated: (reportType, filters = {}) => {
      mixpanel?.track('Report Generated', {
        report_type: reportType,
        filter_count: Object.keys(filters).length
      })
      mixpanel?.people.increment('reports_generated')
    },
    
    exportPerformed: (dataType, format, recordCount = 0) => {
      mixpanel?.track('Data Exported', {
        data_type: dataType,
        export_format: format,
        record_count: recordCount
      })
    }
  },

  // Error and performance tracking
  technical: {
    errorEncountered: (errorType, page, severity = 'medium') => {
      mixpanel?.track('Error Encountered', {
        error_type: errorType,
        page: page,
        severity: severity
      })
    },
    
    performanceIssue: (issueType, metric, value) => {
      mixpanel?.track('Performance Issue', {
        issue_type: issueType,
        metric: metric,
        value: value
      })
    },
    
    featureLoadTime: (featureName, loadTime) => {
      mixpanel?.track('Feature Load Time', {
        feature_name: featureName,
        load_time_ms: loadTime
      })
    }
  }
}

/**
 * User properties management
 */
export const setUserProperties = (properties) => {
  mixpanel?.people.set(properties)
}

export const incrementUserProperty = (property, value = 1) => {
  mixpanel?.people.increment(property, value)
}

export const appendToUserProperty = (property, value) => {
  mixpanel?.people.append(property, value)
}

/**
 * Super properties (sent with every event)
 */
export const setSuperProperties = (properties) => {
  mixpanel?.register(properties)
}

/**
 * Reset user data (for logout)
 */
export const resetMixpanel = () => {
  mixpanel?.reset()
}

// Export the initialized Mixpanel instance
export { mixpanel }