// Role-Based Access Control (RBAC) System
// Comprehensive permission management with roles, permissions, and resource access

import { monitoring } from './monitoring'
import { authManager } from './auth'

// Define system roles and their hierarchies
const ROLES = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Administrator',
    level: 100,
    description: 'Full system access with user management capabilities'
  },
  ADMIN: {
    id: 'admin',
    name: 'Administrator',
    level: 80,
    description: 'Full organization access with team management'
  },
  MANAGER: {
    id: 'manager',
    name: 'Manager',
    level: 60,
    description: 'Team oversight with limited administrative functions'
  },
  ANALYST: {
    id: 'analyst',
    name: 'Analyst',
    level: 40,
    description: 'Advanced data access and analysis capabilities'
  },
  USER: {
    id: 'user',
    name: 'User',
    level: 20,
    description: 'Standard user with basic functionality'
  },
  VIEWER: {
    id: 'viewer',
    name: 'Viewer',
    level: 10,
    description: 'Read-only access to shared resources'
  }
}

// Define system permissions
const PERMISSIONS = {
  // User Management
  'users.create': 'Create new users',
  'users.read': 'View user profiles',
  'users.update': 'Edit user profiles',
  'users.delete': 'Delete users',
  'users.manage_roles': 'Assign/modify user roles',
  
  // Organization Management
  'org.settings': 'Modify organization settings',
  'org.billing': 'Access billing and subscription',
  'org.integrations': 'Manage API integrations',
  'org.audit_logs': 'View audit logs',
  
  // Opportunities
  'opportunities.create': 'Create opportunities',
  'opportunities.read': 'View opportunities',
  'opportunities.update': 'Edit opportunities',
  'opportunities.delete': 'Delete opportunities',
  'opportunities.export': 'Export opportunity data',
  'opportunities.bulk_actions': 'Perform bulk operations',
  
  // Analytics & Reporting
  'analytics.view': 'Access analytics dashboard',
  'analytics.advanced': 'Access advanced analytics',
  'analytics.export': 'Export analytics data',
  'analytics.configure': 'Configure analytics settings',
  
  // Collaboration
  'collaboration.teams': 'Manage teams',
  'collaboration.comments': 'Add comments and notes',
  'collaboration.share': 'Share opportunities',
  'collaboration.workflows': 'Manage approval workflows',
  
  // System
  'system.performance': 'View performance metrics',
  'system.monitoring': 'Access monitoring dashboard',
  'system.settings': 'Modify system settings',
  'system.backup': 'Manage data backups',
  
  // API Access
  'api.read': 'Read-only API access',
  'api.write': 'Read-write API access',
  'api.admin': 'Administrative API access',
}

// Role-Permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN.id]: Object.keys(PERMISSIONS),
  
  [ROLES.ADMIN.id]: [
    'users.create', 'users.read', 'users.update', 'users.manage_roles',
    'org.settings', 'org.billing', 'org.integrations', 'org.audit_logs',
    'opportunities.create', 'opportunities.read', 'opportunities.update', 'opportunities.delete',
    'opportunities.export', 'opportunities.bulk_actions',
    'analytics.view', 'analytics.advanced', 'analytics.export', 'analytics.configure',
    'collaboration.teams', 'collaboration.comments', 'collaboration.share', 'collaboration.workflows',
    'system.performance', 'system.monitoring', 'system.settings',
    'api.read', 'api.write'
  ],
  
  [ROLES.MANAGER.id]: [
    'users.read', 'users.update',
    'org.audit_logs',
    'opportunities.create', 'opportunities.read', 'opportunities.update',
    'opportunities.export', 'opportunities.bulk_actions',
    'analytics.view', 'analytics.advanced', 'analytics.export',
    'collaboration.teams', 'collaboration.comments', 'collaboration.share', 'collaboration.workflows',
    'system.performance',
    'api.read', 'api.write'
  ],
  
  [ROLES.ANALYST.id]: [
    'users.read',
    'opportunities.read', 'opportunities.update', 'opportunities.export',
    'analytics.view', 'analytics.advanced', 'analytics.export',
    'collaboration.comments', 'collaboration.share',
    'api.read'
  ],
  
  [ROLES.USER.id]: [
    'opportunities.create', 'opportunities.read', 'opportunities.update',
    'opportunities.export',
    'analytics.view',
    'collaboration.comments', 'collaboration.share',
    'api.read'
  ],
  
  [ROLES.VIEWER.id]: [
    'opportunities.read',
    'analytics.view',
    'collaboration.comments'
  ]
}

class RBACManager {
  constructor() {
    this.userPermissions = new Map()
    this.roleCache = new Map()
    this.permissionCache = new Map()
    this.auditEnabled = true
    
    this.init()
  }

  init() {
    // Load cached permissions
    this.loadPermissionCache()
    
    // Set up permission monitoring
    this.setupPermissionMonitoring()
  }

  loadPermissionCache() {
    try {
      const cached = localStorage.getItem('rbac_cache')
      if (cached) {
        const data = JSON.parse(cached)
        this.permissionCache = new Map(data.permissions || [])
        this.roleCache = new Map(data.roles || [])
      }
    } catch (error) {
      console.warn('Failed to load RBAC cache:', error)
    }
  }

  savePermissionCache() {
    try {
      const data = {
        permissions: Array.from(this.permissionCache.entries()),
        roles: Array.from(this.roleCache.entries()),
        timestamp: Date.now()
      }
      localStorage.setItem('rbac_cache', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save RBAC cache:', error)
    }
  }

  setupPermissionMonitoring() {
    // Monitor permission checks for analytics
    this.auditPermissionCheck = this.auditPermissionCheck.bind(this)
  }

  // Core Permission Methods
  hasPermission(userId, permission, resource = null) {
    try {
      const user = this.getUser(userId)
      if (!user) return false

      // Super admin bypass
      if (user.role === ROLES.SUPER_ADMIN.id) {
        this.auditPermissionCheck(userId, permission, true, 'super_admin_bypass')
        return true
      }

      // Check direct user permissions
      const userPerms = this.getUserPermissions(userId)
      if (userPerms.includes(permission)) {
        this.auditPermissionCheck(userId, permission, true, 'direct_permission')
        return true
      }

      // Check role-based permissions
      const rolePerms = this.getRolePermissions(user.role)
      if (rolePerms.includes(permission)) {
        this.auditPermissionCheck(userId, permission, true, 'role_permission')
        return true
      }

      // Check resource-specific permissions
      if (resource && this.hasResourcePermission(userId, permission, resource)) {
        this.auditPermissionCheck(userId, permission, true, 'resource_permission')
        return true
      }

      this.auditPermissionCheck(userId, permission, false, 'denied')
      return false
    } catch (error) {
      monitoring.captureError({
        type: 'rbac',
        message: `Permission check failed: ${error.message}`,
        context: { userId, permission, resource }
      })
      return false
    }
  }

  hasRole(userId, roleId) {
    const user = this.getUser(userId)
    if (!user) return false

    // Exact role match
    if (user.role === roleId) return true

    // Check role hierarchy (higher level roles include lower level permissions)
    const userRoleLevel = ROLES[user.role]?.level || 0
    const requiredRoleLevel = ROLES[roleId]?.level || 0
    
    return userRoleLevel >= requiredRoleLevel
  }

  hasAnyRole(userId, roleIds) {
    return roleIds.some(roleId => this.hasRole(userId, roleId))
  }

  hasPermissions(userId, permissions) {
    return permissions.every(permission => this.hasPermission(userId, permission))
  }

  hasAnyPermission(userId, permissions) {
    return permissions.some(permission => this.hasPermission(userId, permission))
  }

  // Resource-specific permissions
  hasResourcePermission(userId, permission, resource) {
    // Check if user owns the resource
    if (resource.ownerId === userId) {
      return this.getResourceOwnerPermissions().includes(permission)
    }

    // Check if user is part of resource team
    if (resource.teamMembers?.includes(userId)) {
      return this.getResourceTeamPermissions().includes(permission)
    }

    // Check organization-level access
    const user = this.getUser(userId)
    if (user && resource.organizationId === user.organizationId) {
      return this.hasPermission(userId, permission)
    }

    return false
  }

  getResourceOwnerPermissions() {
    return [
      'opportunities.read', 'opportunities.update', 'opportunities.delete',
      'collaboration.share', 'collaboration.comments'
    ]
  }

  getResourceTeamPermissions() {
    return [
      'opportunities.read', 'opportunities.update',
      'collaboration.comments'
    ]
  }

  // Permission Management
  grantPermission(userId, permission) {
    if (!this.canModifyPermissions()) {
      throw new Error('Insufficient privileges to modify permissions')
    }

    const userPerms = this.getUserPermissions(userId)
    if (!userPerms.includes(permission)) {
      userPerms.push(permission)
      this.setUserPermissions(userId, userPerms)
      
      monitoring.captureCustomEvent('permission_granted', {
        userId,
        permission,
        grantedBy: authManager.getCurrentUser()?.id
      })
    }
  }

  revokePermission(userId, permission) {
    if (!this.canModifyPermissions()) {
      throw new Error('Insufficient privileges to modify permissions')
    }

    const userPerms = this.getUserPermissions(userId)
    const index = userPerms.indexOf(permission)
    if (index > -1) {
      userPerms.splice(index, 1)
      this.setUserPermissions(userId, userPerms)
      
      monitoring.captureCustomEvent('permission_revoked', {
        userId,
        permission,
        revokedBy: authManager.getCurrentUser()?.id
      })
    }
  }

  assignRole(userId, roleId) {
    if (!this.canModifyRoles()) {
      throw new Error('Insufficient privileges to modify roles')
    }

    if (!ROLES[roleId]) {
      throw new Error(`Invalid role: ${roleId}`)
    }

    const user = this.getUser(userId)
    const oldRole = user?.role

    // Update user role
    this.setUserRole(userId, roleId)
    
    monitoring.captureCustomEvent('role_assigned', {
      userId,
      newRole: roleId,
      oldRole,
      assignedBy: authManager.getCurrentUser()?.id
    })
  }

  // Utility Methods
  getUserPermissions(userId) {
    return this.userPermissions.get(userId) || []
  }

  setUserPermissions(userId, permissions) {
    this.userPermissions.set(userId, permissions)
    this.savePermissionCache()
  }

  getRolePermissions(roleId) {
    return ROLE_PERMISSIONS[roleId] || []
  }

  getAllPermissions(userId) {
    const user = this.getUser(userId)
    if (!user) return []

    const directPerms = this.getUserPermissions(userId)
    const rolePerms = this.getRolePermissions(user.role)
    
    return [...new Set([...directPerms, ...rolePerms])]
  }

  getUser(userId) {
    // In a real implementation, this would fetch from your user store
    const currentUser = authManager.getCurrentUser()
    if (currentUser?.id === userId) {
      return currentUser
    }
    
    // Mock user for demonstration
    return {
      id: userId,
      role: 'user',
      organizationId: 'org_1'
    }
  }

  setUserRole(userId, roleId) {
    // In a real implementation, this would update the user store
    console.log(`Setting role ${roleId} for user ${userId}`)
  }

  canModifyPermissions() {
    const currentUser = authManager.getCurrentUser()
    return currentUser && this.hasPermission(currentUser.id, 'users.manage_roles')
  }

  canModifyRoles() {
    const currentUser = authManager.getCurrentUser()
    return currentUser && this.hasPermission(currentUser.id, 'users.manage_roles')
  }

  // Audit and Monitoring
  auditPermissionCheck(userId, permission, granted, reason) {
    if (!this.auditEnabled) return

    monitoring.captureCustomEvent('permission_check', {
      userId,
      permission,
      granted,
      reason,
      timestamp: Date.now()
    })
  }

  getPermissionAudit(userId, timeRange = 24 * 60 * 60 * 1000) {
    // Return permission check history for user
    // This would integrate with your audit logging system
    return []
  }

  // Role and Permission Info
  getRoles() {
    return Object.values(ROLES)
  }

  getPermissions() {
    return PERMISSIONS
  }

  getRoleInfo(roleId) {
    return ROLES[roleId]
  }

  getPermissionInfo(permission) {
    return PERMISSIONS[permission]
  }

  getUserRole(userId) {
    const user = this.getUser(userId)
    return user?.role
  }

  getUserRoleInfo(userId) {
    const roleId = this.getUserRole(userId)
    return roleId ? this.getRoleInfo(roleId) : null
  }

  // Validation
  isValidRole(roleId) {
    return !!ROLES[roleId]
  }

  isValidPermission(permission) {
    return !!PERMISSIONS[permission]
  }

  // Context-aware permissions
  getContextPermissions(userId, context = {}) {
    const allPerms = this.getAllPermissions(userId)
    
    // Filter permissions based on context
    if (context.resource) {
      return allPerms.filter(perm => 
        this.hasResourcePermission(userId, perm, context.resource)
      )
    }
    
    return allPerms
  }
}

// React hooks for RBAC
export const usePermissions = (permissions = []) => {
  const [hasPerms, setHasPerms] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const checkPermissions = () => {
      const currentUser = authManager.getCurrentUser()
      if (!currentUser) {
        setHasPerms(false)
        setLoading(false)
        return
      }

      const hasAllPerms = Array.isArray(permissions) 
        ? rbacManager.hasPermissions(currentUser.id, permissions)
        : rbacManager.hasPermission(currentUser.id, permissions)
      
      setHasPerms(hasAllPerms)
      setLoading(false)
    }

    checkPermissions()
  }, [permissions])

  return { hasPermissions: hasPerms, loading }
}

export const useRole = (roles = []) => {
  const [hasRole, setHasRole] = React.useState(false)
  const [userRole, setUserRole] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const checkRole = () => {
      const currentUser = authManager.getCurrentUser()
      if (!currentUser) {
        setHasRole(false)
        setUserRole(null)
        setLoading(false)
        return
      }

      const currentRole = rbacManager.getUserRole(currentUser.id)
      setUserRole(currentRole)

      const hasRequiredRole = Array.isArray(roles)
        ? rbacManager.hasAnyRole(currentUser.id, roles)
        : rbacManager.hasRole(currentUser.id, roles)
      
      setHasRole(hasRequiredRole)
      setLoading(false)
    }

    checkRole()
  }, [roles])

  return { hasRole, userRole, loading }
}

// Higher-order component for permission-based rendering
export const withPermissions = (WrappedComponent, requiredPermissions = [], fallback = null) => {
  return function PermissionWrappedComponent(props) {
    const { hasPermissions, loading } = usePermissions(requiredPermissions)

    if (loading) {
      return fallback || <div>Loading...</div>
    }

    if (!hasPermissions) {
      return fallback || <div>Access denied</div>
    }

    return React.createElement(WrappedComponent, props)
  }
}

// Component for conditional rendering based on permissions
export const PermissionGate = ({ permissions, children, fallback = null, requireAll = true }) => {
  const { hasPermissions, loading } = usePermissions(permissions)

  if (loading) {
    return fallback
  }

  const hasAccess = requireAll 
    ? hasPermissions 
    : Array.isArray(permissions) 
      ? permissions.some(perm => rbacManager.hasPermission(authManager.getCurrentUser()?.id, perm))
      : hasPermissions

  return hasAccess ? children : fallback
}

// Create singleton instance
const rbacManager = new RBACManager()

export { rbacManager, ROLES, PERMISSIONS }
export default RBACManager

// Import React for hooks
import React from 'react'