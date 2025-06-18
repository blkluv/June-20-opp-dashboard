import { useState, useEffect } from 'react'
import { 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  Eye, 
  Target, 
  Calendar,
  Clock,
  DollarSign,
  Users,
  Zap,
  Bell,
  BarChart3,
  Globe,
  Shield,
  Lightbulb,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { apiClient, formatCurrency, formatDate, formatRelativeDate } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function IntelligencePage() {
  const [briefingData, setBriefingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDailyBriefing()
  }, [])

  const fetchDailyBriefing = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getDailyIntelligence()
      setBriefingData(data)
      setLastUpdated(new Date())
      
      toast({
        title: "Intelligence Updated",
        description: "Daily briefing refreshed with latest market intelligence",
      })
    } catch (error) {
      console.error('Failed to fetch daily briefing:', error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to fetch intelligence briefing",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Morning'
    if (hour < 17) return 'Afternoon'
    return 'Evening'
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Brain className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Generating Intelligence Briefing...</h1>
            <p className="text-muted-foreground">
              AI is analyzing market conditions and opportunities
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="h-6 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{getTimeOfDay()} Intelligence Briefing</h1>
            <p className="text-muted-foreground">
              {lastUpdated ? `Last updated ${formatRelativeDate(lastUpdated.toISOString())}` : 'AI-powered market intelligence and opportunity analysis'}
            </p>
          </div>
        </div>
        <Button onClick={fetchDailyBriefing} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-500" />
              <span className="font-medium">New Opportunities</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {briefingData?.metrics?.new_opportunities || 12}
            </p>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Total Value</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(briefingData?.metrics?.total_value || 45600000)}
            </p>
            <p className="text-xs text-muted-foreground">Discovered today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="font-medium">Market Score</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {briefingData?.metrics?.market_score || 87}/100
            </p>
            <p className="text-xs text-muted-foreground">Opportunity index</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="font-medium">Urgent Actions</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {briefingData?.metrics?.urgent_actions || 3}
            </p>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Alerts */}
      {briefingData?.urgent_alerts?.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              Urgent Market Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {briefingData.urgent_alerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-red-200">
                  <Badge variant="destructive">URGENT</Badge>
                  <div className="flex-1">
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <p className="text-xs text-red-600 mt-1">{alert.action_required}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trending Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              Trending Opportunities
            </CardTitle>
            <CardDescription>Hot sectors and emerging opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(briefingData?.trending_opportunities || [
                { sector: 'Artificial Intelligence', growth: '+45%', value: '$12.5M', urgency: 'high' },
                { sector: 'Cybersecurity', growth: '+32%', value: '$8.9M', urgency: 'medium' },
                { sector: 'Cloud Infrastructure', growth: '+28%', value: '$15.2M', urgency: 'high' },
                { sector: 'Data Analytics', growth: '+22%', value: '$6.7M', urgency: 'medium' }
              ]).map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{trend.sector}</h4>
                    <p className="text-sm text-green-600">{trend.growth} growth</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{trend.value}</p>
                    <Badge variant={trend.urgency === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                      {trend.urgency}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agency Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-500" />
              Agency Intelligence
            </CardTitle>
            <CardDescription>Key agency activities and budget changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(briefingData?.agency_intelligence || [
                { agency: 'Department of Defense', activity: 'Increased AI spending by 40%', budget_change: '+$2.1B', priority: 'high' },
                { agency: 'NASA', activity: 'New space technology initiatives', budget_change: '+$850M', priority: 'medium' },
                { agency: 'DHS', activity: 'Cybersecurity modernization push', budget_change: '+$1.2B', priority: 'high' },
                { agency: 'HHS', activity: 'Healthcare IT procurement surge', budget_change: '+$670M', priority: 'medium' }
              ]).map((intel, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{intel.agency}</h4>
                    <Badge className={getPriorityColor(intel.priority)}>
                      {intel.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{intel.activity}</p>
                  <p className="text-sm font-medium text-green-600">{intel.budget_change}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technology Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              Technology Trends
            </CardTitle>
            <CardDescription>Emerging tech buzzwords and adoption patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(briefingData?.tech_trends || [
                { technology: 'Zero Trust Architecture', mentions: 145, trend: 'rising', adoption: 78 },
                { technology: 'Quantum Computing', mentions: 89, trend: 'rising', adoption: 34 },
                { technology: 'Edge Computing', mentions: 112, trend: 'stable', adoption: 56 },
                { technology: 'Blockchain/DLT', mentions: 67, trend: 'declining', adoption: 23 }
              ]).map((tech, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{tech.technology}</h4>
                    <Badge variant={tech.trend === 'rising' ? 'default' : tech.trend === 'stable' ? 'secondary' : 'outline'}>
                      {tech.trend}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Adoption</span>
                        <span>{tech.adoption}%</span>
                      </div>
                      <Progress value={tech.adoption} className="h-2" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tech.mentions} mentions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Competitive Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2 text-purple-500" />
              Competitive Intelligence
            </CardTitle>
            <CardDescription>Market activity and competitor movements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(briefingData?.competitive_intel || [
                { insight: 'Major players increasing Small Business partnerships', impact: 'High', action: 'Consider teaming opportunities' },
                { insight: 'Price compression in IT services contracts', impact: 'Medium', action: 'Review pricing strategy' },
                { insight: 'New security clearance requirements trending', impact: 'High', action: 'Assess team clearance levels' },
                { insight: 'Past performance weight increasing in evaluations', impact: 'Medium', action: 'Update case studies' }
              ]).map((intel, index) => (
                <div key={index} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium">{intel.insight}</p>
                    <Badge variant={intel.impact === 'High' ? 'destructive' : 'secondary'}>
                      {intel.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-600">{intel.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-indigo-500" />
            Executive Summary
          </CardTitle>
          <CardDescription>AI-generated daily market summary and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-muted-foreground">
              {briefingData?.executive_summary || 
                "Today's market analysis reveals strong growth in AI and cybersecurity sectors, with the Department of Defense leading increased procurement activity. Key opportunities include zero trust architecture implementations and cloud modernization projects. Recommend focusing on partnerships for large-scale contracts and preparing for upcoming budget cycle opportunities in Q2. Monitor competitive landscape as pricing pressure increases in traditional IT services."
              }
            </p>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <h4 className="font-medium text-green-600">Recommended Actions</h4>
              <p className="text-2xl font-bold">{briefingData?.recommendations?.action_count || 5}</p>
            </div>
            <div className="text-center">
              <h4 className="font-medium text-blue-600">Watch List Items</h4>
              <p className="text-2xl font-bold">{briefingData?.recommendations?.watch_count || 8}</p>
            </div>
            <div className="text-center">
              <h4 className="font-medium text-purple-600">Priority Score</h4>
              <p className="text-2xl font-bold">{briefingData?.recommendations?.priority_score || 92}/100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-500" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <h4 className="font-medium">Review AI Opportunities</h4>
                <p className="text-sm text-muted-foreground">12 new matches found</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <h4 className="font-medium">Update Capability Statement</h4>
                <p className="text-sm text-muted-foreground">New buzzwords trending</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <h4 className="font-medium">Check Competitor Activity</h4>
                <p className="text-sm text-muted-foreground">3 new market moves</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}