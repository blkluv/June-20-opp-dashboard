import { useState } from 'react'
import { Settings, Database, Globe, Key, Save, TestTube } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // API Settings
    sam_api_key: '',
    firecrawl_api_key: '',
    
    // Sync Settings
    auto_sync_enabled: true,
    sync_interval_hours: 24,
    max_opportunities_per_sync: 1000,
    
    // Scoring Settings
    relevance_weight: 40,
    urgency_weight: 25,
    value_weight: 20,
    competition_weight: 15,
    
    // Notification Settings
    email_notifications: false,
    notification_email: '',
    high_score_threshold: 80,
    
    // Display Settings
    default_page_size: 20,
    show_score_breakdown: true,
    dark_mode: false
  })
  
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // In a real app, this would save to the backend
      // For now, we'll just save to localStorage
      localStorage.setItem('dashboard_settings', JSON.stringify(settings))
      
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully",
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        title: "Save Failed",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const testApiConnection = async (apiType) => {
    try {
      toast({
        title: "Testing Connection",
        description: `Testing ${apiType} API connection...`,
      })
      
      // In a real app, this would test the actual API
      setTimeout(() => {
        toast({
          title: "Connection Test",
          description: `${apiType} API connection test completed`,
        })
      }, 2000)
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: `Failed to test ${apiType} API connection`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure API keys, sync preferences, and dashboard behavior
        </p>
      </div>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="w-5 h-5 mr-2" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Configure API keys for data sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sam_api_key">SAM.gov API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="sam_api_key"
                    type="password"
                    placeholder="Enter your SAM.gov API key"
                    value={settings.sam_api_key}
                    onChange={(e) => handleInputChange('sam_api_key', e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => testApiConnection('SAM.gov')}
                  >
                    <TestTube className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for federal contract opportunities. Get your key at{' '}
                  <a href="https://api.sam.gov" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    api.sam.gov
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firecrawl_api_key">Firecrawl API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="firecrawl_api_key"
                    type="password"
                    placeholder="Enter your Firecrawl API key"
                    value={settings.firecrawl_api_key}
                    onChange={(e) => handleInputChange('firecrawl_api_key', e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => testApiConnection('Firecrawl')}
                  >
                    <TestTube className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for web scraping state and private RFP sources. Get your key at{' '}
                  <a href="https://firecrawl.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    firecrawl.dev
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <Database className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Free APIs Available</p>
                <p className="text-muted-foreground">
                  Grants.gov and USASpending.gov APIs work without API keys
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Synchronization Settings
          </CardTitle>
          <CardDescription>
            Configure how often data is synchronized from external sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Synchronization</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync data from all sources
                </p>
              </div>
              <Switch
                checked={settings.auto_sync_enabled}
                onCheckedChange={(checked) => handleInputChange('auto_sync_enabled', checked)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sync_interval">Sync Interval (hours)</Label>
                <Input
                  id="sync_interval"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.sync_interval_hours}
                  onChange={(e) => handleInputChange('sync_interval_hours', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  How often to automatically sync data (1-168 hours)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_opportunities">Max Opportunities per Sync</Label>
                <Input
                  id="max_opportunities"
                  type="number"
                  min="100"
                  max="10000"
                  value={settings.max_opportunities_per_sync}
                  onChange={(e) => handleInputChange('max_opportunities_per_sync', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of opportunities to process in one sync
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Algorithm */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Scoring Algorithm
          </CardTitle>
          <CardDescription>
            Adjust the weights for different scoring components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="relevance_weight">Relevance Weight (%)</Label>
                <Input
                  id="relevance_weight"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.relevance_weight}
                  onChange={(e) => handleInputChange('relevance_weight', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency_weight">Urgency Weight (%)</Label>
                <Input
                  id="urgency_weight"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.urgency_weight}
                  onChange={(e) => handleInputChange('urgency_weight', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="value_weight">Value Weight (%)</Label>
                <Input
                  id="value_weight"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.value_weight}
                  onChange={(e) => handleInputChange('value_weight', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="competition_weight">Competition Weight (%)</Label>
                <Input
                  id="competition_weight"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.competition_weight}
                  onChange={(e) => handleInputChange('competition_weight', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Total Weight: {settings.relevance_weight + settings.urgency_weight + settings.value_weight + settings.competition_weight}%
              </p>
              <p className="text-xs text-muted-foreground">
                Weights should total 100% for optimal scoring
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Configure alerts for high-scoring opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email alerts for new high-scoring opportunities
                </p>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) => handleInputChange('email_notifications', checked)}
              />
            </div>

            {settings.email_notifications && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="notification_email">Notification Email</Label>
                  <Input
                    id="notification_email"
                    type="email"
                    placeholder="your@email.com"
                    value={settings.notification_email}
                    onChange={(e) => handleInputChange('notification_email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="score_threshold">High Score Threshold</Label>
                  <Input
                    id="score_threshold"
                    type="number"
                    min="50"
                    max="100"
                    value={settings.high_score_threshold}
                    onChange={(e) => handleInputChange('high_score_threshold', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Send notifications for opportunities scoring above this threshold
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>
            Customize the dashboard appearance and behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="page_size">Default Page Size</Label>
                <Input
                  id="page_size"
                  type="number"
                  min="10"
                  max="100"
                  value={settings.default_page_size}
                  onChange={(e) => handleInputChange('default_page_size', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Number of opportunities to show per page
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Score Breakdown</Label>
                <p className="text-sm text-muted-foreground">
                  Display individual scoring components in opportunity lists
                </p>
              </div>
              <Switch
                checked={settings.show_score_breakdown}
                onCheckedChange={(checked) => handleInputChange('show_score_breakdown', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}

