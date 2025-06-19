import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Building, 
  Users,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Filter,
  RefreshCw
} from 'lucide-react'
import { ApiClient } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function PersonalizedDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const apiClient = new ApiClient()

  useEffect(() => {
    loadPersonalizedData()
  }, [])

  const loadPersonalizedData = async () => {
    setLoading(true)
    try {
      const response = await apiClient.request('/opportunities/personalized')
      if (response.success) {
        setData(response)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to load personalized data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value?.toLocaleString() || '0'}`
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getScoreBadgeVariant = (score) => {
    if (score >= 90) return 'default'
    if (score >= 80) return 'secondary'
    if (score >= 70) return 'outline'
    return 'secondary'
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your personalized opportunities...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data || !data.success) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>Unable to Load Personalized Data</span>
            </CardTitle>
            <CardDescription>
              Please check your settings and ensure your SAM.gov API key is configured.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadPersonalizedData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { opportunities, insights, preferences_applied } = data

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <span>Your Personalized Opportunities</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Tailored to your preferences • {insights.total_matches} matches found
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={loadPersonalizedData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Applied Filters Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-primary">
            <Filter className="w-5 h-5" />
            <span>Active Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Keywords</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {preferences_applied.keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Value Range</Label>
              <p className="text-sm text-muted-foreground">{preferences_applied.value_range}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Min Score</Label>
              <p className="text-sm text-muted-foreground">{preferences_applied.min_score_threshold}%</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Agencies</Label>
              <p className="text-sm text-muted-foreground">
                {preferences_applied.preferred_agencies.length} selected
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.total_matches}</div>
            <p className="text-xs text-muted-foreground">
              Above {preferences_applied.min_score_threshold}% threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", getScoreColor(insights.avg_score))}>
              {insights.avg_score}%
            </div>
            <p className="text-xs text-muted-foreground">
              {insights.avg_score >= 85 ? 'Excellent' : insights.avg_score >= 75 ? 'Good' : 'Fair'} alignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Value Distribution</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.value_distribution['1M_to_5M'] + insights.value_distribution['5M_to_10M']}
            </div>
            <p className="text-xs text-muted-foreground">
              $1M+ opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Agency</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.top_agencies[0]?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {insights.top_agencies[0]?.name?.split(' ')[0] || 'No matches'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>AI Recommendations</span>
            </CardTitle>
            <CardDescription>
              Suggestions to improve your opportunity matching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-muted rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Top Matching Opportunities</span>
            <Badge variant="secondary">{opportunities.length} results</Badge>
          </CardTitle>
          <CardDescription>
            Ranked by relevance to your preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {opportunities.slice(0, 10).map((opp, index) => (
              <div key={opp.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge 
                        variant={getScoreBadgeVariant(opp.total_score)}
                        className="font-mono"
                      >
                        {opp.total_score}%
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        #{index + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{opp.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {opp.agency_name} • {opp.source_name}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {opp.description}
                    </p>
                  </div>
                  
                  <div className="text-right ml-4">
                    {opp.estimated_value && (
                      <div className="text-lg font-semibold text-primary">
                        {formatValue(opp.estimated_value)}
                      </div>
                    )}
                    {opp.due_date && (
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Due {new Date(opp.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Match Reasons */}
                {opp.match_reasons && opp.match_reasons.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Why this matches:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {opp.match_reasons.map((reason, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Factors */}
                {opp.risk_factors && opp.risk_factors.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium">Consider:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {opp.risk_factors.map((risk, idx) => (
                        <Badge key={idx} variant="destructive" className="text-xs">
                          {risk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    {opp.opportunity_number} • Posted {new Date(opp.posted_date).toLocaleDateString()}
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {opportunities.length > 10 && (
            <div className="text-center mt-6">
              <Button variant="outline">
                View All {opportunities.length} Opportunities
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}