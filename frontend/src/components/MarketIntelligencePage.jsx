import { useState, useEffect, useRef } from 'react'
import { 
  Activity, 
  AlertCircle, 
  TrendingUp, 
  Globe,
  Clock,
  DollarSign,
  Building2,
  Zap,
  Bell,
  RefreshCw,
  Eye,
  Wifi,
  WifiOff,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Calendar,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/api'

export default function MarketIntelligencePage() {
  const [marketData, setMarketData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isLive, setIsLive] = useState(true)
  const [notifications, setNotifications] = useState([])
  const intervalRef = useRef(null)

  const fetchMarketData = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getMarketIntelligence()
      setMarketData(data)
      setLastUpdated(new Date())
      setError(null)
      
      // Add new notifications if any
      if (data.alerts && data.alerts.length > 0) {
        const newNotifications = data.alerts.slice(0, 3).map((alert, index) => ({
          id: Date.now() + index,
          title: alert.title,
          message: alert.description,
          type: alert.severity || 'info',
          timestamp: new Date()
        }))
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 10))
      }
    } catch (err) {
      console.error('Failed to fetch market intelligence:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const startLiveUpdates = () => {
    setIsLive(true)
    intervalRef.current = setInterval(fetchMarketData, 60000) // Update every minute
  }

  const stopLiveUpdates = () => {
    setIsLive(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    fetchMarketData()
    startLiveUpdates()
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Morning'
    if (hour < 17) return 'Afternoon' 
    return 'Evening'
  }

  const getTrendIcon = (trend) => {
    if (trend === 'rising' || trend === 'up') return <ChevronUp className="w-4 h-4 text-green-500" />
    if (trend === 'declining' || trend === 'down') return <ChevronDown className="w-4 h-4 text-red-500" />
    return <TrendingUp className="w-4 h-4 text-blue-500" />
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-950'
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-950'
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-950'
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return timestamp.toLocaleDateString()
  }

  if (loading && !marketData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Real-Time Market Intelligence</h1>
            <p className="text-muted-foreground">Live market monitoring and intelligence alerts</p>
          </div>
          <div className="animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error && !marketData) {
    return (
      <div className="p-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>Failed to load market intelligence: {error}</span>
            </div>
            <Button onClick={fetchMarketData} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Globe className="w-8 h-8 mr-3 text-blue-600" />
            {getTimeBasedGreeting()} Market Intelligence
          </h1>
          <p className="text-muted-foreground flex items-center mt-1">
            {isLive ? (
              <>
                <Wifi className="w-4 h-4 mr-1 text-green-500" />
                Live monitoring active
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 mr-1 text-red-500" />
                Live monitoring paused
              </>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={isLive ? stopLiveUpdates : startLiveUpdates} 
            variant={isLive ? "destructive" : "default"} 
            size="sm"
          >
            {isLive ? <WifiOff className="w-4 h-4 mr-2" /> : <Wifi className="w-4 h-4 mr-2" />}
            {isLive ? 'Stop Live' : 'Start Live'}
          </Button>
          <Button onClick={fetchMarketData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Market Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Opportunities</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {marketData?.metrics?.active_opportunities || 1247}
                </p>
              </div>
              <div className="flex items-center">
                {getTrendIcon('up')}
                <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400 ml-2" />
              </div>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              +{marketData?.metrics?.new_today || 23} new today
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Market Value</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(marketData?.metrics?.total_value || 2847000000)}
                </p>
              </div>
              <div className="flex items-center">
                {getTrendIcon('up')}
                <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 ml-2" />
              </div>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              +{marketData?.metrics?.value_increase || 12}% this week
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Market Activity</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {marketData?.metrics?.activity_score || 94}%
                </p>
              </div>
              <div className="flex items-center">
                {getTrendIcon('up')}
                <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400 ml-2" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={marketData?.metrics?.activity_score || 94} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {marketData?.metrics?.critical_alerts || 5}
                </p>
              </div>
              <div className="flex items-center">
                {marketData?.metrics?.critical_alerts > 3 ? getTrendIcon('up') : getTrendIcon('down')}
                <Bell className="w-8 h-8 text-orange-600 dark:text-orange-400 ml-2" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Alerts */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-700 dark:text-orange-300">
            <AlertCircle className="w-5 h-5 mr-2" />
            Live Market Alerts
            {isLive && <div className="w-2 h-2 bg-red-500 rounded-full ml-2 animate-pulse"></div>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(marketData?.alerts || [
              {
                title: 'High-Value DOD Contract Posted',
                description: '$45M AI/ML development contract just released with 30-day deadline',
                severity: 'critical',
                agency: 'Department of Defense',
                value: 45000000,
                timestamp: new Date(Date.now() - 5 * 60000)
              },
              {
                title: 'NASA Budget Increase Confirmed',
                description: 'Space technology budget increased by $850M for next fiscal year',
                severity: 'high',
                agency: 'NASA',
                value: 850000000,
                timestamp: new Date(Date.now() - 15 * 60000)
              },
              {
                title: 'Cybersecurity Mandate Update',
                description: 'New federal cybersecurity requirements affecting all IT contracts',
                severity: 'medium',
                agency: 'DHS',
                timestamp: new Date(Date.now() - 25 * 60000)
              }
            ]).map((alert, index) => (
              <div key={index} className={`p-4 border-l-4 rounded-lg ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 
                                   alert.severity === 'high' ? 'default' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Building2 className="w-3 h-3 mr-1" />
                        {alert.agency}
                      </span>
                      {alert.value && (
                        <span className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {formatCurrency(alert.value)}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeAgo(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Market Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              Live Sector Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(marketData?.sector_performance || [
                { sector: 'Artificial Intelligence', change: '+15.4%', volume: 127, trend: 'rising' },
                { sector: 'Cybersecurity', change: '+8.7%', volume: 89, trend: 'rising' },
                { sector: 'Cloud Computing', change: '+5.2%', volume: 156, trend: 'stable' },
                { sector: 'IoT & Edge', change: '+3.1%', volume: 67, trend: 'rising' },
                { sector: 'Data Analytics', change: '-1.2%', volume: 45, trend: 'declining' }
              ]).map((sector, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    {getTrendIcon(sector.trend)}
                    <div>
                      <div className="font-medium">{sector.sector}</div>
                      <div className="text-sm text-muted-foreground">{sector.volume} opportunities</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      sector.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {sector.change}
                    </div>
                    <div className="text-xs text-muted-foreground">24h change</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-blue-500" />
              Agency Activity Monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(marketData?.agency_activity || [
                { agency: 'Department of Defense', activity: 'Very High', score: 95, new_contracts: 12 },
                { agency: 'NASA', activity: 'High', score: 87, new_contracts: 8 },
                { agency: 'DHS', activity: 'High', score: 82, new_contracts: 6 },
                { agency: 'HHS', activity: 'Medium', score: 68, new_contracts: 4 },
                { agency: 'DOE', activity: 'Medium', score: 59, new_contracts: 3 }
              ]).map((agency, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{agency.agency}</span>
                      <Badge variant={agency.score >= 80 ? 'default' : 'secondary'} className="text-xs">
                        {agency.activity}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {agency.new_contracts} new contracts
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={agency.score} className="flex-1 h-2" />
                    <span className="text-sm font-medium w-12">{agency.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Notifications Feed */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2 text-purple-500" />
              Recent Notifications
              <Badge variant="outline" className="ml-2">{notifications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    notification.type === 'critical' ? 'bg-red-500' :
                    notification.type === 'warning' ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-sm text-muted-foreground">{notification.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(notification.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
            <Zap className="w-5 h-5 mr-2" />
            Market Intelligence Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-auto p-4 flex-col items-start" variant="outline">
              <Target className="w-5 h-5 mb-2 self-center" />
              <div className="text-left">
                <div className="font-semibold">Set Market Alerts</div>
                <div className="text-sm text-muted-foreground">Configure custom monitoring</div>
              </div>
            </Button>
            <Button className="h-auto p-4 flex-col items-start" variant="outline">
              <Calendar className="w-5 h-5 mb-2 self-center" />
              <div className="text-left">
                <div className="font-semibold">Schedule Reports</div>
                <div className="text-sm text-muted-foreground">Automated intelligence delivery</div>
              </div>
            </Button>
            <Button className="h-auto p-4 flex-col items-start" variant="outline">
              <Users className="w-5 h-5 mb-2 self-center" />
              <div className="text-left">
                <div className="font-semibold">Share Intelligence</div>
                <div className="text-sm text-muted-foreground">Team collaboration tools</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}