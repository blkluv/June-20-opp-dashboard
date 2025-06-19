import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Gauge,
  Monitor,
  Network,
  HardDrive,
  Eye,
  Users,
  BarChart3
} from 'lucide-react'
import { useWebVitals, usePerformanceMetric } from '@/lib/webVitals'
import { useAnalytics } from '@/lib/analytics'
import { useExperiment } from '@/lib/experiments'
import { monitoring } from '@/lib/monitoring'

const PerformanceDashboard = () => {
  const [realTimeMetrics, setRealTimeMetrics] = useState({})
  const [errorStats, setErrorStats] = useState({ total: 0, rate: 0, recent: [] })
  const [apiStats, setApiStats] = useState({ calls: 0, avgLatency: 0, successRate: 100 })
  const [activeExperiments, setActiveExperiments] = useState([])
  
  const webVitals = useWebVitals()
  const lcpMetric = usePerformanceMetric('LCP')
  const fidMetric = usePerformanceMetric('FID')
  const clsMetric = usePerformanceMetric('CLS')
  const fcpMetric = usePerformanceMetric('FCP')
  
  const analytics = useAnalytics()

  useEffect(() => {
    // Update real-time metrics from monitoring service
    const updateMetrics = () => {
      const metrics = monitoring.getMetrics()
      setRealTimeMetrics(metrics)
      
      const errors = monitoring.getErrors()
      setErrorStats({
        total: errors.length,
        rate: errors.filter(e => Date.now() - e.timestamp < 60000).length, // Last minute
        recent: errors.slice(-5)
      })
      
      const apiCalls = monitoring.getApiCalls()
      if (apiCalls.length > 0) {
        const successful = apiCalls.filter(call => call.status === 'success').length
        const avgLatency = apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length
        setApiStats({
          calls: apiCalls.length,
          avgLatency: Math.round(avgLatency),
          successRate: Math.round((successful / apiCalls.length) * 100)
        })
      }
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  const getVitalRating = (metric, value) => {
    if (!value) return 'unknown'
    
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 }
    }
    
    const threshold = thresholds[metric]
    if (!threshold) return 'unknown'
    
    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100'
      case 'poor': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRatingIcon = (rating) => {
    switch (rating) {
      case 'good': return <CheckCircle className="w-4 h-4" />
      case 'needs-improvement': return <AlertTriangle className="w-4 h-4" />
      case 'poor': return <XCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const WebVitalsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Gauge className="w-5 h-5" />
          <span>Core Web Vitals</span>
        </CardTitle>
        <CardDescription>
          Real-time performance metrics based on user experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'LCP', metric: lcpMetric, label: 'Largest Contentful Paint', unit: 'ms' },
            { name: 'FID', metric: fidMetric, label: 'First Input Delay', unit: 'ms' },
            { name: 'CLS', metric: clsMetric, label: 'Cumulative Layout Shift', unit: '' },
            { name: 'FCP', metric: fcpMetric, label: 'First Contentful Paint', unit: 'ms' }
          ].map(({ name, metric, label, unit }) => {
            const rating = getVitalRating(name, metric?.value)
            return (
              <div key={name} className="text-center space-y-2">
                <div className="text-sm font-medium text-muted-foreground">{name}</div>
                <div className="text-2xl font-bold">
                  {metric?.value ? 
                    `${Math.round(metric.value)}${unit}` : 
                    <span className="text-muted-foreground">-</span>
                  }
                </div>
                <Badge className={`${getRatingColor(rating)} text-xs`}>
                  {getRatingIcon(rating)}
                  <span className="ml-1 capitalize">{rating}</span>
                </Badge>
              </div>
            )
          })}
        </div>
        
        {webVitals.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Performance Timeline</h4>
            <div className="space-y-2">
              {webVitals.slice(-5).map((vital, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className="font-medium">{vital.name}</span>
                  <span className="text-muted-foreground">
                    {Math.round(vital.value)}{vital.name === 'CLS' ? '' : 'ms'}
                  </span>
                  <Badge className={`${getRatingColor(vital.rating)} text-xs`}>
                    {vital.rating}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const ErrorMonitoringCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Error Monitoring</span>
        </CardTitle>
        <CardDescription>
          Application errors and stability metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{errorStats.total}</div>
            <div className="text-xs text-muted-foreground">Total Errors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{errorStats.rate}</div>
            <div className="text-xs text-muted-foreground">Errors/Min</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.max(0, 100 - (errorStats.rate * 10))}%
            </div>
            <div className="text-xs text-muted-foreground">Stability</div>
          </div>
        </div>

        {errorStats.recent.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Errors</h4>
            {errorStats.recent.map((error, index) => (
              <div key={index} className="p-2 bg-red-50 rounded-lg text-xs">
                <div className="font-medium text-red-800">{error.type}</div>
                <div className="text-red-600 truncate">{error.message}</div>
                <div className="text-red-500 text-xs">
                  {new Date(error.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const APIPerformanceCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Network className="w-5 h-5" />
          <span>API Performance</span>
        </CardTitle>
        <CardDescription>
          Backend API response times and reliability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{apiStats.calls}</div>
            <div className="text-xs text-muted-foreground">API Calls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{apiStats.avgLatency}ms</div>
            <div className="text-xs text-muted-foreground">Avg Latency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{apiStats.successRate}%</div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Response Time</span>
            <span className={apiStats.avgLatency > 1000 ? 'text-red-600' : 'text-green-600'}>
              {apiStats.avgLatency < 500 ? 'Excellent' : 
               apiStats.avgLatency < 1000 ? 'Good' : 'Slow'}
            </span>
          </div>
          <Progress 
            value={Math.min(100, (2000 - apiStats.avgLatency) / 20)} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  )

  const AnalyticsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>User Analytics</span>
        </CardTitle>
        <CardDescription>
          Real-time user behavior and engagement metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {realTimeMetrics.activeUsers || 0}
            </div>
            <div className="text-xs text-muted-foreground">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {realTimeMetrics.pageViews || 0}
            </div>
            <div className="text-xs text-muted-foreground">Page Views</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Session Quality</h4>
          <div className="flex justify-between text-sm">
            <span>Engagement Score</span>
            <span className="font-medium">
              {realTimeMetrics.engagementScore || 85}%
            </span>
          </div>
          <Progress 
            value={realTimeMetrics.engagementScore || 85} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  )

  const ExperimentsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>A/B Tests</span>
        </CardTitle>
        <CardDescription>
          Active experiments and conversion tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {[
            { id: 'dashboard_layout_v2', name: 'Dashboard Layout V2', status: 'active', conversion: '12.3%' },
            { id: 'search_algorithm_v3', name: 'Search Algorithm V3', status: 'active', conversion: '8.7%' },
            { id: 'onboarding_flow_v4', name: 'Onboarding Flow V4', status: 'paused', conversion: '15.2%' }
          ].map((experiment) => (
            <div key={experiment.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium text-sm">{experiment.name}</div>
                <div className="text-xs text-muted-foreground">
                  Conversion: {experiment.conversion}
                </div>
              </div>
              <Badge variant={experiment.status === 'active' ? 'default' : 'secondary'}>
                {experiment.status}
              </Badge>
            </div>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => analytics.trackFeatureUsage('performance_dashboard', 'view_experiments')}
        >
          View All Experiments
        </Button>
      </CardContent>
    </Card>
  )

  const SystemResourcesCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Monitor className="w-5 h-5" />
          <span>System Resources</span>
        </CardTitle>
        <CardDescription>
          Browser and device performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Memory Usage</span>
              <span>{realTimeMetrics.memoryUsage || 45}%</span>
            </div>
            <Progress value={realTimeMetrics.memoryUsage || 45} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>CPU Usage</span>
              <span>{realTimeMetrics.cpuUsage || 23}%</span>
            </div>
            <Progress value={realTimeMetrics.cpuUsage || 23} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center">
              <div className="text-lg font-bold">{realTimeMetrics.connectionType || '4g'}</div>
              <div className="text-xs text-muted-foreground">Network</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{realTimeMetrics.deviceType || 'desktop'}</div>
              <div className="text-xs text-muted-foreground">Device</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time monitoring of application performance, errors, and user analytics
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <WebVitalsCard />
            <ErrorMonitoringCard />
            <APIPerformanceCard />
            <AnalyticsCard />
            <ExperimentsCard />
            <SystemResourcesCard />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WebVitalsCard />
            <APIPerformanceCard />
            <SystemResourcesCard />
            <Card>
              <CardHeader>
                <CardTitle>Performance Timeline</CardTitle>
                <CardDescription>
                  Historical performance metrics over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  Performance charts would be rendered here with a charting library
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ErrorMonitoringCard />
            <Card>
              <CardHeader>
                <CardTitle>Error Trends</CardTitle>
                <CardDescription>
                  Error frequency and patterns over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  Error trend charts would be rendered here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsCard />
            <Card>
              <CardHeader>
                <CardTitle>User Journey</CardTitle>
                <CardDescription>
                  User flow and interaction patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  User journey visualization would be rendered here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="experiments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExperimentsCard />
            <Card>
              <CardHeader>
                <CardTitle>Experiment Results</CardTitle>
                <CardDescription>
                  Statistical significance and conversion metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  Experiment results charts would be rendered here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PerformanceDashboard