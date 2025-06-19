import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiClient } from '@/lib/api'
import { userPreferencesSchema } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Building, 
  Target, 
  DollarSign, 
  MapPin, 
  Bell, 
  Key,
  Trash2,
  Plus,
  X,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const INDUSTRY_KEYWORDS = [
  'Artificial Intelligence', 'Machine Learning', 'Cybersecurity', 'Cloud Computing',
  'Data Analytics', 'Software Development', 'IT Infrastructure', 'Network Security',
  'Digital Transformation', 'IoT', 'Blockchain', 'DevOps', 'API Development',
  'Mobile Applications', 'Web Development', 'Database Management', 'System Integration'
]

const NAICS_CODES = [
  { code: '541511', description: 'Custom Computer Programming Services' },
  { code: '541512', description: 'Computer Systems Design Services' },
  { code: '541513', description: 'Computer Facilities Management Services' },
  { code: '541519', description: 'Other Computer Related Services' },
  { code: '541611', description: 'Administrative Management Consulting Services' },
  { code: '541618', description: 'Other Management Consulting Services' },
  { code: '518210', description: 'Data Processing, Hosting, and Related Services' },
  { code: '541330', description: 'Engineering Services' },
  { code: '541690', description: 'Other Scientific and Technical Consulting Services' }
]

const AGENCIES = [
  'Department of Defense (DoD)', 'Department of Homeland Security (DHS)',
  'General Services Administration (GSA)', 'Department of Veterans Affairs (VA)',
  'National Aeronautics and Space Administration (NASA)', 'Department of Health and Human Services (HHS)',
  'Department of Energy (DOE)', 'Department of Transportation (DOT)',
  'Environmental Protection Agency (EPA)', 'Department of Justice (DOJ)',
  'Department of Commerce (DOC)', 'Department of Agriculture (USDA)',
  'Department of Education (ED)', 'Social Security Administration (SSA)'
]

const SET_ASIDE_TYPES = [
  'Small Business Set-Aside', 'Women-Owned Small Business (WOSB)', 
  'Service-Disabled Veteran-Owned Small Business (SDVOSB)', 'HUBZone Set-Aside',
  'Historically Underutilized Business Zone (HUBZone)', '8(a) Business Development',
  'Veteran-Owned Small Business (VOSB)', 'Economically Disadvantaged Women-Owned Small Business (EDWOSB)',
  'Ability One', 'Indian Small Business Economic Enterprise'
]

export default function UserSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [preferences, setPreferences] = useState({
    // Profile
    company: '',
    capabilities: '',
    samApiKey: '',
    
    // Keywords & Industries
    keywords: [],
    naicsCodes: [],
    customKeywords: '',
    
    // Contract Preferences
    minValue: 50000,
    maxValue: 10000000,
    setAsideTypes: [],
    agencies: [],
    
    // Geographic
    statesOfInterest: [],
    
    // Notifications
    emailAlerts: true,
    alertFrequency: 'daily',
    minScoreThreshold: 70,
    
    // Advanced Filters
    excludeKeywords: [],
    competitionLevel: 'all', // low, medium, high, all
    opportunityTypes: ['contract', 'grant', 'rfp'],
    
    // Onboarding
    isOnboarded: false
  })

  const [newKeyword, setNewKeyword] = useState('')
  const [newExcludeKeyword, setNewExcludeKeyword] = useState('')

  // Load preferences on component mount
  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const response = await apiClient.request('/user/preferences')
      if (response.success && response.preferences) {
        setPreferences(prevPrefs => ({
          ...prevPrefs,
          ...response.preferences
        }))
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    } finally {
      setInitialLoad(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await apiClient.request('/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      })
      
      if (response.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        console.error('Failed to save preferences:', response.error)
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const addKeyword = (keyword) => {
    if (keyword && !preferences.keywords.includes(keyword)) {
      setPreferences(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }))
    }
  }

  const removeKeyword = (keyword) => {
    setPreferences(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  const addExcludeKeyword = (keyword) => {
    if (keyword && !preferences.excludeKeywords.includes(keyword)) {
      setPreferences(prev => ({
        ...prev,
        excludeKeywords: [...prev.excludeKeywords, keyword]
      }))
      setNewExcludeKeyword('')
    }
  }

  const removeExcludeKeyword = (keyword) => {
    setPreferences(prev => ({
      ...prev,
      excludeKeywords: prev.excludeKeywords.filter(k => k !== keyword)
    }))
  }

  const toggleNaicsCode = (code) => {
    setPreferences(prev => ({
      ...prev,
      naicsCodes: prev.naicsCodes.includes(code)
        ? prev.naicsCodes.filter(c => c !== code)
        : [...prev.naicsCodes, code]
    }))
  }

  const toggleSetAsideType = (type) => {
    setPreferences(prev => ({
      ...prev,
      setAsideTypes: prev.setAsideTypes.includes(type)
        ? prev.setAsideTypes.filter(t => t !== type)
        : [...prev.setAsideTypes, type]
    }))
  }

  const toggleAgency = (agency) => {
    setPreferences(prev => ({
      ...prev,
      agencies: prev.agencies.includes(agency)
        ? prev.agencies.filter(a => a !== agency)
        : [...prev.agencies, agency]
    }))
  }

  if (initialLoad) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading preferences...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your opportunity preferences and filters
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {saved && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Settings saved!</span>
            </div>
          )}
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="interests">Interests</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Company Profile</span>
              </CardTitle>
              <CardDescription>
                Basic information about your company and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  value={preferences.company}
                  onChange={(e) => setPreferences(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Enter your company name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capabilities">Core Capabilities</Label>
                <Textarea
                  id="capabilities"
                  value={preferences.capabilities}
                  onChange={(e) => setPreferences(prev => ({ ...prev, capabilities: e.target.value }))}
                  placeholder="Describe your company's core capabilities and expertise..."
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="samApiKey" className="flex items-center space-x-2">
                  <Key className="w-4 h-4" />
                  <span>SAM.gov API Key</span>
                </Label>
                <Input
                  id="samApiKey"
                  type="password"
                  value={preferences.samApiKey}
                  onChange={(e) => setPreferences(prev => ({ ...prev, samApiKey: e.target.value }))}
                  placeholder="Enter your SAM.gov API key for real data access"
                />
                <p className="text-sm text-muted-foreground">
                  Get your free API key from <a href="https://sam.gov" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sam.gov</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interests Tab */}
        <TabsContent value="interests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Keywords & Industries</span>
              </CardTitle>
              <CardDescription>
                Define the technologies and industries you're interested in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Industry Keywords */}
              <div className="space-y-3">
                <Label>Industry Keywords</Label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_KEYWORDS.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant={preferences.keywords.includes(keyword) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => 
                        preferences.keywords.includes(keyword) 
                          ? removeKeyword(keyword)
                          : addKeyword(keyword)
                      }
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Custom Keywords */}
              <div className="space-y-3">
                <Label>Custom Keywords</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add custom keyword..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addKeyword(newKeyword)
                        setNewKeyword('')
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      addKeyword(newKeyword)
                      setNewKeyword('')
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {preferences.keywords.filter(k => !INDUSTRY_KEYWORDS.includes(k)).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {preferences.keywords
                      .filter(k => !INDUSTRY_KEYWORDS.includes(k))
                      .map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="cursor-pointer">
                          {keyword}
                          <X 
                            className="w-3 h-3 ml-1" 
                            onClick={() => removeKeyword(keyword)}
                          />
                        </Badge>
                      ))}
                  </div>
                )}
              </div>

              {/* NAICS Codes */}
              <div className="space-y-3">
                <Label>NAICS Codes</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {NAICS_CODES.map((naics) => (
                    <div key={naics.code} className="flex items-center space-x-2">
                      <Checkbox
                        checked={preferences.naicsCodes.includes(naics.code)}
                        onCheckedChange={() => toggleNaicsCode(naics.code)}
                      />
                      <Label className="text-sm cursor-pointer" onClick={() => toggleNaicsCode(naics.code)}>
                        <span className="font-mono">{naics.code}</span> - {naics.description}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exclude Keywords */}
              <div className="space-y-3">
                <Label>Exclude Keywords</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newExcludeKeyword}
                    onChange={(e) => setNewExcludeKeyword(e.target.value)}
                    placeholder="Keywords to exclude from results..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addExcludeKeyword(newExcludeKeyword)
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => addExcludeKeyword(newExcludeKeyword)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {preferences.excludeKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {preferences.excludeKeywords.map((keyword) => (
                      <Badge key={keyword} variant="destructive" className="cursor-pointer">
                        {keyword}
                        <X 
                          className="w-3 h-3 ml-1" 
                          onClick={() => removeExcludeKeyword(keyword)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Contract Preferences</span>
              </CardTitle>
              <CardDescription>
                Set your contract value ranges and preference filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contract Value Range */}
              <div className="space-y-4">
                <Label>Contract Value Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minValue">Minimum Value</Label>
                    <Input
                      id="minValue"
                      type="number"
                      value={preferences.minValue}
                      onChange={(e) => setPreferences(prev => ({ 
                        ...prev, 
                        minValue: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxValue">Maximum Value</Label>
                    <Input
                      id="maxValue"
                      type="number"
                      value={preferences.maxValue}
                      onChange={(e) => setPreferences(prev => ({ 
                        ...prev, 
                        maxValue: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Current range: ${preferences.minValue.toLocaleString()} - ${preferences.maxValue.toLocaleString()}
                </p>
              </div>

              <Separator />

              {/* Set-Aside Types */}
              <div className="space-y-3">
                <Label>Set-Aside Types</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {SET_ASIDE_TYPES.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        checked={preferences.setAsideTypes.includes(type)}
                        onCheckedChange={() => toggleSetAsideType(type)}
                      />
                      <Label className="text-sm cursor-pointer" onClick={() => toggleSetAsideType(type)}>
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Preferred Agencies */}
              <div className="space-y-3">
                <Label>Preferred Agencies</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {AGENCIES.map((agency) => (
                    <div key={agency} className="flex items-center space-x-2">
                      <Checkbox
                        checked={preferences.agencies.includes(agency)}
                        onCheckedChange={() => toggleAgency(agency)}
                      />
                      <Label className="text-sm cursor-pointer" onClick={() => toggleAgency(agency)}>
                        {agency}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Geographic Preferences</span>
              </CardTitle>
              <CardDescription>
                Define your geographic areas of interest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Place of Performance</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select states of interest" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="remote">Remote Work Acceptable</SelectItem>
                    <SelectItem value="local">Local Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Geographic filtering will be enhanced in the next update with detailed state selection and location-based scoring.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Alert Settings</span>
              </CardTitle>
              <CardDescription>
                Configure how and when you receive opportunity alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Alerts */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for new opportunities
                  </p>
                </div>
                <Switch
                  checked={preferences.emailAlerts}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, emailAlerts: checked }))
                  }
                />
              </div>

              <Separator />

              {/* Alert Frequency */}
              <div className="space-y-2">
                <Label>Alert Frequency</Label>
                <Select
                  value={preferences.alertFrequency}
                  onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, alertFrequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Score Threshold */}
              <div className="space-y-4">
                <Label>Minimum Score Threshold: {preferences.minScoreThreshold}%</Label>
                <Slider
                  value={[preferences.minScoreThreshold]}
                  onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, minScoreThreshold: value[0] }))
                  }
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Only receive alerts for opportunities scoring above this threshold
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}