// Secure API Key Management System
// Comprehensive API key lifecycle management with security and monitoring

import { monitoring } from './monitoring'
import { authManager } from './auth'
import { rbacManager } from './rbac'

class APIKeyManager {
  constructor() {
    this.config = {
      apiEndpoint: '/api/keys',
      keyPrefix: 'sk_',
      defaultExpiration: 365 * 24 * 60 * 60 * 1000, // 1 year
      maxKeysPerUser: 10,
      enableKeyRotation: true,
      rotationWarningDays: 30,
      enableUsageTracking: true,
      rateLimitTracking: true
    }
    
    this.keys = new Map()
    this.keyUsage = new Map()
    this.encryptionKey = null
    
    this.init()
  }

  async init() {
    // Initialize encryption for sensitive data
    await this.initializeEncryption()
    
    // Load existing keys
    await this.loadKeys()
    
    // Set up usage monitoring
    this.setupUsageMonitoring()
    
    // Set up key rotation checks
    this.setupRotationMonitoring()
  }

  async initializeEncryption() {
    // In a real implementation, this would use Web Crypto API
    // For now, we'll simulate with a basic encryption setup
    try {
      if (window.crypto && window.crypto.subtle) {
        this.encryptionKey = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        )
      }
    } catch (error) {
      console.warn('Web Crypto API not available, using fallback encryption')
      this.encryptionKey = 'fallback_key_' + Date.now()
    }
  }

  async loadKeys() {
    try {
      const response = await authManager.authenticatedRequest(`${this.config.apiEndpoint}`)
      if (response.ok) {
        const data = await response.json()
        data.keys.forEach(key => {
          this.keys.set(key.id, key)
        })
      }
    } catch (error) {
      console.warn('Failed to load API keys:', error)
    }
  }

  setupUsageMonitoring() {
    if (!this.config.enableUsageTracking) return

    // Monitor API key usage patterns
    setInterval(() => {
      this.analyzeKeyUsage()
    }, 60000) // Check every minute
  }

  setupRotationMonitoring() {
    if (!this.config.enableKeyRotation) return

    // Check for keys needing rotation
    setInterval(() => {
      this.checkKeyRotation()
    }, 24 * 60 * 60 * 1000) // Check daily
  }

  // Key Creation and Management
  async createAPIKey(options = {}) {
    try {
      if (!rbacManager.hasPermission(authManager.getCurrentUser()?.id, 'api.write')) {
        throw new Error('Insufficient permissions to create API keys')
      }

      const userKeys = Array.from(this.keys.values()).filter(
        key => key.userId === authManager.getCurrentUser()?.id
      )

      if (userKeys.length >= this.config.maxKeysPerUser) {
        throw new Error(`Maximum number of API keys (${this.config.maxKeysPerUser}) reached`)
      }

      const keyData = {
        id: this.generateKeyId(),
        name: options.name || 'API Key',
        description: options.description || '',
        userId: authManager.getCurrentUser()?.id,
        organizationId: authManager.getCurrentUser()?.organizationId,
        scopes: options.scopes || ['read'],
        permissions: options.permissions || [],
        expiresAt: options.expiresAt || new Date(Date.now() + this.config.defaultExpiration),
        createdAt: new Date(),
        lastUsed: null,
        isActive: true,
        usageCount: 0,
        rateLimits: options.rateLimits || {
          requestsPerMinute: 100,
          requestsPerHour: 1000,
          requestsPerDay: 10000
        },
        allowedIPs: options.allowedIPs || [],
        allowedDomains: options.allowedDomains || [],
        metadata: options.metadata || {}
      }

      // Generate the actual API key
      const apiKey = this.generateAPIKey()
      keyData.keyPreview = apiKey.substring(0, 8) + '...' + apiKey.substring(-4)
      
      // Encrypt and store the key
      const encryptedKey = await this.encryptAPIKey(apiKey)
      keyData.encryptedKey = encryptedKey

      // Save to backend
      const response = await authManager.authenticatedRequest(`${this.config.apiEndpoint}`, {
        method: 'POST',
        body: JSON.stringify(keyData)
      })

      if (!response.ok) {
        throw new Error('Failed to create API key')
      }

      const savedKey = await response.json()
      this.keys.set(savedKey.id, savedKey)

      // Track creation
      monitoring.captureCustomEvent('api_key_created', {
        keyId: savedKey.id,
        userId: keyData.userId,
        scopes: keyData.scopes,
        permissions: keyData.permissions
      })

      return {
        success: true,
        key: savedKey,
        apiKey // Return the raw key only once
      }
    } catch (error) {
      monitoring.captureError({
        type: 'api_key_management',
        message: error.message,
        context: 'create_key'
      })
      throw error
    }
  }

  async revokeAPIKey(keyId, reason = 'User revoked') {
    try {
      if (!rbacManager.hasPermission(authManager.getCurrentUser()?.id, 'api.write')) {
        throw new Error('Insufficient permissions to revoke API keys')
      }

      const key = this.keys.get(keyId)
      if (!key) {
        throw new Error('API key not found')
      }

      // Check ownership or admin privileges
      const currentUser = authManager.getCurrentUser()
      if (key.userId !== currentUser?.id && !rbacManager.hasRole(currentUser?.id, 'admin')) {
        throw new Error('Insufficient permissions to revoke this API key')
      }

      // Revoke on backend
      const response = await authManager.authenticatedRequest(
        `${this.config.apiEndpoint}/${keyId}/revoke`,
        {
          method: 'POST',
          body: JSON.stringify({ reason })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to revoke API key')
      }

      // Update local state
      key.isActive = false
      key.revokedAt = new Date()
      key.revokedBy = currentUser?.id
      key.revocationReason = reason

      // Track revocation
      monitoring.captureCustomEvent('api_key_revoked', {
        keyId,
        userId: key.userId,
        reason,
        revokedBy: currentUser?.id
      })

      return { success: true }
    } catch (error) {
      monitoring.captureError({
        type: 'api_key_management',
        message: error.message,
        context: 'revoke_key'
      })
      throw error
    }
  }

  async rotateAPIKey(keyId) {
    try {
      const oldKey = this.keys.get(keyId)
      if (!oldKey) {
        throw new Error('API key not found')
      }

      // Create new key with same properties
      const newKeyOptions = {
        name: oldKey.name + ' (Rotated)',
        description: oldKey.description,
        scopes: oldKey.scopes,
        permissions: oldKey.permissions,
        rateLimits: oldKey.rateLimits,
        allowedIPs: oldKey.allowedIPs,
        allowedDomains: oldKey.allowedDomains,
        metadata: { ...oldKey.metadata, rotatedFrom: keyId }
      }

      const newKey = await this.createAPIKey(newKeyOptions)
      
      if (newKey.success) {
        // Mark old key for deprecation (don't revoke immediately)
        oldKey.isDeprecated = true
        oldKey.deprecatedAt = new Date()
        oldKey.replacedBy = newKey.key.id
        
        monitoring.captureCustomEvent('api_key_rotated', {
          oldKeyId: keyId,
          newKeyId: newKey.key.id,
          userId: oldKey.userId
        })

        return {
          success: true,
          oldKey: oldKey,
          newKey: newKey.key,
          newApiKey: newKey.apiKey
        }
      }

      throw new Error('Failed to create rotated key')
    } catch (error) {
      monitoring.captureError({
        type: 'api_key_management',
        message: error.message,
        context: 'rotate_key'
      })
      throw error
    }
  }

  // Key Validation and Usage
  async validateAPIKey(apiKey, request = {}) {
    try {
      // Find key by comparing with encrypted versions
      let keyRecord = null
      for (const [keyId, key] of this.keys) {
        if (await this.compareAPIKey(apiKey, key.encryptedKey)) {
          keyRecord = key
          break
        }
      }

      if (!keyRecord || !keyRecord.isActive) {
        return { valid: false, reason: 'Invalid or inactive API key' }
      }

      // Check expiration
      if (keyRecord.expiresAt && new Date() > new Date(keyRecord.expiresAt)) {
        return { valid: false, reason: 'API key expired' }
      }

      // Check IP restrictions
      if (keyRecord.allowedIPs.length > 0 && request.ip) {
        if (!keyRecord.allowedIPs.includes(request.ip)) {
          return { valid: false, reason: 'IP address not allowed' }
        }
      }

      // Check domain restrictions
      if (keyRecord.allowedDomains.length > 0 && request.origin) {
        const domain = new URL(request.origin).hostname
        if (!keyRecord.allowedDomains.some(allowed => domain.endsWith(allowed))) {
          return { valid: false, reason: 'Domain not allowed' }
        }
      }

      // Check rate limits
      const rateLimitCheck = this.checkRateLimit(keyRecord.id, keyRecord.rateLimits)
      if (!rateLimitCheck.allowed) {
        return { 
          valid: false, 
          reason: 'Rate limit exceeded',
          rateLimitInfo: rateLimitCheck
        }
      }

      // Update usage statistics
      this.trackKeyUsage(keyRecord.id, request)

      return {
        valid: true,
        key: keyRecord,
        rateLimitInfo: rateLimitCheck
      }
    } catch (error) {
      monitoring.captureError({
        type: 'api_key_validation',
        message: error.message,
        context: { hasKey: !!apiKey }
      })
      return { valid: false, reason: 'Validation error' }
    }
  }

  checkRateLimit(keyId, limits) {
    if (!this.config.rateLimitTracking) {
      return { allowed: true }
    }

    const usage = this.keyUsage.get(keyId) || { requests: [] }
    const now = Date.now()
    
    // Clean old requests
    usage.requests = usage.requests.filter(timestamp => now - timestamp < 24 * 60 * 60 * 1000)

    // Check limits
    const minuteRequests = usage.requests.filter(timestamp => now - timestamp < 60 * 1000)
    const hourRequests = usage.requests.filter(timestamp => now - timestamp < 60 * 60 * 1000)
    const dayRequests = usage.requests

    const checks = {
      minute: { count: minuteRequests.length, limit: limits.requestsPerMinute },
      hour: { count: hourRequests.length, limit: limits.requestsPerHour },
      day: { count: dayRequests.length, limit: limits.requestsPerDay }
    }

    for (const [period, check] of Object.entries(checks)) {
      if (check.count >= check.limit) {
        return {
          allowed: false,
          period,
          current: check.count,
          limit: check.limit,
          resetTime: this.calculateResetTime(period)
        }
      }
    }

    return {
      allowed: true,
      remaining: {
        minute: limits.requestsPerMinute - checks.minute.count,
        hour: limits.requestsPerHour - checks.hour.count,
        day: limits.requestsPerDay - checks.day.count
      }
    }
  }

  trackKeyUsage(keyId, request) {
    const key = this.keys.get(keyId)
    if (key) {
      key.lastUsed = new Date()
      key.usageCount = (key.usageCount || 0) + 1
    }

    const usage = this.keyUsage.get(keyId) || { requests: [] }
    usage.requests.push(Date.now())
    this.keyUsage.set(keyId, usage)

    // Track usage event
    monitoring.captureCustomEvent('api_key_used', {
      keyId,
      userId: key?.userId,
      endpoint: request.endpoint,
      method: request.method,
      timestamp: Date.now()
    })
  }

  // Security and Monitoring
  analyzeKeyUsage() {
    for (const [keyId, key] of this.keys) {
      if (!key.isActive) continue

      const usage = this.keyUsage.get(keyId)
      if (!usage) continue

      // Detect unusual usage patterns
      const recentRequests = usage.requests.filter(
        timestamp => Date.now() - timestamp < 60 * 60 * 1000 // Last hour
      )

      if (recentRequests.length > key.rateLimits.requestsPerHour * 0.8) {
        monitoring.captureCustomEvent('api_key_high_usage', {
          keyId,
          userId: key.userId,
          requestCount: recentRequests.length,
          limit: key.rateLimits.requestsPerHour
        })
      }

      // Check for suspicious patterns (e.g., sudden spikes)
      if (this.detectSuspiciousActivity(keyId, usage)) {
        monitoring.captureCustomEvent('api_key_suspicious_activity', {
          keyId,
          userId: key.userId,
          pattern: 'unusual_spike'
        })
      }
    }
  }

  checkKeyRotation() {
    const warningThreshold = Date.now() - (this.config.rotationWarningDays * 24 * 60 * 60 * 1000)

    for (const [keyId, key] of this.keys) {
      if (!key.isActive || key.isDeprecated) continue

      if (new Date(key.createdAt).getTime() < warningThreshold) {
        monitoring.captureCustomEvent('api_key_rotation_warning', {
          keyId,
          userId: key.userId,
          ageInDays: Math.floor((Date.now() - new Date(key.createdAt).getTime()) / (24 * 60 * 60 * 1000))
        })
      }

      // Auto-rotate if very old (configurable)
      const autoRotateThreshold = Date.now() - (365 * 24 * 60 * 60 * 1000) // 1 year
      if (new Date(key.createdAt).getTime() < autoRotateThreshold) {
        this.scheduleAutoRotation(keyId)
      }
    }
  }

  detectSuspiciousActivity(keyId, usage) {
    const requests = usage.requests
    if (requests.length < 10) return false

    // Calculate request rate variations
    const intervals = []
    for (let i = 1; i < requests.length; i++) {
      intervals.push(requests[i] - requests[i - 1])
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variations = intervals.map(interval => Math.abs(interval - avgInterval))
    const avgVariation = variations.reduce((a, b) => a + b, 0) / variations.length

    // If variations are very high, it might indicate automated/scripted usage
    return avgVariation > avgInterval * 2
  }

  async scheduleAutoRotation(keyId) {
    // In a real implementation, this would queue the rotation for user approval
    monitoring.captureCustomEvent('api_key_auto_rotation_scheduled', {
      keyId,
      scheduledFor: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days notice
    })
  }

  // Utility Methods
  generateKeyId() {
    return 'key_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  generateAPIKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = this.config.keyPrefix
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  async encryptAPIKey(apiKey) {
    // In a real implementation, use proper encryption
    if (this.encryptionKey && window.crypto?.subtle) {
      try {
        const encoder = new TextEncoder()
        const data = encoder.encode(apiKey)
        const iv = window.crypto.getRandomValues(new Uint8Array(12))
        
        const encrypted = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          this.encryptionKey,
          data
        )
        
        return {
          data: Array.from(new Uint8Array(encrypted)),
          iv: Array.from(iv)
        }
      } catch (error) {
        console.warn('Encryption failed, using fallback')
      }
    }
    
    // Fallback: base64 encoding (not secure, for demo only)
    return btoa(apiKey)
  }

  async compareAPIKey(apiKey, encryptedKey) {
    // In a real implementation, decrypt and compare
    if (typeof encryptedKey === 'object' && this.encryptionKey && window.crypto?.subtle) {
      try {
        const decrypted = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: new Uint8Array(encryptedKey.iv) },
          this.encryptionKey,
          new Uint8Array(encryptedKey.data)
        )
        
        const decoder = new TextDecoder()
        const decryptedKey = decoder.decode(decrypted)
        return decryptedKey === apiKey
      } catch (error) {
        return false
      }
    }
    
    // Fallback comparison
    return atob(encryptedKey) === apiKey
  }

  calculateResetTime(period) {
    const now = new Date()
    switch (period) {
      case 'minute':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                       now.getHours(), now.getMinutes() + 1, 0, 0)
      case 'hour':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                       now.getHours() + 1, 0, 0, 0)
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
      default:
        return new Date(now.getTime() + 60000) // 1 minute default
    }
  }

  // Public API
  getUserKeys(userId = null) {
    const targetUserId = userId || authManager.getCurrentUser()?.id
    return Array.from(this.keys.values()).filter(key => key.userId === targetUserId)
  }

  getKeyById(keyId) {
    return this.keys.get(keyId)
  }

  getKeyUsageStats(keyId) {
    const usage = this.keyUsage.get(keyId)
    if (!usage) return null

    const now = Date.now()
    const requests = usage.requests

    return {
      total: requests.length,
      lastHour: requests.filter(t => now - t < 60 * 60 * 1000).length,
      lastDay: requests.filter(t => now - t < 24 * 60 * 60 * 1000).length,
      lastWeek: requests.filter(t => now - t < 7 * 24 * 60 * 60 * 1000).length
    }
  }

  async updateKeyMetadata(keyId, metadata) {
    const key = this.keys.get(keyId)
    if (!key) throw new Error('Key not found')

    key.metadata = { ...key.metadata, ...metadata }
    
    // Update on backend
    await authManager.authenticatedRequest(`${this.config.apiEndpoint}/${keyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ metadata: key.metadata })
    })

    return key
  }
}

// React hooks for API key management
export const useAPIKeys = () => {
  const [keys, setKeys] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadKeys = () => {
      const userKeys = apiKeyManager.getUserKeys()
      setKeys(userKeys)
      setLoading(false)
    }

    loadKeys()
    const interval = setInterval(loadKeys, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  return {
    keys,
    loading,
    createKey: apiKeyManager.createAPIKey.bind(apiKeyManager),
    revokeKey: apiKeyManager.revokeAPIKey.bind(apiKeyManager),
    rotateKey: apiKeyManager.rotateAPIKey.bind(apiKeyManager),
    getUsageStats: apiKeyManager.getKeyUsageStats.bind(apiKeyManager)
  }
}

// Create singleton instance
const apiKeyManager = new APIKeyManager()

export { apiKeyManager }
export default APIKeyManager

// Import React for hooks
import React from 'react'