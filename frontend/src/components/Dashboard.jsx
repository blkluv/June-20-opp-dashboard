import { useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Clock, 
  Target,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiClient, formatCurrency } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [syncStatus, setSyncStatus] = useState(null)
  const [recentOpportunities, setRecentOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load stats, sync status, and recent opportunities in parallel
      const [statsData, syncData, opportunitiesData] = await Promise.all([
        apiClient.getOpportunityStats(),
        apiClient.getSyncStatus(),
        apiClient.getOpportunities({ per_page: 5, sort_by: 'created_at', sort_order: 'desc' })
      ])
      
      setStats(statsData)
      setSyncStatus(syncData)
      setRecentOpportunities(opportunitiesData.opportunities || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      toast({
        title: "Sync Started",
        description: "Data synchronization has been initiated",
      })
      
      await apiClient.syncData()
      
      toast({
        title: "Sync Complete",
        description: "Data has been synchronized successfully",
      })
      
      // Reload dashboard data
      loadDashboardData()
    } catch (error) {
      console.error('Sync failed:', error)
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to synchronize data",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button disabled>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Prepare chart data
  const sourceTypeData = stats?.source_types ? Object.entries(stats.source_types).map(([key, value]) => ({
    name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: value
  })) : []

  const scoreDistributionData = stats?.score_distribution ? Object.entries(stats.score_distribution).map(([range, count]) => ({
    range,
    count
  })) : []

  const dueDateData = stats?.due_date_distribution ? Object.entries(stats.due_date_distribution).map(([category, count]) => ({
    category,
    count
  })) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of RFP and grant opportunities
          </p>
        </div>
        <Button onClick={handleSync}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_opportunities?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_opportunities || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.value_statistics?.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(stats?.value_statistics?.average)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Score Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.score_distribution?.['90-100'] || 0) + (stats?.score_distribution?.['80-89'] || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Score ≥ 80
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.due_date_distribution?.['Due in 7 days'] || 0) + (stats?.due_date_distribution?.['Due in 30 days'] || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Source Types */}
        <Card>
          <CardHeader>
            <CardTitle>Opportunities by Source</CardTitle>
            <CardDescription>Distribution across different data sources</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>Opportunities grouped by score ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Due Date Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Due Date Distribution</CardTitle>
          <CardDescription>Opportunities by deadline urgency</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dueDateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Opportunities & Sync Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Opportunities</CardTitle>
            <CardDescription>Latest opportunities added to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOpportunities.length > 0 ? (
                recentOpportunities.map((opportunity) => (
                  <div key={opportunity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {opportunity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {opportunity.agency_name} • {opportunity.source_name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          Score: {opportunity.total_score}
                        </Badge>
                        {opportunity.estimated_value && (
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(opportunity.estimated_value)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent opportunities found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle>Data Sources Status</CardTitle>
            <CardDescription>Last synchronization status for each source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncStatus?.sources ? Object.entries(syncStatus.sources).map(([sourceName, status]) => (
                <div key={sourceName} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {status.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : status.status === 'failed' ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{sourceName}</p>
                      <p className="text-xs text-muted-foreground">
                        {status.last_sync ? new Date(status.last_sync).toLocaleDateString() : 'Never synced'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {status.records_added || 0} added
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {status.records_updated || 0} updated
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No sync data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

