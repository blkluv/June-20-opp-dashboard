import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Target,
  AlertTriangle,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Clock,
  Users,
  Building2,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/api'

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getPredictiveAnalytics()
      setAnalyticsData(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Morning'
    if (hour < 17) return 'Afternoon' 
    return 'Evening'
  }

  const getTrendIcon = (trend) => {
    if (trend === 'rising' || trend === 'up') return <ArrowUpRight className="w-4 h-4 text-green-500" />
    if (trend === 'declining' || trend === 'down') return <ArrowDownRight className="w-4 h-4 text-red-500" />
    return <TrendingUp className="w-4 h-4 text-blue-500" />
  }

  const getProbabilityColor = (probability) => {
    if (probability >= 80) return 'text-green-600 dark:text-green-400'
    if (probability >= 60) return 'text-blue-600 dark:text-blue-400'
    if (probability >= 40) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Predictive Analytics Lab</h1>
            <p className="text-muted-foreground">AI-powered market predictions and trend analysis</p>
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

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span>Failed to load analytics: {error}</span>
            </div>
            <Button onClick={fetchAnalytics} className="mt-4">
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
            <Brain className="w-8 h-8 mr-3 text-purple-600" />
            {getTimeBasedGreeting()} Predictive Analytics Lab
          </h1>
          <p className="text-muted-foreground">AI-powered forecasting and market intelligence</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Predictions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Win Probability</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analyticsData?.predictions?.win_probability || 78}%
                </p>
              </div>
              <Target className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="mt-4">
              <Progress value={analyticsData?.predictions?.win_probability || 78} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Market Growth</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  +{analyticsData?.predictions?.market_growth || 34}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Next 6 months</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Predicted Value</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(analyticsData?.predictions?.predicted_value || 28500000)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Potential pipeline</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Time to Award</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {analyticsData?.predictions?.time_to_award || 45} days
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Average prediction</p>
          </CardContent>
        </Card>
      </div>

      {/* Opportunity Forecasts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
            AI-Powered Opportunity Forecasts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(analyticsData?.forecasts || [
              {
                title: 'DoD AI/ML Framework Contract',
                probability: 85,
                predicted_value: 15000000,
                timeline: '3-4 months',
                confidence: 'high',
                trend: 'rising'
              },
              {
                title: 'NASA Space Technology Initiative',
                probability: 72,
                predicted_value: 8500000,
                timeline: '6-8 months',
                confidence: 'medium',
                trend: 'stable'
              },
              {
                title: 'DHS Cybersecurity Modernization',
                probability: 68,
                predicted_value: 12000000,
                timeline: '4-6 months',
                confidence: 'medium',
                trend: 'rising'
              }
            ]).map((forecast, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold">{forecast.title}</h4>
                    {getTrendIcon(forecast.trend)}
                    <Badge variant={forecast.confidence === 'high' ? 'default' : 'secondary'}>
                      {forecast.confidence} confidence
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Target className="w-3 h-3 mr-1" />
                      {forecast.probability}% probability
                    </span>
                    <span className="flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {formatCurrency(forecast.predicted_value)}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {forecast.timeline}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getProbabilityColor(forecast.probability)}`}>
                    {forecast.probability}%
                  </div>
                  <Progress value={forecast.probability} className="w-20 h-2 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
              Sector Growth Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analyticsData?.sector_trends || [
                { sector: 'Artificial Intelligence', growth: 45, confidence: 92 },
                { sector: 'Cybersecurity', growth: 32, confidence: 88 },
                { sector: 'Cloud Computing', growth: 28, confidence: 85 },
                { sector: 'IoT & Edge Computing', growth: 22, confidence: 78 }
              ]).map((sector, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{sector.sector}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        +{sector.growth}%
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {sector.confidence}% confident
                      </Badge>
                    </div>
                  </div>
                  <Progress value={sector.growth} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-purple-500" />
              Agency Spending Forecasts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analyticsData?.agency_forecasts || [
                { agency: 'Department of Defense', predicted_increase: 2100000000, confidence: 89 },
                { agency: 'DHS', predicted_increase: 1200000000, confidence: 85 },
                { agency: 'NASA', predicted_increase: 850000000, confidence: 82 },
                { agency: 'HHS', predicted_increase: 670000000, confidence: 78 }
              ]).map((agency, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{agency.agency}</div>
                    <div className="text-sm text-muted-foreground">
                      Predicted increase: {formatCurrency(agency.predicted_increase)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{agency.confidence}%</div>
                    <div className="text-xs text-muted-foreground">confidence</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-700 dark:text-purple-300">
            <Zap className="w-5 h-5 mr-2" />
            AI Predictive Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(analyticsData?.ai_insights || [
              "AI and machine learning contracts are predicted to increase by 47% over the next 6 months, with DoD leading the growth.",
              "Cybersecurity spending will likely surge following recent federal mandates, creating $3.2B in new opportunities.",
              "Small business set-asides in technology sectors are forecasted to grow 23% faster than traditional contracts.",
              "Cloud-first initiatives across agencies suggest a 156% increase in cloud migration contracts by Q2 2025."
            ]).map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-green-500" />
            Recommended Strategic Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(analyticsData?.recommendations || [
              { action: 'Focus on AI/ML capability development', priority: 'high', impact: 'high' },
              { action: 'Establish cybersecurity partnerships', priority: 'high', impact: 'medium' },
              { action: 'Prepare for Q2 budget cycle opportunities', priority: 'medium', impact: 'high' },
              { action: 'Develop cloud migration expertise', priority: 'medium', impact: 'medium' }
            ]).map((rec, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="font-medium">{rec.action}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                      {rec.priority} priority
                    </Badge>
                    <Badge variant={rec.impact === 'high' ? 'default' : 'outline'} className="text-xs">
                      {rec.impact} impact
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}