import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'

// Safe API client with fallbacks
const createSafeApiClient = () => {
  const API_BASE_URL = 'https://backend-fev91zedw-jacobs-projects-cf4c7bdb.vercel.app/api'
  
  const safeRequest = async (endpoint, options = {}) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`
      const config = {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        signal: AbortSignal.timeout(10000), // 10 second timeout
        ...options,
      }
      
      console.log(`API request: ${url}`)
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`API success: ${endpoint}`, data)
      return data
    } catch (error) {
      console.warn(`API error for ${endpoint}:`, error.message)
      // Return mock data on error
      return null
    }
  }
  
  return {
    getOpportunityStats: () => safeRequest('/opportunities/stats'),
    getOpportunities: (params = {}) => {
      const queryString = new URLSearchParams(params).toString()
      return safeRequest(`/opportunities${queryString ? `?${queryString}` : ''}`)
    },
    getSyncStatus: () => safeRequest('/sync/status')
  }
}

const apiClient = createSafeApiClient()

// Utility functions
const formatCurrency = (amount) => {
  if (!amount) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatRelativeDate = (dateString) => {
  if (!dateString) return 'Unknown'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  } catch (error) {
    return 'Unknown'
  }
}

const getScoreColor = (score) => {
  if (!score) return '#6c757d'
  if (score >= 80) return '#28a745'
  if (score >= 60) return '#ffc107'
  return '#dc3545'
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', margin: '20px' }}>
          <h2>⚠️ Something went wrong</h2>
          <p>Error: {this.state.error?.message || 'Unknown error'}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              marginRight: '10px'
            }}
          >
            Try Again
          </button>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px'
            }}
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Navigation Component
const Navigation = () => {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/opportunities', label: 'Opportunities', icon: '🎯' },
    { path: '/intelligence', label: 'Intelligence', icon: '🧠' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/sync', label: 'Sync Status', icon: '🔄' }
  ]

  return (
    <nav style={{ 
      background: '#fff', 
      padding: '10px 0', 
      borderBottom: '1px solid #e9ecef',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '0 20px' }}>
        <h2 style={{ margin: 0, color: '#007bff' }}>🎯 Opportunity Dashboard</h2>
        <div style={{ display: 'flex', gap: '15px', marginLeft: 'auto' }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                background: location.pathname === item.path ? '#007bff' : 'transparent',
                color: location.pathname === item.path ? 'white' : '#007bff',
                border: '1px solid #007bff',
                transition: 'all 0.2s'
              }}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

// Enhanced Dashboard Component with API integration
const DashboardOverview = () => {
  const [stats, setStats] = useState({
    opportunities: 0,
    totalValue: 0,
    recentCount: 0,
    highScoreCount: 0,
    loading: true,
    error: null
  })
  const [recentOpportunities, setRecentOpportunities] = useState([])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        console.log('Loading dashboard data...')
        
        // Try to load real data from API
        const [statsResponse, opportunitiesResponse] = await Promise.all([
          apiClient.getOpportunityStats(),
          apiClient.getOpportunities({ limit: 5, sort: 'created_at' })
        ])

        // Use real data if available, otherwise use mock data
        if (statsResponse) {
          setStats({
            opportunities: statsResponse.total_count || 0,
            totalValue: statsResponse.total_value || 0,
            recentCount: statsResponse.recent_count || 0,
            highScoreCount: statsResponse.high_score_count || 0,
            loading: false,
            error: null
          })
        } else {
          // Mock data fallback
          setStats({
            opportunities: 42,
            totalValue: 1250000,
            recentCount: 8,
            highScoreCount: 15,
            loading: false,
            error: 'Using demo data - backend connection unavailable'
          })
        }

        if (opportunitiesResponse?.opportunities) {
          setRecentOpportunities(opportunitiesResponse.opportunities)
        } else {
          // Mock opportunities
          setRecentOpportunities([
            {
              id: 1,
              title: "Advanced AI Research Contract",
              description: "Federal contract for artificial intelligence research and development in defense applications",
              estimated_value: 500000,
              total_score: 85,
              created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 2,
              title: "Cybersecurity Infrastructure Grant",
              description: "Grant funding for cybersecurity infrastructure improvements in government systems",
              estimated_value: 750000,
              total_score: 78,
              created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 3,
              title: "Clean Energy Development RFP",
              description: "Request for proposals for renewable energy solutions and implementation",
              estimated_value: 1200000,
              total_score: 92,
              created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
          ])
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        // Set mock data on error
        setStats({
          opportunities: 42,
          totalValue: 1250000,
          recentCount: 8,
          highScoreCount: 15,
          loading: false,
          error: 'Using demo data - ' + error.message
        })
      }
    }

    loadDashboardData()
  }, [])

  if (stats.loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p>Loading dashboard data...</p>
        <style dangerouslySetInnerHTML={{
          __html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`
        }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      {stats.error && (
        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '4px', 
          padding: '15px', 
          marginBottom: '20px' 
        }}>
          <strong>⚠️ Data Status:</strong> {stats.error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>📊 Total Opportunities</h3>
          <div style={{ fontSize: '2.5em', color: '#007bff', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.opportunities}
          </div>
          <p style={{ margin: 0, color: '#6c757d' }}>Active federal contracts & grants</p>
        </div>
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>💰 Total Value</h3>
          <div style={{ fontSize: '2.5em', color: '#28a745', fontWeight: 'bold', margin: '10px 0' }}>
            {formatCurrency(stats.totalValue)}
          </div>
          <p style={{ margin: 0, color: '#6c757d' }}>Available funding</p>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>🆕 Recent Additions</h3>
          <div style={{ fontSize: '2.5em', color: '#17a2b8', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.recentCount}
          </div>
          <p style={{ margin: 0, color: '#6c757d' }}>Added this week</p>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>⭐ High Priority</h3>
          <div style={{ fontSize: '2.5em', color: '#ffc107', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.highScoreCount}
          </div>
          <p style={{ margin: 0, color: '#6c757d' }}>Score 80+ opportunities</p>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 20px 0' }}>🕒 Recent Opportunities</h3>
        {recentOpportunities.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {recentOpportunities.map((opp, index) => (
              <div key={opp.id || index} style={{ 
                padding: '15px', 
                border: '1px solid #e9ecef', 
                borderRadius: '6px',
                background: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#495057' }}>{opp.title}</h4>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.8em',
                    background: getScoreColor(opp.total_score),
                    color: 'white'
                  }}>
                    Score: {opp.total_score}
                  </span>
                </div>
                <p style={{ margin: '5px 0', color: '#6c757d', fontSize: '0.9em' }}>
                  {opp.description?.substring(0, 100)}...
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#6c757d' }}>
                  <span>💰 {formatCurrency(opp.estimated_value)}</span>
                  <span>📅 {formatRelativeDate(opp.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            <p>Loading recent opportunities...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Other page components
const OpportunitiesPage = () => (
  <div style={{ padding: '20px' }}>
    <h2>🎯 Opportunities</h2>
    <p>Full opportunity listing with search and filtering capabilities.</p>
    <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
      <h4>Coming Soon:</h4>
      <ul>
        <li>Advanced search and filtering</li>
        <li>Opportunity details and scoring</li>
        <li>Export and sharing features</li>
        <li>Real-time updates</li>
      </ul>
    </div>
  </div>
)

const IntelligencePage = () => (
  <div style={{ padding: '20px' }}>
    <h2>🧠 AI Intelligence</h2>
    <p>Daily briefings, market intelligence, and AI-powered insights.</p>
    <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
      <h4>AI Features:</h4>
      <ul>
        <li>Daily intelligence briefings</li>
        <li>Market trend analysis</li>
        <li>Competitive intelligence</li>
        <li>Opportunity discovery</li>
      </ul>
    </div>
  </div>
)

const AnalyticsPage = () => (
  <div style={{ padding: '20px' }}>
    <h2>📈 Predictive Analytics</h2>
    <p>Win probability forecasting and performance analytics.</p>
    <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
      <h4>Analytics Features:</h4>
      <ul>
        <li>Win probability predictions</li>
        <li>Performance dashboards</li>
        <li>Trend analysis</li>
        <li>Success metrics</li>
      </ul>
    </div>
  </div>
)

const SyncStatusPage = () => {
  const [syncStatus, setSyncStatus] = useState({ loading: true, status: null })

  useEffect(() => {
    const loadSyncStatus = async () => {
      try {
        const status = await apiClient.getSyncStatus()
        setSyncStatus({ loading: false, status: status || { message: 'Demo mode - sync status unavailable' } })
      } catch (error) {
        setSyncStatus({ loading: false, status: { error: error.message } })
      }
    }
    loadSyncStatus()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h2>🔄 Sync Status</h2>
      {syncStatus.loading ? (
        <p>Loading sync status...</p>
      ) : syncStatus.status?.error ? (
        <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '4px' }}>
          <strong>⚠️ Sync Status:</strong> {syncStatus.status.error}
        </div>
      ) : (
        <div style={{ background: '#d4edda', padding: '15px', borderRadius: '4px' }}>
          <strong>✅ System Status:</strong> {syncStatus.status?.message || 'All systems operational'}
        </div>
      )}
    </div>
  )
}

function App() {
  console.log('Enhanced App is rendering...')
  
  return (
    <ErrorBoundary>
      <Router>
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
          <Navigation />
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/intelligence" element={<IntelligencePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/sync" element={<SyncStatusPage />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App 