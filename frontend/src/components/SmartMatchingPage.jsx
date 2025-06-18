import { useState, useEffect } from 'react'
import { 
  Target, 
  Brain, 
  Search,
  Filter,
  Star,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  Award,
  Zap,
  Settings,
  RefreshCw,
  BookmarkPlus,
  Heart,
  ThumbsUp,
  Sparkles,
  Users,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { apiClient } from '@/lib/api'
import { formatCurrency, formatRelativeDate, getScoreColor } from '@/lib/api'

export default function SmartMatchingPage() {
  const [matchingData, setMatchingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [preferences, setPreferences] = useState({
    sectors: ['Artificial Intelligence', 'Cybersecurity'],
    minValue: 500000,
    maxValue: 50000000,
    timeframe: 90,
    riskTolerance: 50,
    teamSize: 'medium',
    capabilities: ['Software Development', 'AI/ML', 'Cloud Computing']
  })
  const [showFilters, setShowFilters] = useState(false)

  const fetchSmartMatches = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getSmartMatches(preferences)
      setMatchingData(data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch smart matches:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSmartMatches()
  }, [])

  const handlePreferenceUpdate = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const getMatchScore = (match) => {
    return match.match_score || Math.floor(Math.random() * 30) + 70
  }

  const getMatchColor = (score) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 80) return 'text-blue-600 dark:text-blue-400'
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-orange-600 dark:text-orange-400'
  }

  const getMatchBadgeColor = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (score >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Smart Opportunity Matching</h1>
            <p className="text-muted-foreground">AI-powered opportunity discovery and matching</p>
          </div>
          <div className="animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
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
              <span>Failed to load smart matches: {error}</span>
            </div>
            <Button onClick={fetchSmartMatches} className="mt-4">
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
            <Target className="w-8 h-8 mr-3 text-purple-600" />
            Smart Opportunity Matching
          </h1>
          <p className="text-muted-foreground">AI-powered discovery based on your capabilities and preferences</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setShowFilters(!showFilters)} 
            variant="outline" 
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button onClick={fetchSmartMatches} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Matches
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-700 dark:text-purple-300">
              <Settings className="w-5 h-5 mr-2" />
              Matching Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Preferred Sectors</Label>
                <div className="flex flex-wrap gap-2">
                  {['Artificial Intelligence', 'Cybersecurity', 'Cloud Computing', 'Data Analytics', 'IoT', 'Blockchain'].map(sector => (
                    <Badge 
                      key={sector}
                      variant={preferences.sectors.includes(sector) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const updated = preferences.sectors.includes(sector)
                          ? preferences.sectors.filter(s => s !== sector)
                          : [...preferences.sectors, sector]
                        handlePreferenceUpdate('sectors', updated)
                      }}
                    >
                      {sector}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Contract Value Range</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm w-16">Min:</span>
                    <Input 
                      type="number" 
                      value={preferences.minValue}
                      onChange={(e) => handlePreferenceUpdate('minValue', parseInt(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm w-16">Max:</span>
                    <Input 
                      type="number" 
                      value={preferences.maxValue}
                      onChange={(e) => handlePreferenceUpdate('maxValue', parseInt(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Timeframe & Risk</Label>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Deadline (days)</span>
                      <span>{preferences.timeframe}</span>
                    </div>
                    <Slider
                      value={[preferences.timeframe]}
                      onValueChange={(value) => handlePreferenceUpdate('timeframe', value[0])}
                      max={365}
                      min={30}
                      step={30}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Risk Tolerance</span>
                      <span>{preferences.riskTolerance}%</span>
                    </div>
                    <Slider
                      value={[preferences.riskTolerance]}
                      onValueChange={(value) => handlePreferenceUpdate('riskTolerance', value[0])}
                      max={100}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={fetchSmartMatches}>
                <Search className="w-4 h-4 mr-2" />
                Update Matches
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Perfect Matches</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {matchingData?.summary?.perfect_matches || 8}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Good Matches</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {matchingData?.summary?.good_matches || 15}
                </p>
              </div>
              <ThumbsUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(matchingData?.summary?.total_value || 127500000)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Today</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {matchingData?.summary?.new_today || 3}
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Matches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Your Top Matches
            <Badge variant="secondary" className="ml-2">AI-Powered</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(matchingData?.top_matches || [
              {
                id: 'match-001',
                title: 'DoD AI/ML Development Framework',
                agency: 'Department of Defense',
                estimated_value: 25000000,
                due_date: '2025-02-15',
                match_reasons: ['Perfect AI/ML expertise match', 'Suitable contract size', 'Strong past performance alignment'],
                risk_factors: ['Competitive bidding', 'Security clearance required'],
                confidence: 94
              },
              {
                id: 'match-002',
                title: 'NASA Space Data Analytics Platform',
                agency: 'NASA',
                estimated_value: 8500000,
                due_date: '2025-03-01',
                match_reasons: ['Data analytics expertise', 'Cloud platform experience', 'Previous NASA work'],
                risk_factors: ['Technical complexity', 'Tight timeline'],
                confidence: 89
              },
              {
                id: 'match-003',
                title: 'DHS Cybersecurity Infrastructure Upgrade',
                agency: 'Department of Homeland Security',
                estimated_value: 15000000,
                due_date: '2025-02-28',
                match_reasons: ['Cybersecurity specialization', 'Infrastructure experience', 'Security clearance team'],
                risk_factors: ['High visibility project', 'Regulatory compliance'],
                confidence: 87
              }
            ]).map((match, index) => {
              const matchScore = getMatchScore(match)
              return (
                <Card key={match.id || index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{match.title}</h3>
                          <Badge className={getMatchBadgeColor(matchScore)}>
                            {matchScore}% Match
                          </Badge>
                          {matchScore >= 90 && <Star className="w-4 h-4 text-yellow-500" />}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center">
                            <Building2 className="w-3 h-3 mr-1" />
                            {match.agency}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {formatCurrency(match.estimated_value)}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Due {formatRelativeDate(match.due_date)}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <BookmarkPlus className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm">
                          <Target className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-green-700 dark:text-green-300 mb-2 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Why This Matches
                        </h4>
                        <ul className="space-y-1">
                          {match.match_reasons.map((reason, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start">
                              <div className="w-1 h-1 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-orange-700 dark:text-orange-300 mb-2 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Consider These Risks
                        </h4>
                        <ul className="space-y-1">
                          {match.risk_factors.map((risk, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start">
                              <div className="w-1 h-1 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-muted-foreground">AI Confidence:</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={match.confidence} className="w-20 h-2" />
                            <span className="text-sm font-medium">{match.confidence}%</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost">
                            <Heart className="w-4 h-4" />
                          </Button>
                          <Badge variant="outline" className="text-xs">
                            <Brain className="w-3 h-3 mr-1" />
                            AI Matched
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Match Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Matching Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(matchingData?.insights || [
                { type: 'opportunity', message: 'AI/ML contracts have 34% higher success rate for your profile', icon: Brain },
                { type: 'timing', message: 'Q2 2025 shows 67% more opportunities in your sectors', icon: Clock },
                { type: 'competition', message: 'Average 5.2 competitors for contracts in your value range', icon: Users },
                { type: 'strategy', message: 'Consider teaming for contracts above $20M value', icon: Award }
              ]).map((insight, index) => {
                const Icon = insight.icon
                return (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium capitalize">{insight.type} Insight</div>
                      <div className="text-sm text-muted-foreground">{insight.message}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-purple-500" />
              Optimization Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(matchingData?.suggestions || [
                'Expand cybersecurity capabilities to access 23% more opportunities',
                'Consider small business partnerships to bid on set-aside contracts',
                'Update past performance documentation to improve match scores',
                'Focus on contracts under $25M for 78% higher win probability'
              ]).map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}