// Safe Analytics Manager - Minimal version that won't break the app
// This is a fallback when the full analytics system has issues

class SafeAnalyticsManager {
  constructor() {
    this.enabled = false
    this.log('Safe Analytics Manager initialized - tracking disabled')
  }

  // All methods are no-ops to prevent errors
  track() { return this }
  identify() { return this }
  setUserProperty() { return this }
  setSessionProperty() { return this }
  getUserProperty() { return null }
  getSessionProperty() { return null }
  trackConversion() { return this }
  trackSearch() { return this }
  trackFeatureUsage() { return this }
  trackTiming() { return this }
  trackError() { return this }
  trackPurchase() { return this }
  trackAddToCart() { return this }
  trackFunnelStep() { return this }
  flush() { return Promise.resolve() }
  optOut() { return this }
  optIn() { return this }

  // Custom methods for your app
  performanceMetric() { return this }
  opportunityViewed() { return this }
  searchPerformed() { return this }
  aiQueryStarted() { return this }
  aiQueryCompleted() { return this }

  log(message, data = {}) {
    if (import.meta.env.DEV) {
      console.log('[Safe Analytics]', message, data)
    }
  }
}

// Create singleton instance
const safeAnalyticsManager = new SafeAnalyticsManager()

// Export hooks that won't break
export const useAnalytics = () => safeAnalyticsManager
export const usePageTracking = () => {}
export const useFeatureTracking = () => ({ track: () => {} })
export const withAnalytics = (WrappedComponent) => WrappedComponent

export { safeAnalyticsManager as analyticsManager }
export default safeAnalyticsManager 