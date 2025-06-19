// A/B Testing & Feature Experimentation Framework
// Production-ready experimentation system with statistical rigor

import { monitoring } from './monitoring'

class ExperimentManager {
  constructor() {
    this.config = {
      enabled: import.meta.env.PROD || import.meta.env.VITE_ENABLE_EXPERIMENTS === 'true',
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      apiEndpoint: '/api/experiments',
      enableLogging: import.meta.env.DEV,
      cacheTTL: 1000 * 60 * 60, // 1 hour
    }
    
    this.experiments = new Map()
    this.userAssignments = new Map()
    this.conversionEvents = []
    this.isInitialized = false
    
    this.init()
  }

  async init() {
    if (this.isInitialized || !this.config.enabled) return
    
    await this.loadExperiments()
    await this.loadUserAssignments()
    this.setupEventTracking()
    
    this.isInitialized = true
    this.log('Experiment manager initialized')
  }

  getUserId() {
    // Generate or retrieve persistent user ID
    let userId = localStorage.getItem('exp_user_id')
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('exp_user_id', userId)
    }
    return userId
  }

  getSessionId() {
    // Generate session ID
    let sessionId = sessionStorage.getItem('exp_session_id')
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('exp_session_id', sessionId)
    }
    return sessionId
  }

  async loadExperiments() {
    try {
      // In production, this would fetch from your experiment configuration service
      const cachedExperiments = localStorage.getItem('experiments_cache')
      const cacheTime = localStorage.getItem('experiments_cache_time')
      
      if (cachedExperiments && cacheTime && Date.now() - parseInt(cacheTime) < this.config.cacheTTL) {
        const experiments = JSON.parse(cachedExperiments)
        experiments.forEach(exp => this.experiments.set(exp.id, exp))
        return
      }
      
      // Mock experiments for demo - in production, fetch from API
      const experiments = [
        {
          id: 'dashboard_layout_v2',
          name: 'Dashboard Layout V2',
          description: 'Test new dashboard layout with improved UX',
          status: 'active',
          trafficAllocation: 0.5, // 50% of users
          variants: [
            { id: 'control', name: 'Original Layout', allocation: 0.5 },
            { id: 'new_layout', name: 'New Layout', allocation: 0.5 }
          ],
          targetingRules: {
            userTypes: ['all'],
            geographies: ['all'],
            devices: ['all']
          },
          metrics: {
            primary: 'conversion_rate',
            secondary: ['time_on_page', 'bounce_rate', 'feature_usage']
          },
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        },
        {
          id: 'search_algorithm_v3',
          name: 'Search Algorithm V3',
          description: 'Test improved search relevance algorithm',
          status: 'active',
          trafficAllocation: 0.3, // 30% of users
          variants: [
            { id: 'control', name: 'Current Algorithm', allocation: 0.5 },
            { id: 'ml_enhanced', name: 'ML Enhanced Algorithm', allocation: 0.5 }
          ],
          targetingRules: {
            userTypes: ['registered'],
            geographies: ['all'],
            devices: ['all']
          },
          metrics: {
            primary: 'search_success_rate',
            secondary: ['time_to_result', 'result_click_rate']
          },
          startDate: '2024-01-15',
          endDate: '2024-06-15'
        },
        {
          id: 'onboarding_flow_v4',
          name: 'Onboarding Flow V4',
          description: 'Test streamlined onboarding process',
          status: 'active',
          trafficAllocation: 0.2, // 20% of users
          variants: [
            { id: 'control', name: 'Current Onboarding', allocation: 0.33 },
            { id: 'simplified', name: 'Simplified Flow', allocation: 0.33 },
            { id: 'progressive', name: 'Progressive Disclosure', allocation: 0.34 }
          ],
          targetingRules: {
            userTypes: ['new'],
            geographies: ['all'],
            devices: ['all']
          },
          metrics: {
            primary: 'onboarding_completion_rate',
            secondary: ['time_to_complete', 'step_abandonment_rate']
          },
          startDate: '2024-02-01',
          endDate: '2024-05-01'
        }
      ]
      
      experiments.forEach(exp => this.experiments.set(exp.id, exp))
      
      // Cache experiments
      localStorage.setItem('experiments_cache', JSON.stringify(experiments))
      localStorage.setItem('experiments_cache_time', Date.now().toString())
      
    } catch (error) {
      this.log('Failed to load experiments:', error)
    }
  }

  async loadUserAssignments() {
    try {
      const cachedAssignments = localStorage.getItem('user_assignments')
      if (cachedAssignments) {
        const assignments = JSON.parse(cachedAssignments)
        assignments.forEach(assignment => {
          this.userAssignments.set(assignment.experimentId, assignment)
        })
      }
    } catch (error) {
      this.log('Failed to load user assignments:', error)
    }
  }

  saveUserAssignments() {
    try {
      const assignments = Array.from(this.userAssignments.values())
      localStorage.setItem('user_assignments', JSON.stringify(assignments))
    } catch (error) {
      this.log('Failed to save user assignments:', error)
    }
  }

  setupEventTracking() {
    // Track page views for experiment exposure
    this.trackExposure = this.trackExposure.bind(this)
    
    // Track conversion events
    document.addEventListener('click', (event) => {
      if (event.target.hasAttribute('data-experiment-conversion')) {
        const experimentId = event.target.getAttribute('data-experiment-conversion')
        this.trackConversion(experimentId, 'click')
      }
    })
  }

  getVariant(experimentId, defaultVariant = 'control') {
    if (!this.config.enabled) return defaultVariant
    
    const experiment = this.experiments.get(experimentId)
    if (!experiment || experiment.status !== 'active') {
      return defaultVariant
    }
    
    // Check if user is already assigned
    let assignment = this.userAssignments.get(experimentId)
    if (assignment) {
      this.trackExposure(experimentId, assignment.variant)
      return assignment.variant
    }
    
    // Check if user qualifies for experiment
    if (!this.isUserEligible(experiment)) {
      return defaultVariant
    }
    
    // Assign user to variant
    const variant = this.assignUserToVariant(experiment)
    assignment = {
      experimentId,
      variant,
      assignedAt: Date.now(),
      userId: this.config.userId,
      sessionId: this.config.sessionId
    }
    
    this.userAssignments.set(experimentId, assignment)
    this.saveUserAssignments()
    
    // Track assignment
    this.trackAssignment(experimentId, variant)
    this.trackExposure(experimentId, variant)
    
    return variant
  }

  isUserEligible(experiment) {
    // Check traffic allocation
    const hash = this.hashUserId(this.config.userId + experiment.id)
    const userBucket = hash % 100
    
    if (userBucket >= experiment.trafficAllocation * 100) {
      return false
    }
    
    // Check targeting rules
    const rules = experiment.targetingRules
    
    // User type targeting (simplified)
    if (rules.userTypes && !rules.userTypes.includes('all')) {
      const userType = this.getUserType()
      if (!rules.userTypes.includes(userType)) {
        return false
      }
    }
    
    // Device targeting
    if (rules.devices && !rules.devices.includes('all')) {
      const device = this.getDeviceType()
      if (!rules.devices.includes(device)) {
        return false
      }
    }
    
    return true
  }

  assignUserToVariant(experiment) {
    const hash = this.hashUserId(this.config.userId + experiment.id + 'variant')
    const variants = experiment.variants
    let cumulativeAllocation = 0
    const userBucket = (hash % 10000) / 10000 // More precision for variant allocation
    
    for (const variant of variants) {
      cumulativeAllocation += variant.allocation
      if (userBucket < cumulativeAllocation) {
        return variant.id
      }
    }
    
    // Fallback to control
    return variants[0].id
  }

  hashUserId(input) {
    // Simple hash function for user bucketing
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  getUserType() {
    // Determine user type based on session data
    const isLoggedIn = localStorage.getItem('user_token') !== null
    const registrationDate = localStorage.getItem('user_registration_date')
    
    if (!isLoggedIn) return 'anonymous'
    if (!registrationDate) return 'registered'
    
    const daysSinceRegistration = (Date.now() - parseInt(registrationDate)) / (1000 * 60 * 60 * 24)
    return daysSinceRegistration <= 7 ? 'new' : 'returning'
  }

  getDeviceType() {
    const userAgent = navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet'
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile'
    return 'desktop'
  }

  trackExposure(experimentId, variant) {
    monitoring.captureCustomEvent('experiment_exposure', {
      experimentId,
      variant,
      userId: this.config.userId,
      sessionId: this.config.sessionId,
      timestamp: Date.now()
    })
    
    this.log(`Experiment exposure: ${experimentId} = ${variant}`)
  }

  trackAssignment(experimentId, variant) {
    monitoring.captureCustomEvent('experiment_assignment', {
      experimentId,
      variant,
      userId: this.config.userId,
      sessionId: this.config.sessionId,
      timestamp: Date.now()
    })
    
    this.log(`Experiment assignment: ${experimentId} = ${variant}`)
  }

  trackConversion(experimentId, eventType, eventData = {}) {
    const assignment = this.userAssignments.get(experimentId)
    if (!assignment) return
    
    const conversionEvent = {
      experimentId,
      variant: assignment.variant,
      eventType,
      eventData,
      userId: this.config.userId,
      sessionId: this.config.sessionId,
      timestamp: Date.now()
    }
    
    this.conversionEvents.push(conversionEvent)
    
    monitoring.captureCustomEvent('experiment_conversion', conversionEvent)
    
    this.log(`Experiment conversion: ${experimentId} (${assignment.variant}) - ${eventType}`)
  }

  // Convenience methods for common conversion events
  trackPageView(experimentId, page) {
    this.trackConversion(experimentId, 'page_view', { page })
  }

  trackClick(experimentId, element) {
    this.trackConversion(experimentId, 'click', { element })
  }

  trackFormSubmit(experimentId, form) {
    this.trackConversion(experimentId, 'form_submit', { form })
  }

  trackPurchase(experimentId, value, currency = 'USD') {
    this.trackConversion(experimentId, 'purchase', { value, currency })
  }

  trackSignup(experimentId) {
    this.trackConversion(experimentId, 'signup')
  }

  // Get experiment results (for admin/debugging)
  getExperimentResults(experimentId) {
    const experiment = this.experiments.get(experimentId)
    if (!experiment) return null
    
    const assignments = Array.from(this.userAssignments.values())
      .filter(a => a.experimentId === experimentId)
    
    const conversions = this.conversionEvents
      .filter(c => c.experimentId === experimentId)
    
    const results = {}
    experiment.variants.forEach(variant => {
      const variantAssignments = assignments.filter(a => a.variant === variant.id)
      const variantConversions = conversions.filter(c => c.variant === variant.id)
      
      results[variant.id] = {
        assignments: variantAssignments.length,
        conversions: variantConversions.length,
        conversionRate: variantAssignments.length > 0 
          ? (variantConversions.length / variantAssignments.length) * 100 
          : 0
      }
    })
    
    return {
      experiment,
      results,
      totalAssignments: assignments.length,
      totalConversions: conversions.length
    }
  }

  log(message, data = {}) {
    if (this.config.enableLogging) {
      console.log(`🧪 Experiments: ${message}`, data)
    }
  }
}

// React hooks for experiments
export const useExperiment = (experimentId, defaultVariant = 'control') => {
  const [variant, setVariant] = React.useState(defaultVariant)
  const [isLoading, setIsLoading] = React.useState(true)
  
  React.useEffect(() => {
    const manager = experimentManager
    const assignedVariant = manager.getVariant(experimentId, defaultVariant)
    setVariant(assignedVariant)
    setIsLoading(false)
  }, [experimentId, defaultVariant])
  
  const trackConversion = React.useCallback((eventType, eventData) => {
    experimentManager.trackConversion(experimentId, eventType, eventData)
  }, [experimentId])
  
  return {
    variant,
    isLoading,
    trackConversion,
    isControl: variant === 'control',
    isVariant: (variantId) => variant === variantId
  }
}

export const useExperimentTracking = (experimentId) => {
  return {
    trackPageView: (page) => experimentManager.trackPageView(experimentId, page),
    trackClick: (element) => experimentManager.trackClick(experimentId, element),
    trackFormSubmit: (form) => experimentManager.trackFormSubmit(experimentId, form),
    trackConversion: (eventType, eventData) => 
      experimentManager.trackConversion(experimentId, eventType, eventData)
  }
}

// Component wrapper for A/B testing
export const ExperimentWrapper = ({ 
  experimentId, 
  defaultVariant = 'control',
  variants,
  children,
  fallback = null
}) => {
  const { variant, isLoading } = useExperiment(experimentId, defaultVariant)
  
  if (isLoading) {
    return fallback
  }
  
  if (typeof variants === 'object' && variants[variant]) {
    return variants[variant]
  }
  
  if (typeof children === 'function') {
    return children(variant)
  }
  
  return children
}

// Feature flag component
export const FeatureFlag = ({ 
  feature, 
  enabled = false, 
  children, 
  fallback = null 
}) => {
  // In production, this would check feature flag service
  const isEnabled = enabled || localStorage.getItem(`feature_${feature}`) === 'true'
  
  React.useEffect(() => {
    monitoring.captureCustomEvent('feature_flag', {
      feature,
      enabled: isEnabled,
      timestamp: Date.now()
    })
  }, [feature, isEnabled])
  
  return isEnabled ? children : fallback
}

// Statistical significance testing utilities
export const calculateStatisticalSignificance = (controlData, variantData) => {
  const { conversions: controlConversions, visitors: controlVisitors } = controlData
  const { conversions: variantConversions, visitors: variantVisitors } = variantData
  
  const controlRate = controlConversions / controlVisitors
  const variantRate = variantConversions / variantVisitors
  
  const pooledRate = (controlConversions + variantConversions) / (controlVisitors + variantVisitors)
  const pooledSE = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlVisitors + 1/variantVisitors))
  
  const zScore = (variantRate - controlRate) / pooledSE
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))
  
  return {
    controlRate,
    variantRate,
    lift: ((variantRate - controlRate) / controlRate) * 100,
    zScore,
    pValue,
    isSignificant: pValue < 0.05,
    confidence: (1 - pValue) * 100
  }
}

function normalCDF(x) {
  // Approximation of normal cumulative distribution function
  return (1 + Math.sign(x) * Math.sqrt(1 - Math.exp(-2 * x * x / Math.PI))) / 2
}

// Create singleton instance
const experimentManager = new ExperimentManager()

export { experimentManager }
export default ExperimentManager

// Helper to import React for hooks
const React = await import('react')