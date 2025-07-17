import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Database,
  Mail,
  Key,
  Save,
  RefreshCw,
  Trash2,
  Plus,
} from 'lucide-react'

export function Settings() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    systemUpdates: true,
    failureAlerts: true,
  })

  const [systemSettings, setSystemSettings] = useState({
    autoReconciliation: true,
    retryAttempts: '3',
    gracePeriod: '5',
    batchSize: '1000',
  })

  const apiKeys = [
    {
      id: 'key-001',
      name: 'Investec API Key',
      service: 'Investec Bank',
      created: '2024-01-10',
      lastUsed: '2024-01-15',
      status: 'active',
    },
    {
      id: 'key-002',
      name: 'Grail PAS API',
      service: 'Grail System',
      created: '2024-01-08',
      lastUsed: '2024-01-15',
      status: 'active',
    },
    {
      id: 'key-003',
      name: 'Root PAS Integration',
      service: 'Root System',
      created: '2024-01-05',
      lastUsed: '2024-01-14',
      status: 'active',
    },
  ]

  const userRoles = [
    {
      id: 'role-001',
      name: 'Administrator',
      users: 2,
      permissions: ['Full Access', 'User Management', 'System Config'],
    },
    {
      id: 'role-002',
      name: 'Collection Manager',
      users: 5,
      permissions: ['Collections', 'Reports', 'Reconciliation'],
    },
    {
      id: 'role-003',
      name: 'Viewer',
      users: 8,
      permissions: ['View Reports', 'View Collections'],
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600">System configuration and preferences</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => alert('Backing up system configuration...')}
          >
            <Database className="h-4 w-4" />
            Backup Config
          </Button>
          <Button 
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => alert('All settings saved successfully!')}
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="retry-attempts">Retry Attempts</Label>
                  <Select value={systemSettings.retryAttempts} onValueChange={(value) => 
                    setSystemSettings(prev => ({ ...prev, retryAttempts: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 attempt</SelectItem>
                      <SelectItem value="2">2 attempts</SelectItem>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grace-period">Grace Period (days)</Label>
                  <Input
                    id="grace-period"
                    value={systemSettings.gracePeriod}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, gracePeriod: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-size">Batch Processing Size</Label>
                  <Input
                    id="batch-size"
                    value={systemSettings.batchSize}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, batchSize: e.target.value }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-reconciliation">Auto Reconciliation</Label>
                  <Switch
                    id="auto-reconciliation"
                    checked={systemSettings.autoReconciliation}
                    onCheckedChange={(checked) => 
                      setSystemSettings(prev => ({ ...prev, autoReconciliation: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="connection-timeout">Connection Timeout (seconds)</Label>
                  <Input id="connection-timeout" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="query-timeout">Query Timeout (seconds)</Label>
                  <Input id="query-timeout" defaultValue="60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-schedule">Backup Schedule</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => alert('Running database maintenance... This may take several minutes.')}
                >
                  <RefreshCw className="h-4 w-4" />
                  Run Maintenance
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-alerts">Email Alerts</Label>
                    <p className="text-sm text-slate-500">Receive email notifications for important events</p>
                  </div>
                  <Switch
                    id="email-alerts"
                    checked={notifications.emailAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, emailAlerts: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-alerts">SMS Alerts</Label>
                    <p className="text-sm text-slate-500">Receive SMS notifications for critical failures</p>
                  </div>
                  <Switch
                    id="sms-alerts"
                    checked={notifications.smsAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, smsAlerts: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="system-updates">System Updates</Label>
                    <p className="text-sm text-slate-500">Get notified about system updates and maintenance</p>
                  </div>
                  <Switch
                    id="system-updates"
                    checked={notifications.systemUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, systemUpdates: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="failure-alerts">Failure Alerts</Label>
                    <p className="text-sm text-slate-500">Immediate alerts for collection failures</p>
                  </div>
                  <Switch
                    id="failure-alerts"
                    checked={notifications.failureAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, failureAlerts: checked }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-slate-900">Email Configuration</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-server">SMTP Server</Label>
                    <Input id="smtp-server" placeholder="smtp.example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Port</Label>
                    <Input id="smtp-port" placeholder="587" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-username">Username</Label>
                    <Input id="smtp-username" placeholder="notifications@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">Password</Label>
                    <Input id="smtp-password" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => alert('Sending test email... Check your inbox.')}
                >
                  <Mail className="h-4 w-4" />
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-policy">Password Policy</Label>
                  <Textarea
                    id="password-policy"
                    placeholder="Define password requirements..."
                    defaultValue="Minimum 8 characters, must include uppercase, lowercase, numbers, and special characters"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                    <p className="text-sm text-slate-500">Require 2FA for all users</p>
                  </div>
                  <Switch id="two-factor" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="audit-logging">Audit Logging</Label>
                    <p className="text-sm text-slate-500">Log all user actions and system events</p>
                  </div>
                  <Switch id="audit-logging" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys & Integrations
                </CardTitle>
                <Button 
                  className="gap-2"
                  onClick={() => alert('Creating new API key... Please configure the integration details.')}
                >
                  <Plus className="h-4 w-4" />
                  Add API Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>{key.service}</TableCell>
                      <TableCell>{key.created}</TableCell>
                      <TableCell>{key.lastUsed}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {key.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => alert(`Regenerating API key for ${key.name}...`)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => alert(`Are you sure you want to delete the API key for ${key.name}? This action cannot be undone.`)}
                          >
                            <Trash2 className="h-3 w-3" />
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

        <TabsContent value="users" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Roles & Permissions
                </CardTitle>
                <Button 
                  className="gap-2"
                  onClick={() => alert('Creating new user role... Please define the permissions.')}
                >
                  <Plus className="h-4 w-4" />
                  Add Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.users}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => alert(`Editing role: ${role.name}`)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => alert(`Are you sure you want to delete the role "${role.name}"? This will affect ${role.users} users.`)}
                          >
                            Delete
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
      </Tabs>
    </div>
  )
}