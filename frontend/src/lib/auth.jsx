// Authentication & Session Management System
// Comprehensive authentication with MFA, session management, and security

import React from 'react'
import { monitoring } from './monitoring'
// Safe import for analytics
let analyticsManager
try {
  analyticsManager = require('./analytics').analyticsManager
} catch (e) {
  analyticsManager = require('./analytics-safe').analyticsManager
}

class AuthManager {
  constructor() {
    this.config = {
      apiEndpoint: '/api/auth',
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxConcurrentSessions: 3,
      mfaRequired: true,
      passwordMinLength: 8,
      passwordRequireSpecialChars: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
    }
    
    this.currentUser = null
    this.authToken = null
    this.refreshToken = null
    this.sessionStartTime = null
    this.lastActivity = Date.now()
    this.sessionCheckInterval = null
    this.refreshTokenTimeout = null
    
    this.init()
  }

  async init() {
    // Check for existing session
    await this.restoreSession()
    
    // Set up session monitoring
    this.startSessionMonitoring()
    this.setupActivityTracking()
    
    // Set up automatic token refresh
    this.setupTokenRefresh()
  }

  // Session Management
  async restoreSession() {
    try {
      const storedToken = localStorage.getItem('auth_token')
      const storedRefreshToken = localStorage.getItem('refresh_token')
      const storedUser = localStorage.getItem('current_user')
      const sessionStart = localStorage.getItem('session_start')

      if (storedToken && storedUser) {
        // Verify token is still valid
        const isValid = await this.verifyToken(storedToken)
        if (isValid) {
          this.authToken = storedToken
          this.refreshToken = storedRefreshToken
          this.currentUser = JSON.parse(storedUser)
          this.sessionStartTime = sessionStart ? parseInt(sessionStart) : Date.now()
          
          this.log('Session restored successfully')
          return true
        } else {
          this.clearSession()
        }
      }
    } catch (error) {
      this.log('Failed to restore session:', error)
      this.clearSession()
    }
    return false
  }

  async verifyToken(token) {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  startSessionMonitoring() {
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionValidity()
    }, 60000) // Check every minute
  }

  checkSessionValidity() {
    if (!this.isAuthenticated()) return

    const now = Date.now()
    const sessionAge = now - this.sessionStartTime
    const timeSinceActivity = now - this.lastActivity

    // Check session timeout
    if (timeSinceActivity > this.config.sessionTimeout) {
      this.logout('Session timed out due to inactivity')
      return
    }

    // Check maximum session duration (8 hours)
    if (sessionAge > 8 * 60 * 60 * 1000) {
      this.logout('Session expired - please log in again')
      return
    }
  }

  setupActivityTracking() {
    // Track user activity to reset session timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.lastActivity = Date.now()
      }, { passive: true })
    })
  }

  setupTokenRefresh() {
    if (!this.authToken) return

    // Decode token to get expiry
    try {
      const tokenPayload = JSON.parse(atob(this.authToken.split('.')[1]))
      const expiryTime = tokenPayload.exp * 1000
      const refreshTime = expiryTime - this.config.tokenRefreshThreshold

      this.refreshTokenTimeout = setTimeout(() => {
        this.refreshAuthToken()
      }, Math.max(0, refreshTime - Date.now()))
    } catch (error) {
      this.log('Failed to setup token refresh:', error)
    }
  }

  async refreshAuthToken() {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.refreshToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        this.authToken = data.accessToken
        this.refreshToken = data.refreshToken
        
        localStorage.setItem('auth_token', this.authToken)
        localStorage.setItem('refresh_token', this.refreshToken)
        
        this.setupTokenRefresh() // Setup next refresh
        this.log('Token refreshed successfully')
      } else {
        this.logout('Session expired - please log in again')
      }
    } catch (error) {
      this.log('Token refresh failed:', error)
      this.logout('Authentication error - please log in again')
    }
  }

  // Authentication Methods
  async register(userData) {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (response.ok) {
        monitoring.captureCustomEvent('user_registration', {
          userId: data.user.id,
          method: 'email'
        })
        
        return { success: true, user: data.user, requiresVerification: data.requiresVerification }
      } else {
        throw new Error(data.error || 'Registration failed')
      }
    } catch (error) {
      monitoring.captureError({
        type: 'authentication',
        message: error.message,
        context: 'registration'
      })
      throw error
    }
  }

  async login(email, password, mfaCode = null) {
    try {
      const loginData = { email, password }
      if (mfaCode) loginData.mfaCode = mfaCode

      const response = await fetch(`${this.config.apiEndpoint}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })

      const data = await response.json()

      if (response.ok) {
        if (data.requiresMFA) {
          return { success: true, requiresMFA: true, mfaMethod: data.mfaMethod }
        }

        await this.setAuthenticatedUser(data)
        
        monitoring.captureCustomEvent('user_login', {
          userId: data.user.id,
          method: mfaCode ? 'email_mfa' : 'email',
          sessionId: this.getSessionId()
        })

        return { success: true, user: data.user }
      } else {
        throw new Error(data.error || 'Login failed')
      }
    } catch (error) {
      monitoring.captureError({
        type: 'authentication',
        message: error.message,
        context: 'login'
      })
      throw error
    }
  }

  async setAuthenticatedUser(authData) {
    this.currentUser = authData.user
    this.authToken = authData.accessToken
    this.refreshToken = authData.refreshToken
    this.sessionStartTime = Date.now()
    this.lastActivity = Date.now()

    // Store in localStorage
    localStorage.setItem('auth_token', this.authToken)
    localStorage.setItem('refresh_token', this.refreshToken)
    localStorage.setItem('current_user', JSON.stringify(this.currentUser))
    localStorage.setItem('session_start', this.sessionStartTime.toString())

    // Set up token refresh
    this.setupTokenRefresh()

    // Track user in analytics
    analyticsManager.identify(this.currentUser.id, {
      email: this.currentUser.email,
      name: this.currentUser.name,
      role: this.currentUser.role,
      loginTime: Date.now()
    })
  }

  async logout(reason = 'User logout') {
    try {
      if (this.authToken) {
        // Notify server of logout
        await fetch(`${this.config.apiEndpoint}/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.authToken}` }
        })
      }

      monitoring.captureCustomEvent('user_logout', {
        userId: this.currentUser?.id,
        reason,
        sessionDuration: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0
      })
    } catch (error) {
      this.log('Logout request failed:', error)
    }

    this.clearSession()
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  clearSession() {
    this.currentUser = null
    this.authToken = null
    this.refreshToken = null
    this.sessionStartTime = null

    // Clear storage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('current_user')
    localStorage.removeItem('session_start')

    // Clear timers
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
      this.sessionCheckInterval = null
    }
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout)
      this.refreshTokenTimeout = null
    }
  }

  // MFA Methods
  async setupMFA() {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/mfa/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.authToken}` }
      })

      const data = await response.json()
      if (response.ok) {
        return {
          success: true,
          qrCode: data.qrCode,
          backupCodes: data.backupCodes,
          secret: data.secret
        }
      } else {
        throw new Error(data.error || 'MFA setup failed')
      }
    } catch (error) {
      monitoring.captureError({
        type: 'mfa',
        message: error.message,
        context: 'setup'
      })
      throw error
    }
  }

  async verifyMFA(code) {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/mfa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ code })
      })

      const data = await response.json()
      return { success: response.ok, enabled: data.enabled }
    } catch (error) {
      monitoring.captureError({
        type: 'mfa',
        message: error.message,
        context: 'verification'
      })
      throw error
    }
  }

  async disableMFA(password) {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/mfa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ password })
      })

      return { success: response.ok }
    } catch (error) {
      monitoring.captureError({
        type: 'mfa',
        message: error.message,
        context: 'disable'
      })
      throw error
    }
  }

  // Password Management
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/password/change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await response.json()
      return { success: response.ok, message: data.message }
    } catch (error) {
      monitoring.captureError({
        type: 'password',
        message: error.message,
        context: 'change'
      })
      throw error
    }
  }

  async requestPasswordReset(email) {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      return { success: response.ok }
    } catch (error) {
      monitoring.captureError({
        type: 'password',
        message: error.message,
        context: 'reset_request'
      })
      throw error
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/password/reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      })

      return { success: response.ok }
    } catch (error) {
      monitoring.captureError({
        type: 'password',
        message: error.message,
        context: 'reset_confirm'
      })
      throw error
    }
  }

  // Utility Methods
  isAuthenticated() {
    return !!(this.currentUser && this.authToken)
  }

  getCurrentUser() {
    return this.currentUser
  }

  getAuthToken() {
    return this.authToken
  }

  hasRole(role) {
    return this.currentUser?.role === role || this.currentUser?.roles?.includes(role)
  }

  hasPermission(permission) {
    return this.currentUser?.permissions?.includes(permission) || 
           this.currentUser?.role === 'admin'
  }

  getSessionId() {
    return `sess_${this.currentUser?.id}_${this.sessionStartTime}`
  }

  getSessionInfo() {
    if (!this.isAuthenticated()) return null

    return {
      user: this.currentUser,
      sessionStart: this.sessionStartTime,
      lastActivity: this.lastActivity,
      timeRemaining: Math.max(0, this.config.sessionTimeout - (Date.now() - this.lastActivity))
    }
  }

  // API Request Helper
  async authenticatedRequest(url, options = {}) {
    if (!this.authToken) {
      throw new Error('Not authenticated')
    }

    const headers = {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    // Handle token expiry
    if (response.status === 401) {
      try {
        await this.refreshAuthToken()
        // Retry request with new token
        headers.Authorization = `Bearer ${this.authToken}`
        return fetch(url, { ...options, headers })
      } catch (error) {
        this.logout('Authentication expired')
        throw new Error('Authentication expired')
      }
    }

    return response
  }

  log(message, data = {}) {
    console.log(`🔐 Auth: ${message}`, data)
  }

  // Cleanup
  destroy() {
    this.clearSession()
  }
}

// React hooks for authentication
export const useAuth = () => {
  const [user, setUser] = React.useState(authManager.getCurrentUser())
  const [isAuthenticated, setIsAuthenticated] = React.useState(authManager.isAuthenticated())
  const [sessionInfo, setSessionInfo] = React.useState(authManager.getSessionInfo())

  React.useEffect(() => {
    const updateAuthState = () => {
      setUser(authManager.getCurrentUser())
      setIsAuthenticated(authManager.isAuthenticated())
      setSessionInfo(authManager.getSessionInfo())
    }

    // Listen for auth state changes
    const interval = setInterval(updateAuthState, 5000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    user,
    isAuthenticated,
    sessionInfo,
    login: authManager.login.bind(authManager),
    logout: authManager.logout.bind(authManager),
    register: authManager.register.bind(authManager),
    hasRole: authManager.hasRole.bind(authManager),
    hasPermission: authManager.hasPermission.bind(authManager),
    setupMFA: authManager.setupMFA.bind(authManager),
    verifyMFA: authManager.verifyMFA.bind(authManager),
    changePassword: authManager.changePassword.bind(authManager),
    requestPasswordReset: authManager.requestPasswordReset.bind(authManager)
  }
}

// Higher-order component for protected routes
export const withAuth = (WrappedComponent, requiredRole = null, requiredPermission = null) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, user, hasRole, hasPermission } = useAuth()

    if (!isAuthenticated) {
      return <div>Redirecting to login...</div>
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return <div>Access denied - insufficient role</div>
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return <div>Access denied - insufficient permissions</div>
    }

    return React.createElement(WrappedComponent, { ...props, user })
  }
}

// Create singleton instance
const authManager = new AuthManager()

export { authManager }
export default AuthManager