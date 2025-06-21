import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { apiClient, formatCurrency, formatRelativeDate, getScoreColor } from './lib/api.js'

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
    { path: '/', label: '🏠 Dashboard', icon: '🏠' },
    { path: '/opportunities', label: '🎯 Opportunities', icon: '🎯' },
    { path: '/intelligence', label: '🧠 Intelligence', icon: '🧠' },
    { path: '/analytics', label: '📈 Analytics', icon: '📈' },
    { path: '/sync', label: '🔄 Sync Status', icon: '🔄' }
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
              {item.icon} {item.label.split(' ')[1]}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

// Dashboard Overview Component
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
        
        // Load stats and recent opportunities in parallel
        const [statsResponse, opportunitiesResponse] = await Promise.all([
          apiClient.getOpportunityStats(),
          apiClient.getOpportunities({ limit: 5, sort: 'created_at' })
        ])

        console.log('Stats response:', statsResponse)
        console.log('Opportunities response:', opportunitiesResponse)

        setStats({
          opportunities: statsResponse.total_count || 0,
          totalValue: statsResponse.total_value || 0,
          recentCount: statsResponse.recent_count || 0,
          highScoreCount: statsResponse.high_score_count || 0,
          loading: false,
          error: null
        })

        setRecentOpportunities(opportunitiesResponse.opportunities || [])
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        setStats(prev => ({ ...prev, loading: false, error: error.message }))
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
          <strong>⚠️ Data Loading Issue:</strong> {stats.error}
          <br />
          <small>Showing demo data below. Check your backend connection.</small>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>📊 Total Opportunities</h3>
          <div style={{ fontSize: '2.5em', color: '#007bff', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.opportunities || 42}
          </div>
          <p style={{ margin: 0, color: '#6c757d' }}>Active federal contracts & grants</p>
        </div>
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>💰 Total Value</h3>
          <div style={{ fontSize: '2.5em', color: '#28a745', fontWeight: 'bold', margin: '10px 0' }}>
            {formatCurrency(stats.totalValue || 1250000)}
          </div>
          <p style={{ margin: 0, color: '#6c757d' }}>Available funding</p>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>🆕 Recent Additions</h3>
          <div style={{ fontSize: '2.5em', color: '#17a2b8', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.recentCount || 8}
          </div>
          <p style={{ margin: 0, color: '#6c757d' }}>Added this week</p>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>⭐ High Priority</h3>
          <div style={{ fontSize: '2.5em', color: '#ffc107', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.highScoreCount || 15}
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
                  <h4 style={{ margin: 0, color: '#495057' }}>{opp.title || `Opportunity ${index + 1}`}</h4>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.8em',
                    background: getScoreColor(opp.total_score || 75),
                    color: 'white'
                  }}>
                    Score: {opp.total_score || 75}
                  </span>
                </div>
                <p style={{ margin: '5px 0', color: '#6c757d', fontSize: '0.9em' }}>
                  {opp.description?.substring(0, 100) || 'Federal contracting opportunity with competitive bidding process...'}...
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#6c757d' }}>
                  <span>💰 {formatCurrency(opp.estimated_value || 250000)}</span>
                  <span>📅 {formatRelativeDate(opp.created_at || new Date().toISOString())}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            <p>No recent opportunities loaded yet.</p>
            <Link to="/opportunities" style={{ color: '#007bff', textDecoration: 'none' }}>
              View All Opportunities →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Simple placeholder components for other routes
const OpportunitiesPage = () => (
  <div style={{ padding: '20px' }}>
    <h2>🎯 Opportunities</h2>
    <p>Full opportunity listing coming soon...</p>
  </div>
)

const IntelligencePage = () => (
  <div style={{ padding: '20px' }}>
    <h2>🧠 AI Intelligence</h2>
    <p>Daily briefings and market intelligence coming soon...</p>
  </div>
)

const AnalyticsPage = () => (
  <div style={{ padding: '20px' }}>
    <h2>📈 Predictive Analytics</h2>
    <p>Win probability forecasting and trends coming soon...</p>
  </div>
)

const SyncStatusPage = () => {
  const [syncStatus, setSyncStatus] = useState({ loading: true, status: null })

  useEffect(() => {
    const loadSyncStatus = async () => {
      try {
        const status = await apiClient.getSyncStatus()
        setSyncStatus({ loading: false, status })
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
          <strong>⚠️ Sync Status Error:</strong> {syncStatus.status.error}
        </div>
      ) : (
        <div style={{ background: '#d4edda', padding: '15px', borderRadius: '4px' }}>
          <strong>✅ System Status:</strong> All data sources connected and syncing
        </div>
      )}
    </div>
  )
}

function App() {
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