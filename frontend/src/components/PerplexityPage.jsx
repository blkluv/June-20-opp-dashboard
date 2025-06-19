import { useState } from 'react'
import { Brain, Sparkles, Search, Filter, Zap, TrendingUp, Target, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { apiClient, formatCurrency, formatDate, formatRelativeDate, getScoreColor, getScoreBadgeColor, getUrgencyColor } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function PerplexityPage() {
  const [discoveryForm, setDiscoveryForm] = useState({
    keywords: '',
    sector: 'all',
    agency_focus: '',
    value_range: 'all',
    timeframe: '30'
  })
  
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [stats, setStats] = useState(null)
  const { toast } = useToast()

  const handleInputChange = (field, value) => {
    setDiscoveryForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAIDiscovery = async () => {
    try {
      setLoading(true)
      setHasSearched(true)
      
      // Prepare discovery data
      const discoveryData = {
        keywords: discoveryForm.keywords.split(',').map(k => k.trim()).filter(k => k),
        sector: discoveryForm.sector !== 'all' ? discoveryForm.sector : undefined,
        agency_focus: discoveryForm.agency_focus || undefined,
        value_range: discoveryForm.value_range !== 'all' ? discoveryForm.value_range : undefined,
        timeframe: parseInt(discoveryForm.timeframe)
      }

      // Remove undefined values
      Object.keys(discoveryData).forEach(key => {
        if (discoveryData[key] === undefined || discoveryData[key] === '') {
          delete discoveryData[key]
        }
      })

      const data = await apiClient.discoverOpportunities(discoveryData)
      setResults(data.opportunities || [])
      setStats(data.stats || null)
      
      toast({
        title: "AI Discovery Complete",
        description: `Discovered ${data.opportunities?.length || 0} opportunities using Perplexity AI`,
      })
    } catch (error) {
      console.error('AI Discovery failed:', error)
      toast({
        title: "Discovery Failed",
        description: error.message || "Failed to discover opportunities",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const clearDiscovery = () => {
    setDiscoveryForm({
      keywords: '',
      sector: 'all',
      agency_focus: '',
      value_range: 'all',
      timeframe: '30'
    })
    setResults([])
    setStats(null)
    setHasSearched(false)
  }


  const predefinedQueries = [
    {
      title: "Federal Technology Contracts",
      keywords: "AI, machine learning, cloud computing, cybersecurity",
      sector: "technology",
      description: "Discover AI and technology opportunities"
    },
    {
      title: "Healthcare & Medical RFPs",
      keywords: "healthcare, medical devices, pharmaceuticals, biotech",
      sector: "healthcare", 
      description: "Find healthcare and life sciences opportunities"
    },
    {
      title: "Infrastructure & Construction",
      keywords: "infrastructure, construction, engineering, transportation",
      sector: "construction",
      description: "Explore infrastructure and construction projects"
    },
    {
      title: "Defense & Security",
      keywords: "defense, security, military, homeland security",
      sector: "defense",
      description: "Discover defense and security contracts"
    }
  ]

  const usePresetQuery = (preset) => {
    setDiscoveryForm({
      keywords: preset.keywords,
      sector: preset.sector,
      agency_focus: '',
      value_range: 'all',
      timeframe: '30'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Opportunity Discovery</h1>
          <p className="text-muted-foreground">
            Leverage Perplexity AI to discover opportunities across the web in real-time
          </p>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="font-medium">Real-time Discovery</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Find opportunities as they're published across government and private sources
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Smart Filtering</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered relevance scoring and intelligent opportunity matching
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="font-medium">Market Intelligence</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Discover emerging trends and hidden opportunities in your sector
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Preset Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Quick Discovery Presets
          </CardTitle>
          <CardDescription>
            Use these preset queries to quickly discover opportunities in specific sectors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predefinedQueries.map((preset, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => usePresetQuery(preset)}>
                <CardContent className="pt-4">
                  <h4 className="font-medium">{preset.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{preset.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {preset.keywords.split(', ').slice(0, 3).map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Discovery Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            AI Discovery Parameters
          </CardTitle>
          <CardDescription>
            Configure your AI-powered opportunity discovery search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Keywords and Sector */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords & Technologies</Label>
                <Input
                  id="keywords"
                  placeholder="AI, cloud computing, healthcare, defense (comma-separated)"
                  value={discoveryForm.keywords}
                  onChange={(e) => handleInputChange('keywords', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  AI will search for opportunities related to these keywords
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agency">Agency Focus (Optional)</Label>
                <Input
                  id="agency"
                  placeholder="NASA, DOD, HHS, NIH, etc."
                  value={discoveryForm.agency_focus}
                  onChange={(e) => handleInputChange('agency_focus', e.target.value)}
                />
              </div>
            </div>

            {/* Sector and Value Range */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Sector Focus</Label>
                <Select 
                  value={discoveryForm.sector} 
                  onValueChange={(value) => handleInputChange('sector', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="defense">Defense & Security</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="energy">Energy</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Value Range</Label>
                <Select 
                  value={discoveryForm.value_range} 
                  onValueChange={(value) => handleInputChange('value_range', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Value</SelectItem>
                    <SelectItem value="small">Small ($0-$100K)</SelectItem>
                    <SelectItem value="medium">Medium ($100K-$1M)</SelectItem>
                    <SelectItem value="large">Large ($1M-$10M)</SelectItem>
                    <SelectItem value="enterprise">Enterprise ($10M+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Discovery Timeframe</Label>
                <Select 
                  value={discoveryForm.timeframe} 
                  onValueChange={(value) => handleInputChange('timeframe', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <Button onClick={handleAIDiscovery} disabled={loading} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Brain className="w-4 h-4 mr-2" />
                {loading ? 'Discovering...' : 'Discover Opportunities'}
              </Button>
              <Button variant="outline" onClick={clearDiscovery}>
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discovery Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              AI Discovery Results
            </CardTitle>
            <CardDescription>
              {loading ? 'AI is discovering opportunities...' : `Found ${results.length} opportunities using Perplexity AI`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="space-y-3">
                      <div className="h-6 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                      <div className="flex space-x-2">
                        <div className="h-6 bg-muted animate-pulse rounded w-16"></div>
                        <div className="h-6 bg-muted animate-pulse rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Found</p>
                      <p className="text-2xl font-bold">{stats.total || results.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Value</p>
                      <p className="text-2xl font-bold">{stats.avg_value ? formatCurrency(stats.avg_value) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">High Priority</p>
                      <p className="text-2xl font-bold">{stats.high_priority || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sources</p>
                      <p className="text-2xl font-bold">{stats.unique_sources || 1}</p>
                    </div>
                  </div>
                )}
                
                {results.map((opportunity) => (
                  <div key={opportunity.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold">{opportunity.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
                          <Brain className="w-3 h-3 mr-1" />
                          AI Discovered
                        </Badge>
                        <Badge className={getScoreBadgeColor(opportunity.total_score)}>
                          <Target className="w-3 h-3 mr-1" />
                          {opportunity.total_score}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {opportunity.description || 'AI-discovered opportunity - details extracted from web sources'}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Agency</p>
                        <p className="text-sm font-medium truncate">
                          {opportunity.agency_name || 'AI Identified'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Estimated Value</p>
                        <p className="text-sm font-medium">
                          {opportunity.estimated_value ? formatCurrency(opportunity.estimated_value) : 'TBD'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <p className={`text-sm font-medium ${getUrgencyColor(opportunity.due_date)}`}>
                          {opportunity.due_date ? formatRelativeDate(opportunity.due_date) : 'TBD'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Discovered</p>
                        <p className="text-sm font-medium">
                          {formatRelativeDate(opportunity.posted_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {opportunity.keywords && opportunity.keywords.slice(0, 3).map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Relevance: {opportunity.relevance_score || 85}</span>
                        <span>Confidence: {opportunity.confidence_score || 90}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No opportunities discovered</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or using different keywords
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}