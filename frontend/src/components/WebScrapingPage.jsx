import { useState, useEffect } from 'react'
import { Globe, Database, Play, Pause, Settings, Filter, Download, Eye, Clock, TrendingUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { apiClient, formatCurrency, formatDate, formatRelativeDate, getScoreColor, getScoreBadgeColor, getUrgencyColor } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

// Source categories for the explorer
const SOURCE_CATEGORIES = {
  'state_government': {
    name: 'State Governments',
    description: 'All 50 U.S. state procurement portals',
    icon: '🏛️',
    count: 50,
    sources: [
      { key: 'california', name: 'California eProcurement', status: 'active', lastScraped: '2024-06-19T10:30:00Z', opportunities: 45 },
      { key: 'texas', name: 'Texas SmartBuy', status: 'active', lastScraped: '2024-06-19T09:15:00Z', opportunities: 32 },
      { key: 'new_york', name: 'New York State Procurement', status: 'active', lastScraped: '2024-06-19T11:00:00Z', opportunities: 28 },
      { key: 'florida', name: 'Florida Vendor Bid System', status: 'pending', lastScraped: null, opportunities: 0 },
      { key: 'illinois', name: 'Illinois Procurement Bulletin', status: 'active', lastScraped: '2024-06-19T08:45:00Z', opportunities: 19 }
    ]
  },
  'major_cities': {
    name: 'Major Cities',
    description: 'Top 10 city government procurement systems',
    icon: '🏙️',
    count: 10,
    sources: [
      { key: 'nyc', name: 'NYC Procurement', status: 'active', lastScraped: '2024-06-19T10:00:00Z', opportunities: 38 },
      { key: 'chicago', name: 'Chicago Procurement', status: 'active', lastScraped: '2024-06-19T09:30:00Z', opportunities: 22 },
      { key: 'los_angeles', name: 'Los Angeles Procurement', status: 'error', lastScraped: '2024-06-18T14:20:00Z', opportunities: 0 },
      { key: 'houston', name: 'Houston Procurement', status: 'active', lastScraped: '2024-06-19T11:15:00Z', opportunities: 15 }
    ]
  },
  'fortune_500': {
    name: 'Fortune 500',
    description: 'Major corporation supplier portals',
    icon: '🏢',
    count: 25,
    sources: [
      { key: 'microsoft', name: 'Microsoft Supplier Portal', status: 'active', lastScraped: '2024-06-19T10:45:00Z', opportunities: 12 },
      { key: 'amazon', name: 'Amazon Supplier Portal', status: 'active', lastScraped: '2024-06-19T10:20:00Z', opportunities: 8 },
      { key: 'google', name: 'Google Supplier Portal', status: 'pending', lastScraped: null, opportunities: 0 },
      { key: 'apple', name: 'Apple Supplier Portal', status: 'active', lastScraped: '2024-06-19T09:55:00Z', opportunities: 5 }
    ]
  },
  'international': {
    name: 'International',
    description: 'Global organizations and development banks',
    icon: '🌍',
    count: 8,
    sources: [
      { key: 'world_bank', name: 'World Bank Procurement', status: 'active', lastScraped: '2024-06-19T08:30:00Z', opportunities: 67 },
      { key: 'un_global', name: 'UN Global Marketplace', status: 'active', lastScraped: '2024-06-19T09:00:00Z', opportunities: 43 },
      { key: 'european_union', name: 'EU TED Portal', status: 'active', lastScraped: '2024-06-19T07:45:00Z', opportunities: 89 }
    ]
  },
  'universities': {
    name: 'Universities',
    description: 'Research institutions and university systems',
    icon: '🎓',
    count: 12,
    sources: [
      { key: 'harvard', name: 'Harvard University', status: 'active', lastScraped: '2024-06-19T10:10:00Z', opportunities: 7 },
      { key: 'stanford', name: 'Stanford University', status: 'active', lastScraped: '2024-06-19T09:40:00Z', opportunities: 4 },
      { key: 'mit', name: 'MIT Procurement', status: 'error', lastScraped: '2024-06-18T16:30:00Z', opportunities: 0 }
    ]
  },
  'marketplaces': {
    name: 'RFP Marketplaces',
    description: 'Specialized procurement platforms and aggregators',
    icon: '🛒',
    count: 8,
    sources: [
      { key: 'bidnet', name: 'BidNet', status: 'active', lastScraped: '2024-06-19T11:30:00Z', opportunities: 156 },
      { key: 'rfpmart', name: 'RFPMart', status: 'active', lastScraped: '2024-06-19T10:50:00Z', opportunities: 89 },
      { key: 'govwin', name: 'GovWin IQ', status: 'pending', lastScraped: null, opportunities: 0 }
    ]
  }
}

export default function WebScrapingPage() {
  const [activeTab, setActiveTab] = useState('sources')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSources, setSelectedSources] = useState([])
  const [scrapingStatus, setScrapingStatus] = useState('idle') // idle, running, completed
  const [scrapingResults, setScrapingResults] = useState(null)
  const [resultsFilter, setResultsFilter] = useState({
    search: '',
    sourceType: 'all',
    valueRange: 'all',
    dateRange: 'all',
    sortBy: 'score',
    sortOrder: 'desc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const { toast } = useToast()

  // Mock opportunities data for demonstration
  const [allOpportunities, setAllOpportunities] = useState([])

  useEffect(() => {
    // Generate mock opportunities for demonstration
    const mockOpportunities = []
    Object.values(SOURCE_CATEGORIES).forEach(category => {
      category.sources.forEach(source => {
        if (source.opportunities > 0) {
          for (let i = 0; i < Math.min(source.opportunities, 10); i++) {
            mockOpportunities.push({
              id: `${source.key}-${i + 1}`,
              title: `${source.name} Opportunity ${i + 1}`,
              description: `Sample opportunity from ${source.name} procurement portal`,
              agency_name: source.name,
              estimated_value: Math.floor(Math.random() * 10000000) + 50000,
              due_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
              posted_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
              source_type: category.name.toLowerCase().replace(' ', '_'),
              source_name: source.name,
              total_score: Math.floor(Math.random() * 40) + 60,
              status: 'active'
            })
          }
        }
      })
    })
    setAllOpportunities(mockOpportunities)
  }, [])

  const handleRunScraping = async (sources = 'all') => {
    setScrapingStatus('running')
    
    try {
      console.log('🚀 Starting advanced web scraping...')
      const response = await apiClient.runAdvancedScraping()
      
      setScrapingResults(response)
      setScrapingStatus('completed')
      
      toast({
        title: "Advanced Scraping Complete",
        description: `Successfully scraped ${response.sources_scraped || 0} sources and found ${response.total_opportunities || 0} opportunities`,
      })
    } catch (error) {
      console.error('Advanced scraping failed:', error)
      setScrapingStatus('idle')
      
      toast({
        title: "Scraping Failed",
        description: error.message || "Failed to run advanced scraping",
        variant: "destructive",
      })
    }
  }

  const handleSourceSelection = (sourceKey, selected) => {
    if (selected) {
      setSelectedSources(prev => [...prev, sourceKey])
    } else {
      setSelectedSources(prev => prev.filter(key => key !== sourceKey))
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'error': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
    return variants[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  // Filter and sort opportunities
  const filteredOpportunities = allOpportunities.filter(opp => {
    if (resultsFilter.search && !opp.title.toLowerCase().includes(resultsFilter.search.toLowerCase())) {
      return false
    }
    if (resultsFilter.sourceType !== 'all' && opp.source_type !== resultsFilter.sourceType) {
      return false
    }
    if (resultsFilter.valueRange !== 'all') {
      const value = opp.estimated_value || 0
      switch (resultsFilter.valueRange) {
        case 'under_100k': return value < 100000
        case '100k_1m': return value >= 100000 && value < 1000000
        case 'over_1m': return value >= 1000000
        default: return true
      }
    }
    return true
  }).sort((a, b) => {
    const factor = resultsFilter.sortOrder === 'desc' ? -1 : 1
    switch (resultsFilter.sortBy) {
      case 'score': return factor * (a.total_score - b.total_score)
      case 'value': return factor * ((a.estimated_value || 0) - (b.estimated_value || 0))
      case 'date': return factor * (new Date(a.posted_date) - new Date(b.posted_date))
      default: return 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(filteredOpportunities.length / pageSize)
  const paginatedOpportunities = filteredOpportunities.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Web Scraping Hub</h1>
            <p className="text-muted-foreground">Manage and monitor 100+ RFP sources</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => handleRunScraping('high-priority')}
            disabled={scrapingStatus === 'running'}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            <Play className="w-4 h-4 mr-2" />
            {scrapingStatus === 'running' ? 'Scraping...' : 'Quick Scrape'}
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">113</p>
                <p className="text-xs text-muted-foreground">Total Sources</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{allOpportunities.length}</p>
                <p className="text-xs text-muted-foreground">Opportunities Found</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">87%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">2.3m</p>
                <p className="text-xs text-muted-foreground">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sources">Source Explorer</TabsTrigger>
          <TabsTrigger value="results">Results & Opportunities</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        {/* Source Explorer Tab */}
        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Source Categories
              </CardTitle>
              <CardDescription>
                Explore and manage 100+ RFP sources organized by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(SOURCE_CATEGORIES).map(([key, category]) => (
                  <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-xs text-muted-foreground">{category.count} sources</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleRunScraping(key)}>
                          <Play className="w-3 h-3 mr-1" />
                          Scrape
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                      
                      {/* Sample sources */}
                      <div className="space-y-2">
                        {category.sources.slice(0, 3).map(source => (
                          <div key={source.key} className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(source.status)}
                              <span className="truncate">{source.name}</span>
                            </div>
                            <span className="text-muted-foreground">{source.opportunities}</span>
                          </div>
                        ))}
                        {category.sources.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{category.sources.length - 3} more sources
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results & Opportunities Tab */}
        <TabsContent value="results" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filter & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search opportunities..."
                    value={resultsFilter.search}
                    onChange={(e) => setResultsFilter(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Source Type</Label>
                  <Select value={resultsFilter.sourceType} onValueChange={(value) => setResultsFilter(prev => ({ ...prev, sourceType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="state_governments">State Governments</SelectItem>
                      <SelectItem value="major_cities">Major Cities</SelectItem>
                      <SelectItem value="fortune_500">Fortune 500</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                      <SelectItem value="universities">Universities</SelectItem>
                      <SelectItem value="rfp_marketplaces">Marketplaces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Value Range</Label>
                  <Select value={resultsFilter.valueRange} onValueChange={(value) => setResultsFilter(prev => ({ ...prev, valueRange: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Values</SelectItem>
                      <SelectItem value="under_100k">Under $100K</SelectItem>
                      <SelectItem value="100k_1m">$100K - $1M</SelectItem>
                      <SelectItem value="over_1m">Over $1M</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={resultsFilter.sortBy} onValueChange={(value) => setResultsFilter(prev => ({ ...prev, sortBy: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Relevance Score</SelectItem>
                      <SelectItem value="value">Estimated Value</SelectItem>
                      <SelectItem value="date">Posted Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Page Size</Label>
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Opportunities ({filteredOpportunities.length} total)
                </div>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOpportunities.map((opportunity) => (
                      <TableRow key={opportunity.id}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{opportunity.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-md">
                              {opportunity.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {opportunity.source_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(opportunity.estimated_value)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={getUrgencyColor(opportunity.due_date)}>
                            {formatRelativeDate(opportunity.due_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getScoreBadgeColor(opportunity.total_score)}>
                            {opportunity.total_score}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredOpportunities.length)} of {filteredOpportunities.length} opportunities
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Source Performance</CardTitle>
                <CardDescription>Success rates by source category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(SOURCE_CATEGORIES).map(([key, category]) => {
                    const successRate = Math.floor(Math.random() * 30) + 70
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{category.icon}</span>
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${successRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{successRate}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest scraping operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { source: 'California eProcurement', time: '2 minutes ago', status: 'success', count: 45 },
                    { source: 'NYC Procurement', time: '5 minutes ago', status: 'success', count: 38 },
                    { source: 'World Bank', time: '8 minutes ago', status: 'success', count: 67 },
                    { source: 'MIT Procurement', time: '12 minutes ago', status: 'error', count: 0 },
                    { source: 'Texas SmartBuy', time: '15 minutes ago', status: 'success', count: 32 }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(activity.status)}
                        <div>
                          <div className="text-sm font-medium">{activity.source}</div>
                          <div className="text-xs text-muted-foreground">{activity.time}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {activity.count > 0 ? `${activity.count} ops` : 'Failed'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}