import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Activity,
  Database,
  Wifi,
  WifiOff,
} from 'lucide-react'

export function PASIntegrations() {
  const integrations = [
    {
      id: 'grail',
      name: 'Grail PAS',
      type: 'REST API',
      status: 'connected',
      lastSync: '2024-01-15 10:30',
      policies: 847,
      syncProgress: 100,
      version: 'v2.1',
      endpoint: 'https://api.grail.com/v2',
    },
    {
      id: 'root',
      name: 'Root PAS',
      type: 'JSON API',
      status: 'syncing',
      lastSync: '2024-01-15 10:25',
      policies: 234,
      syncProgress: 65,
      version: 'v1.8',
      endpoint: 'https://root-api.com/v1',
    },
    {
      id: 'genesys',
      name: 'Genesys Skyy',
      type: 'SOAP',
      status: 'connected',
      lastSync: '2024-01-15 10:28',
      policies: 156,
      syncProgress: 100,
      version: 'v3.0',
      endpoint: 'https://skyy.genesys.com/soap',
    },
    {
      id: 'owl',
      name: 'Owl PAS',
      type: 'Legacy',
      status: 'error',
      lastSync: '2024-01-15 09:45',
      policies: 89,
      syncProgress: 0,
      version: 'v1.2',
      endpoint: 'https://owl-legacy.com/api',
    },
  ]

  const syncHistory = [
    {
      id: 'SYNC-001',
      system: 'Grail PAS',
      type: 'Full Sync',
      status: 'completed',
      records: 847,
      duration: '2m 34s',
      timestamp: '2024-01-15 10:30',
    },
    {
      id: 'SYNC-002',
      system: 'Root PAS',
      type: 'Incremental',
      status: 'in_progress',
      records: 234,
      duration: '1m 45s',
      timestamp: '2024-01-15 10:25',
    },
    {
      id: 'SYNC-003',
      system: 'Genesys Skyy',
      type: 'Full Sync',
      status: 'completed',
      records: 156,
      duration: '1m 12s',
      timestamp: '2024-01-15 10:28',
    },
    {
      id: 'SYNC-004',
      system: 'Owl PAS',
      type: 'Full Sync',
      status: 'failed',
      records: 0,
      duration: '0s',
      timestamp: '2024-01-15 09:45',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>
      case 'syncing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Syncing</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Error</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />In Progress</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getConnectionIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-5 w-5 text-green-600" />
      case 'syncing':
        return <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
      case 'error':
        return <WifiOff className="h-5 w-5 text-red-600" />
      default:
        return <WifiOff className="h-5 w-5 text-slate-400" />
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">PAS Integrations</h1>
          <p className="text-slate-600">Manage connections to Policy Administration Systems</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => alert('Opening PAS integration configuration...')}
          >
            <Settings className="h-4 w-4" />
            Configure
          </Button>
          <Button 
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => alert('Initiating sync for all PAS systems... This may take several minutes.')}
          >
            <RefreshCw className="h-4 w-4" />
            Sync All
          </Button>
        </div>
      </div>

      {/* Integration Status Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {integrations.map((integration) => (
          <Card key={integration.id} className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-900">
                  {integration.name}
                </CardTitle>
                {getConnectionIcon(integration.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Status</span>
                {getStatusBadge(integration.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Policies</span>
                <span className="font-medium">{integration.policies.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Type</span>
                <Badge variant="outline">{integration.type}</Badge>
              </div>
              {integration.status === 'syncing' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-medium">{integration.syncProgress}%</span>
                  </div>
                  <Progress value={integration.syncProgress} className="h-2" />
                </div>
              )}
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    if (integration.status === 'error') {
                      alert(`Retrying connection to ${integration.name}...`)
                    } else {
                      alert(`${integration.name} Details:\n\nEndpoint: ${integration.endpoint}\nVersion: ${integration.version}\nPolicies: ${integration.policies}\nLast Sync: ${integration.lastSync}\nStatus: ${integration.status}`)
                    }
                  }}
                >
                  {integration.status === 'error' ? 'Retry Connection' : 'View Details'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Details */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Integration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>System</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Policies</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integrations.map((integration) => (
                <TableRow key={integration.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getConnectionIcon(integration.status)}
                      <div>
                        <div className="font-medium">{integration.name}</div>
                        <div className="text-sm text-slate-500">{integration.type}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{integration.endpoint}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{integration.version}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{integration.lastSync}</TableCell>
                  <TableCell className="font-medium">{integration.policies.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(integration.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => alert(`Syncing ${integration.name}... This may take a few minutes.`)}
                      >
                        <RefreshCw className="h-3 w-3" />
                        Sync
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => alert(`Opening configuration for ${integration.name}...`)}
                      >
                        <Settings className="h-3 w-3" />
                        Config
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sync ID</TableHead>
                <TableHead>System</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncHistory.map((sync) => (
                <TableRow key={sync.id}>
                  <TableCell className="font-medium">{sync.id}</TableCell>
                  <TableCell>{sync.system}</TableCell>
                  <TableCell>
                    <Badge variant={sync.type === 'Full Sync' ? 'default' : 'secondary'}>
                      {sync.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{sync.records.toLocaleString()}</TableCell>
                  <TableCell>{sync.duration}</TableCell>
                  <TableCell>{getStatusBadge(sync.status)}</TableCell>
                  <TableCell className="text-slate-500">{sync.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}