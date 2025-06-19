import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  Crown,
  AlertTriangle,
  Settings,
  Mail,
  Phone,
  Calendar,
  Activity
} from 'lucide-react'
import { usePermissions, useRole, rbacManager, ROLES, PERMISSIONS } from '@/lib/rbac'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const UserManagementPage = () => {
  const { user: currentUser } = useAuth()
  const { hasPermissions } = usePermissions(['users.read', 'users.manage_roles'])
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [error, setError] = useState('')

  // Mock users data - in real app, this would come from API
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockUsers = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
          phone: '+1 (555) 123-4567',
          role: 'admin',
          status: 'active',
          lastLogin: new Date('2024-01-15T10:30:00Z'),
          createdAt: new Date('2023-06-01T09:00:00Z'),
          organizationId: 'org_1',
          mfaEnabled: true,
          permissions: []
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@company.com',
          phone: '+1 (555) 234-5678',
          role: 'manager',
          status: 'active',
          lastLogin: new Date('2024-01-14T16:45:00Z'),
          createdAt: new Date('2023-07-15T14:30:00Z'),
          organizationId: 'org_1',
          mfaEnabled: true,
          permissions: ['opportunities.export']
        },
        {
          id: '3',
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob.johnson@company.com',
          phone: '+1 (555) 345-6789',
          role: 'user',
          status: 'inactive',
          lastLogin: new Date('2024-01-10T11:20:00Z'),
          createdAt: new Date('2023-08-20T16:00:00Z'),
          organizationId: 'org_1',
          mfaEnabled: false,
          permissions: []
        }
      ]
      
      setUsers(mockUsers)
      setFilteredUsers(mockUsers)
    } catch (error) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search and role
  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, selectedRole])

  const handleRoleChange = async (userId, newRole) => {
    try {
      rbacManager.assignRole(userId, newRole)
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
      
      setShowRoleDialog(false)
      setSelectedUser(null)
    } catch (error) {
      setError(error.message)
    }
  }

  const handleUserStatusToggle = async (userId) => {
    try {
      const user = users.find(u => u.id === userId)
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: newStatus } : u
      ))
    } catch (error) {
      setError('Failed to update user status')
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return <Crown className="w-4 h-4 text-purple-600" />
      case 'manager':
        return <Shield className="w-4 h-4 text-blue-600" />
      case 'analyst':
        return <Activity className="w-4 h-4 text-green-600" />
      default:
        return <Users className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'analyst':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'user':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'viewer':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const UserDialog = () => (
    <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {selectedUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogDescription>
            {selectedUser ? 'Modify user details and permissions' : 'Create a new user account'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User form would go here */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input placeholder="John" />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input placeholder="Doe" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="john.doe@company.com" />
          </div>
          
          <div className="space-y-2">
            <Label>Role</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ROLES).map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(role.id)}
                      <span>{role.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowUserDialog(false)}>
            Cancel
          </Button>
          <Button>
            {selectedUser ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const RoleDialog = () => (
    <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Select a new role for {selectedUser?.firstName} {selectedUser?.lastName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className="flex items-center space-x-2">
              {selectedUser && getRoleIcon(selectedUser.role)}
              <Badge className={selectedUser ? getRoleBadgeColor(selectedUser.role) : ''}>
                {selectedUser && ROLES[selectedUser.role]?.name}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>New Role</Label>
            <Select onValueChange={(value) => setSelectedUser(prev => ({ ...prev, newRole: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select new role" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ROLES).map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(role.id)}
                      <div>
                        <div className="font-medium">{role.name}</div>
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleRoleChange(selectedUser.id, selectedUser.newRole)}
            disabled={!selectedUser?.newRole}
          >
            Change Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (!hasPermissions) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access user management.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions for your organization
          </p>
        </div>
        <Button onClick={() => setShowUserDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {Object.values(ROLES).map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>MFA</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          <div className="flex items-center space-x-1">
                            {getRoleIcon(user.role)}
                            <span>{ROLES[user.role]?.name}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.mfaEnabled ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.lastLogin.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.lastLogin.toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowRoleDialog(true)
                            }}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserStatusToggle(user.id)}
                          >
                            {user.status === 'active' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(ROLES).map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getRoleIcon(role.id)}
                    <span>{role.name}</span>
                  </CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Permissions</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {rbacManager.getRolePermissions(role.id).map((permission) => (
                        <div key={permission} className="text-xs bg-muted px-2 py-1 rounded">
                          {PERMISSIONS[permission] || permission}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {users.filter(u => u.role === role.id).length} users
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>
                Recent user management activities and permission changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Audit log integration would be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <UserDialog />
      <RoleDialog />
    </div>
  )
}

export default UserManagementPage