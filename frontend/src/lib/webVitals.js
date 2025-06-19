// Advanced Web Vitals Monitoring
// Comprehensive performance tracking for Core Web Vitals and custom metrics

import React from 'react'
import { monitoring } from './monitoring'

class WebVitalsMonitor {
  constructor() {
    this.metrics = new Map()
    this.observers = []
    this.isInitialized = false
    this.config = {
      enableLogging: import.meta.env.DEV,
      thresholds: {
        CLS: { good: 0.1, poor: 0.25 },
        LCP: { good: 2500, poor: 4000 },
        FID: { good: 100, poor: 300 },
        FCP: { good: 1800, poor: 3000 },
        TTFB: { good: 800, poor: 1800 },
        TBT: { good: 200, poor: 600 },
        INP: { good: 200, poor: 500 }
      }
    }
    
    this.init()
  }

  init() {
    if (this.isInitialized || typeof window === 'undefined') return
    
    // Wait for page load to ensure accurate measurements
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => this.initializeObservers())
    } else {
      this.initializeObservers()
    }
    
    this.isInitialized = true
  }

  initializeObservers() {
    this.observeLCP()
    this.observeFID()
    this.observeCLS()
    this.observeFCP()
    this.observeTTFB()
    this.observeINP()
    this.observeCustomMetrics()
    this.setupVisibilityChangeHandler()
  }

  // Largest Contentful Paint
  observeLCP() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        
        this.reportMetric('LCP', lastEntry.startTime, {
          element: lastEntry.element?.tagName || 'unknown',
          url: lastEntry.url,
          size: lastEntry.size
        })
      })
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(observer)
    } catch (e) {
      this.log('LCP observer failed:', e)
    }
  }

  // First Input Delay
  observeFID() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const fid = entry.processingStart - entry.startTime
          
          this.reportMetric('FID', fid, {
            eventType: entry.name,
            target: entry.target?.tagName || 'unknown',
            startTime: entry.startTime
          })
        })
      })
      
      observer.observe({ entryTypes: ['first-input'] })
      this.observers.push(observer)
    } catch (e) {
      this.log('FID observer failed:', e)
    }
  }

  // Cumulative Layout Shift
  observeCLS() {
    if (!('PerformanceObserver' in window)) return

    try {
      let clsValue = 0
      const sessionEntries = []
      let sessionValue = 0
      let sessionCount = 0

      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Only count layout shifts without recent user input
          if (!entry.hadRecentInput) {
            if (sessionEntries.length === 0 || entry.startTime - sessionEntries[sessionEntries.length - 1].startTime < 1000) {
              sessionValue += entry.value
              sessionEntries.push(entry)
            } else {
              sessionValue = entry.value
              sessionEntries.length = 0
              sessionEntries.push(entry)
            }
            
            clsValue = Math.max(sessionValue, clsValue)
          }
        })
      })
      
      observer.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(observer)

      // Report CLS on visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.reportMetric('CLS', clsValue, {
            sessionEntries: sessionEntries.length,
            finalValue: clsValue
          })
        }
      })
    } catch (e) {
      this.log('CLS observer failed:', e)
    }
  }

  // First Contentful Paint
  observeFCP() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.reportMetric('FCP', entry.startTime)
          }
        })
      })
      
      observer.observe({ entryTypes: ['paint'] })
      this.observers.push(observer)
    } catch (e) {
      this.log('FCP observer failed:', e)
    }
  }

  // Time to First Byte
  observeTTFB() {
    // Use Navigation Timing API
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0]
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart
        this.reportMetric('TTFB', ttfb, {
          dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
          connectTime: navigation.connectEnd - navigation.connectStart,
          requestTime: navigation.responseStart - navigation.requestStart
        })
      }
    })
  }

  // Interaction to Next Paint (INP)
  observeINP() {
    if (!('PerformanceObserver' in window)) return

    try {
      let maxInteractionDelay = 0
      
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const interactionDelay = entry.processingStart - entry.startTime
          maxInteractionDelay = Math.max(maxInteractionDelay, interactionDelay)
        })
      })
      
      observer.observe({ entryTypes: ['event'] })
      this.observers.push(observer)

      // Report INP on visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && maxInteractionDelay > 0) {
          this.reportMetric('INP', maxInteractionDelay)
        }
      })
    } catch (e) {
      this.log('INP observer failed:', e)
    }
  }

  // Custom performance metrics
  observeCustomMetrics() {
    this.observeLongTasks()
    this.observeResourceTiming()
    this.observeMemoryUsage()
    this.observeConnectionType()
  }

  observeLongTasks() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            this.reportCustomMetric('long_task', {
              duration: entry.duration,
              startTime: entry.startTime,
              attribution: entry.attribution?.[0]?.name || 'unknown'
            })
          }
        })
      })
      
      observer.observe({ entryTypes: ['longtask'] })
      this.observers.push(observer)
    } catch (e) {
      this.log('Long tasks observer failed:', e)
    }
  }

  observeResourceTiming() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Report slow loading resources
          if (entry.duration > 1000) {
            this.reportCustomMetric('slow_resource', {
              name: entry.name,
              duration: entry.duration,
              transferSize: entry.transferSize,
              initiatorType: entry.initiatorType
            })
          }
        })
      })
      
      observer.observe({ entryTypes: ['resource'] })
      this.observers.push(observer)
    } catch (e) {
      this.log('Resource timing observer failed:', e)
    }
  }

  observeMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory
        this.reportCustomMetric('memory_usage', {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        })
      }, 30000) // Every 30 seconds
    }
  }

  observeConnectionType() {
    if ('connection' in navigator) {
      const connection = navigator.connection
      this.reportCustomMetric('connection_info', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      })

      // Monitor connection changes
      connection.addEventListener('change', () => {
        this.reportCustomMetric('connection_change', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        })
      })
    }
  }

  setupVisibilityChangeHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushAllMetrics()
      }
    })

    window.addEventListener('beforeunload', () => {
      this.flushAllMetrics()
    })
  }

  reportMetric(name, value, additionalData = {}) {
    const metric = {
      name,
      value,
      rating: this.getRating(name, value),
      timestamp: Date.now(),
      url: window.location.href,
      ...additionalData
    }

    this.metrics.set(name, metric)
    
    // Send to monitoring service
    monitoring.capturePerformance({
      type: 'web_vital',
      metric: name,
      value,
      rating: metric.rating,
      additionalData,
      timestamp: metric.timestamp
    })

    this.log(`${name}: ${value}ms (${metric.rating})`, additionalData)
  }

  reportCustomMetric(name, data) {
    monitoring.capturePerformance({
      type: 'custom_metric',
      metric: name,
      data,
      timestamp: Date.now()
    })

    this.log(`Custom metric ${name}:`, data)
  }

  getRating(metric, value) {
    const thresholds = this.config.thresholds[metric]
    if (!thresholds) return 'unknown'
    
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.poor) return 'needs-improvement'
    return 'poor'
  }

  flushAllMetrics() {
    // Send any pending metrics
    this.metrics.forEach((metric) => {
      monitoring.capturePerformance({
        type: 'web_vital_final',
        ...metric
      })
    })
  }

  getMetrics() {
    return Array.from(this.metrics.values())
  }

  getMetric(name) {
    return this.metrics.get(name)
  }

  log(message, data = {}) {
    if (this.config.enableLogging) {
      console.log(`🔍 WebVitals: ${message}`, data)
    }
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics.clear()
  }
}

// React hooks for Web Vitals
export const useWebVitals = () => {
  const [metrics, setMetrics] = React.useState([])
  
  React.useEffect(() => {
    const monitor = new WebVitalsMonitor()
    
    // Update metrics when they change
    const updateMetrics = () => {
      setMetrics(monitor.getMetrics())
    }
    
    const interval = setInterval(updateMetrics, 5000)
    
    return () => {
      clearInterval(interval)
      monitor.destroy()
    }
  }, [])
  
  return metrics
}

export const usePerformanceMetric = (metricName) => {
  const [metric, setMetric] = React.useState(null)
  
  React.useEffect(() => {
    const monitor = new WebVitalsMonitor()
    
    const checkMetric = () => {
      const metricData = monitor.getMetric(metricName)
      if (metricData) {
        setMetric(metricData)
      }
    }
    
    const interval = setInterval(checkMetric, 1000)
    
    return () => {
      clearInterval(interval)
      monitor.destroy()
    }
  }, [metricName])
  
  return metric
}

// Component performance measurement
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  return function PerformanceTrackedComponent(props) {
    React.useEffect(() => {
      const startTime = performance.now()
      
      return () => {
        const duration = performance.now() - startTime
        monitoring.capturePerformance({
          type: 'component_lifecycle',
          component: componentName,
          duration,
          timestamp: Date.now()
        })
      }
    }, [])
    
    return React.createElement(WrappedComponent, props)
  }
}

// Performance budget monitoring
export const performanceBudget = {
  LCP: 2500,
  FID: 100,
  CLS: 0.1,
  FCP: 1800,
  TTFB: 800
}

export const checkPerformanceBudget = (metrics) => {
  const violations = []
  
  Object.entries(performanceBudget).forEach(([metric, budget]) => {
    const metricData = metrics.find(m => m.name === metric)
    if (metricData && metricData.value > budget) {
      violations.push({
        metric,
        budget,
        actual: metricData.value,
        excess: metricData.value - budget
      })
    }
  })
  
  return violations
}

// Initialize global Web Vitals monitor
const globalWebVitalsMonitor = new WebVitalsMonitor()

export { globalWebVitalsMonitor as webVitalsMonitor }
export default WebVitalsMonitor

