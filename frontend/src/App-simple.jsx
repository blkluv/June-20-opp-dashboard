import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'

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
    { path: '/status', label: 'Status', icon: '🔄' }
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

// Simple Dashboard Component
const DashboardOverview = () => {
  const [stats, setStats] = useState({
    opportunities: 42,
    totalValue: 1250000,
    recentCount: 8,
    highScoreCount: 15,
    loading: false,
    error: null
  })

  // Simple currency formatter
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div style={{ padding: '20px' }}>
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
        <h3 style={{ margin: '0 0 20px 0' }}>✅ System Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {[
            { icon: '🧠', title: 'AI Intelligence', status: 'Active' },
            { icon: '📈', title: 'Analytics', status: 'Online' },
            { icon: '🎯', title: 'Matching', status: 'Ready' },
            { icon: '⚡', title: 'Data Sync', status: 'Connected' }
          ].map((feature, index) => (
            <div key={index} style={{ textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '6px' }}>
              <div style={{ fontSize: '2em', marginBottom: '10px' }}>{feature.icon}</div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{feature.title}</div>
              <div style={{ fontSize: '0.9em', color: '#28a745' }}>{feature.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Simple placeholder components
const OpportunitiesPage = () => (
  <div style={{ padding: '20px' }}>
    <h2>🎯 Opportunities</h2>
    <p>Full opportunity listing will be available here.</p>
  </div>
)

const StatusPage = () => (
  <div style={{ padding: '20px' }}>
    <h2>🔄 System Status</h2>
    <div style={{ background: '#d4edda', padding: '15px', borderRadius: '4px' }}>
      <strong>✅ All Systems Operational</strong>
      <p>Dashboard is running successfully!</p>
    </div>
  </div>
)

function App() {
  console.log('Simple App is rendering...')
  
  return (
    <ErrorBoundary>
      <Router>
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
          <Navigation />
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/status" element={<StatusPage />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App 