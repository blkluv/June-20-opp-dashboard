import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { webVitalsMonitor } from '@/lib/webVitals'
import { analyticsManager } from '@/lib/analytics'
import { experimentManager } from '@/lib/experiments'
import { monitoring } from '@/lib/monitoring'
import ErrorBoundary, { PageErrorFallback } from '@/components/ErrorBoundary'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import OpportunityList from '@/components/OpportunityList'
import OpportunityDetail from '@/components/OpportunityDetail'
import PerplexityPage from '@/components/PerplexityPage'
import WebScrapingPage from '@/components/WebScrapingPage'
import IntelligencePage from '@/components/IntelligencePage'
import AnalyticsPage from '@/components/AnalyticsPage'
import MarketIntelligencePage from '@/components/MarketIntelligencePage'
import SmartMatchingPage from '@/components/SmartMatchingPage'
import SettingsPage from '@/components/SettingsPage'
import UserSettingsPage from '@/components/UserSettingsPage'
import PersonalizedDashboard from '@/components/PersonalizedDashboard'
import PerformanceDashboard from '@/components/PerformanceDashboard'
import SyncStatus from '@/components/SyncStatus'
import LoginPage from '@/components/auth/LoginPage'
import RegisterPage from '@/components/auth/RegisterPage'
import MFASetupPage from '@/components/auth/MFASetupPage'
import UserManagementPage from '@/components/admin/UserManagementPage'
import './App.css'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    // Initialize monitoring systems
    try {
      // Initialize analytics first (other systems depend on it)
      analyticsManager.init()
      
      // Initialize other monitoring systems
      webVitalsMonitor.init()
      experimentManager.init()
      monitoring.init()
      
      // Track app initialization
      analyticsManager.track('app_initialized', {
        theme: savedTheme || 'light',
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`
      })
    } catch (error) {
      console.warn('Failed to initialize monitoring systems:', error)
      // Fallback error tracking
      if (analyticsManager.isInitialized()) {
        analyticsManager.trackError(error, { context: 'app_initialization' })
      }
    }
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    if (!darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className={`min-h-screen bg-background text-foreground ${darkMode ? 'dark' : ''}`}>
          <div className="flex">
            <ErrorBoundary fallback={PageErrorFallback}>
              <Sidebar 
                isOpen={sidebarOpen} 
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                darkMode={darkMode}
                onToggleDarkMode={toggleDarkMode}
              />
            </ErrorBoundary>
            
            <main className={`flex-1 transition-all duration-300 ${
              sidebarOpen ? 'ml-64' : 'ml-16'
            }`}>
              <div className="p-6">
                <ErrorBoundary fallback={PageErrorFallback}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/personalized" element={<PersonalizedDashboard />} />
                    <Route path="/opportunities" element={<OpportunityList />} />
                    <Route path="/opportunities/:id" element={<OpportunityDetail />} />
                    <Route path="/perplexity" element={<PerplexityPage />} />
                    <Route path="/scraping" element={<WebScrapingPage />} />
                    <Route path="/intelligence" element={<IntelligencePage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/market" element={<MarketIntelligencePage />} />
                    <Route path="/matching" element={<SmartMatchingPage />} />
                    <Route path="/performance" element={<PerformanceDashboard />} />
                    <Route path="/sync" element={<SyncStatus />} />
                    <Route path="/settings" element={<UserSettingsPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/mfa-setup" element={<MFASetupPage />} />
                    <Route path="/admin/users" element={<UserManagementPage />} />
                  </Routes>
                </ErrorBoundary>
              </div>
            </main>
          </div>
          
          <Toaster />
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App

