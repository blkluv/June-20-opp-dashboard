import { useState, useEffect } from 'react'
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database,
  Globe,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { apiClient, formatDate } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function SyncStatus() {
  const [syncStatus, setSyncStatus] = useState(null)
  const [scrapingSources, setScrapingSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [scrapingAll, setScrapingAll] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSyncData()
  }, [])

  const loadSyncData = async () => {
    try {
      setLoading(true)
      
      const [statusData, sourcesData] = await Promise.all([
        apiClient.getSyncStatus(),
        apiClient.getScrapingSources().catch(() => ({ sources: [] }))
      ])
      
      setSyncStatus(statusData)
      setScrapingSources(sourcesData.sources || [])
    } catch (error) {
      console.error('Failed to load sync data:', error)
      toast({
        title: "Error",
        description: "Failed to load synchronization status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncAll = async () => {
    try {
      setSyncing(true)
      
      toast({
        title: "Sync Started",
        description: "Data synchronization has been initiated",
      })
      
      await apiClient.syncData()
      
      toast({
        title: "Sync Complete",
        description: "All data sources have been synchronized",
      })
      
      // Reload sync status
      loadSyncData()
    } catch (error) {
      console.error('Sync failed:', error)
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to synchronize data",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleScrapeAll = async () => {
    try {
      setScrapingAll(true)
      
      toast({
        title: "Scraping Started",
        description: "Web scraping has been initiated",
      })
      
      await apiClient.syncAllScraping()
      
      toast({
        title: "Scraping Complete",
        description: "All scraping sources have been processed",
      })
      
      // Reload sync status
      loadSyncData()
    } catch (error) {
      console.error('Scraping failed:', error)
      toast({
        title: "Scraping Failed",
        description: error.message || "Failed to scrape data sources",
        variant: "destructive",
      })
    } finally {
      setScrapingAll(false)
    }
  }

  const handleTestFirecrawl = async () => {
    try {
      const result = await apiClient.testFirecrawl()
      
      if (result.success) {
        toast({
          title: "Firecrawl Test Successful",
          description: `Successfully scraped content (${result.content_length} characters)`,
        })
      } else {
        toast({
          title: "Firecrawl Test Failed",
          description: "Firecrawl service is not working properly",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Firecrawl test failed:', error)
      toast({
        title: "Firecrawl Test Failed",
        description: error.message || "Failed to test Firecrawl service",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sync Status</h1>
          <Button disabled>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
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
        <div>
          <h1 className="text-3xl font-bold">Sync Status</h1>
          <p className="text-muted-foreground">
            Monitor data synchronization and web scraping status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleTestFirecrawl} variant="outline">
            <Zap className="w-4 h-4 mr-2" />
            Test Firecrawl
          </Button>
          <Button onClick={handleScrapeAll} disabled={scrapingAll}>
            <Globe className="w-4 h-4 mr-2" />
            {scrapingAll ? 'Scraping...' : 'Scrape All'}
          </Button>
          <Button onClick={handleSyncAll} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync All'}
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Status</CardTitle>
          <CardDescription>
            Summary of all data sources and last synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {syncStatus?.total_sources || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total Sources</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {syncStatus?.active_sources || 0}
              </div>
              <p className="text-sm text-muted-foreground">Active Sources</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {syncStatus?.last_sync_total_processed || 0}
              </div>
              <p className="text-sm text-muted-foreground">Last Sync Processed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {syncStatus?.last_sync_total_added || 0}
              </div>
              <p className="text-sm text-muted-foreground">Last Sync Added</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            API Data Sources
          </CardTitle>
          <CardDescription>
            Status of federal and government API integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {syncStatus?.sources ? Object.entries(syncStatus.sources)
              .filter(([name]) => !name.startsWith('firecrawl_'))
              .map(([sourceName, status]) => (
              <div key={sourceName} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status.status)}
                  <div>
                    <p className="font-medium">{sourceName}</p>
                    <p className="text-sm text-muted-foreground">
                      Last sync: {status.last_sync ? formatDate(status.last_sync) : 'Never'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">
                      {status.records_processed || 0} processed
                    </p>
                    <p className="text-muted-foreground">
                      {status.records_added || 0} added, {status.records_updated || 0} updated
                    </p>
                  </div>
                  
                  <Badge className={getStatusColor(status.status)}>
                    {status.status || 'unknown'}
                  </Badge>
                </div>
              </div>
            )) : (
              <p className="text-muted-foreground">No API sources configured</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Web Scraping Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Web Scraping Sources
          </CardTitle>
          <CardDescription>
            Status of Firecrawl-powered web scraping sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Firecrawl Sources from Sync Status */}
            {syncStatus?.sources ? Object.entries(syncStatus.sources)
              .filter(([name]) => name.startsWith('firecrawl_'))
              .map(([sourceName, status]) => (
              <div key={sourceName} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status.status)}
                  <div>
                    <p className="font-medium">{sourceName.replace('firecrawl_', '')}</p>
                    <p className="text-sm text-muted-foreground">
                      Last scrape: {status.last_sync ? formatDate(status.last_sync) : 'Never'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">
                      {status.records_processed || 0} processed
                    </p>
                    <p className="text-muted-foreground">
                      {status.records_added || 0} added, {status.records_updated || 0} updated
                    </p>
                  </div>
                  
                  <Badge className={getStatusColor(status.status)}>
                    {status.status || 'unknown'}
                  </Badge>
                </div>
              </div>
            )) : null}

            {/* Available Scraping Sources */}
            {scrapingSources.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Available Scraping Sources</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {scrapingSources.map((source) => (
                      <div key={source.key} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{source.name}</p>
                            <p className="text-xs text-muted-foreground">{source.type}</p>
                          </div>
                          <Badge variant="outline">
                            {source.key}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 truncate">
                          {source.url}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {scrapingSources.length === 0 && !Object.keys(syncStatus?.sources || {}).some(name => name.startsWith('firecrawl_')) && (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No scraping sources available</h3>
                <p className="text-muted-foreground mb-4">
                  Firecrawl service may not be configured or available
                </p>
                <Button onClick={handleTestFirecrawl} variant="outline">
                  <Zap className="w-4 h-4 mr-2" />
                  Test Firecrawl Service
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sync Activity */}
      {syncStatus?.recent_syncs && syncStatus.recent_syncs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sync Activity</CardTitle>
            <CardDescription>
              Latest synchronization attempts and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncStatus.recent_syncs.map((sync, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(sync.status)}
                    <div>
                      <p className="font-medium">{sync.source_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(sync.sync_start)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">
                      {sync.records_processed || 0} processed
                    </p>
                    <p className="text-muted-foreground">
                      {sync.records_added || 0} added
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

