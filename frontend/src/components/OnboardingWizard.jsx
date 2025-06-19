import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { 
  ChevronRight, 
  ChevronLeft, 
  Building, 
  Target, 
  DollarSign, 
  Bell,
  CheckCircle,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

const INDUSTRY_KEYWORDS = [
  'Artificial Intelligence', 'Machine Learning', 'Cybersecurity', 'Cloud Computing',
  'Data Analytics', 'Software Development', 'IT Infrastructure', 'Network Security',
  'Digital Transformation', 'IoT', 'Blockchain', 'DevOps'
]

const AGENCIES = [
  'Department of Defense (DoD)', 'Department of Homeland Security (DHS)',
  'General Services Administration (GSA)', 'Department of Veterans Affairs (VA)',
  'National Aeronautics and Space Administration (NASA)', 'Department of Health and Human Services (HHS)',
  'Department of Energy (DOE)', 'Department of Transportation (DOT)'
]

const steps = [
  {
    id: 'company',
    title: 'Company Profile',
    description: 'Tell us about your company',
    icon: Building
  },
  {
    id: 'interests',
    title: 'Areas of Interest',
    description: 'What types of opportunities are you looking for?',
    icon: Target
  },
  {
    id: 'budget',
    title: 'Budget & Scope',
    description: 'Define your target contract values',
    icon: DollarSign
  },
  {
    id: 'alerts',
    title: 'Alert Preferences',
    description: 'How would you like to be notified?',
    icon: Bell
  }
]

export default function OnboardingWizard({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [preferences, setPreferences] = useState({
    company: '',
    capabilities: '',
    samApiKey: '',
    keywords: [],
    agencies: [],
    minValue: 100000,
    maxValue: 5000000,
    emailAlerts: true,
    alertFrequency: 'daily',
    minScoreThreshold: 70
  })

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    const finalPreferences = {
      ...preferences,
      isOnboarded: true
    }
    onComplete(finalPreferences)
  }

  const toggleKeyword = (keyword) => {
    setPreferences(prev => ({
      ...prev,
      keywords: prev.keywords.includes(keyword)
        ? prev.keywords.filter(k => k !== keyword)
        : [...prev.keywords, keyword]
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

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Company
        return preferences.company.trim().length > 0
      case 1: // Interests
        return preferences.keywords.length > 0 || preferences.agencies.length > 0
      case 2: // Budget
        return preferences.minValue > 0 && preferences.maxValue > preferences.minValue
      case 3: // Alerts
        return true // Always can proceed from alerts
      default:
        return true
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Building className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold">Company Profile</h2>
              <p className="text-muted-foreground">
                Let's start with some basic information about your company
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
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
                  placeholder="Briefly describe what your company does best..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="samApiKey">SAM.gov API Key (Optional)</Label>
                <Input
                  id="samApiKey"
                  type="password"
                  value={preferences.samApiKey}
                  onChange={(e) => setPreferences(prev => ({ ...prev, samApiKey: e.target.value }))}
                  placeholder="Get yours free at sam.gov"
                />
                <p className="text-sm text-muted-foreground">
                  Required for accessing real government contracting data
                </p>
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold">Areas of Interest</h2>
              <p className="text-muted-foreground">
                Select the industries and agencies you're most interested in
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Industry Keywords</Label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_KEYWORDS.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant={preferences.keywords.includes(keyword) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleKeyword(keyword)}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected: {preferences.keywords.length} keywords
                </p>
              </div>

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
                <p className="text-sm text-muted-foreground">
                  Selected: {preferences.agencies.length} agencies
                </p>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold">Budget & Scope</h2>
              <p className="text-muted-foreground">
                What contract values are you targeting?
              </p>
            </div>
            
            <div className="space-y-6">
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
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-center font-medium">
                  Target Range: ${preferences.minValue.toLocaleString()} - ${preferences.maxValue.toLocaleString()}
                </p>
              </div>
              
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
                  Only show opportunities scoring above this threshold
                </p>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold">Alert Preferences</h2>
              <p className="text-muted-foreground">
                How would you like to stay informed about new opportunities?
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for new opportunities
                  </p>
                </div>
                <Checkbox
                  checked={preferences.emailAlerts}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, emailAlerts: checked }))
                  }
                />
              </div>

              <div className="space-y-3">
                <Label>Alert Frequency</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['immediate', 'daily', 'weekly'].map((freq) => (
                    <Button
                      key={freq}
                      variant={preferences.alertFrequency === freq ? "default" : "outline"}
                      onClick={() => setPreferences(prev => ({ ...prev, alertFrequency: freq }))}
                      className="capitalize"
                    >
                      {freq}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">You're all set!</h3>
                    <p className="text-sm text-muted-foreground">
                      We'll start personalizing your opportunity feed based on your preferences.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">OpportunityHub Setup</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentStep + 1} of {steps.length}
            </p>
          </CardHeader>
          
          <CardContent className="pt-0">
            {renderStep()}
            
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={currentStep === 0 ? onSkip : handlePrevious}
                disabled={currentStep === 0 && !onSkip}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {currentStep === 0 ? 'Skip Setup' : 'Previous'}
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className={cn(currentStep === steps.length - 1 && "bg-green-600 hover:bg-green-700")}
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Setup
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}