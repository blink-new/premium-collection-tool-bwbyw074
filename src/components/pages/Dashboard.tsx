import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Users,
  FileText,
  Activity,
} from 'lucide-react'

export function Dashboard() {
  const stats = [
    {
      title: 'Total Collections',
      value: 'R 2,847,392',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'Active Policies',
      value: '1,247',
      change: '+3.2%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Pending Debits',
      value: '89',
      change: '-8.1%',
      trend: 'down',
      icon: Clock,
    },
    {
      title: 'Success Rate',
      value: '94.2%',
      change: '+1.8%',
      trend: 'up',
      icon: Activity,
    },
  ]

  const recentCollections = [
    {
      id: 'COL-001',
      policy: 'POL-12345',
      amount: 'R 2,450.00',
      status: 'successful',
      date: '2024-01-15',
      client: 'John Smith',
    },
    {
      id: 'COL-002',
      policy: 'POL-12346',
      amount: 'R 1,890.00',
      status: 'failed',
      date: '2024-01-15',
      client: 'Sarah Johnson',
    },
    {
      id: 'COL-003',
      policy: 'POL-12347',
      amount: 'R 3,200.00',
      status: 'pending',
      date: '2024-01-15',
      client: 'Mike Wilson',
    },
    {
      id: 'COL-004',
      policy: 'POL-12348',
      amount: 'R 1,750.00',
      status: 'successful',
      date: '2024-01-14',
      client: 'Emma Davis',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'successful':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Successful</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Overview of your premium collection system</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => alert('Report generation feature coming soon!')}
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
          <Button 
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => alert('Collection run initiated! Check the Collections tab for status.')}
          >
            <Activity className="h-4 w-4" />
            Run Collection
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs">
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>
                <span className="text-slate-500">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Investec Integration</span>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Grail PAS</span>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Root PAS</span>
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Syncing
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Genesys Skyy</span>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => alert('Debit order file generation started! Check the Debit Orders tab for progress.')}
            >
              <FileText className="h-4 w-4" />
              Generate Debit Order File
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => alert('Ad-hoc collection initiated! Requires approval before processing.')}
            >
              <Activity className="h-4 w-4" />
              Run Ad-Hoc Collection
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => alert('Reconciliation process started! Check the Reconciliation tab for details.')}
            >
              <CheckCircle className="h-4 w-4" />
              Process Reconciliation
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => alert('PAS data sync initiated! Check PAS Integrations for sync status.')}
            >
              <Users className="h-4 w-4" />
              Sync PAS Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Collections */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collection ID</TableHead>
                <TableHead>Policy</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCollections.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell className="font-medium">{collection.id}</TableCell>
                  <TableCell>{collection.policy}</TableCell>
                  <TableCell>{collection.client}</TableCell>
                  <TableCell className="font-medium">{collection.amount}</TableCell>
                  <TableCell>{getStatusBadge(collection.status)}</TableCell>
                  <TableCell className="text-slate-500">{collection.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}