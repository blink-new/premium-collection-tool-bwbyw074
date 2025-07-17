import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Search,
  RefreshCw,
  Download,
  Upload,
  DollarSign,
  FileText,
  Clock,
} from 'lucide-react'

export function Reconciliation() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const reconciliationData = [
    {
      id: 'REC-001',
      date: '2024-01-15',
      debitOrderId: 'DO-2024-001',
      bankReference: 'INV240115001',
      policyNumber: 'POL-12345',
      clientName: 'John Smith',
      expectedAmount: 'R 2,450.00',
      actualAmount: 'R 2,450.00',
      status: 'matched',
      variance: 'R 0.00',
    },
    {
      id: 'REC-002',
      date: '2024-01-15',
      debitOrderId: 'DO-2024-001',
      bankReference: 'INV240115002',
      policyNumber: 'POL-12346',
      clientName: 'Sarah Johnson',
      expectedAmount: 'R 1,890.00',
      actualAmount: 'R 0.00',
      status: 'failed',
      variance: 'R -1,890.00',
    },
    {
      id: 'REC-003',
      date: '2024-01-15',
      debitOrderId: 'DO-2024-001',
      bankReference: 'INV240115003',
      policyNumber: 'POL-12347',
      clientName: 'Mike Wilson',
      expectedAmount: 'R 3,200.00',
      actualAmount: 'R 3,150.00',
      status: 'variance',
      variance: 'R -50.00',
    },
    {
      id: 'REC-004',
      date: '2024-01-15',
      debitOrderId: 'DO-2024-001',
      bankReference: 'INV240115004',
      policyNumber: 'POL-12348',
      clientName: 'Emma Davis',
      expectedAmount: 'R 1,750.00',
      actualAmount: 'R 1,750.00',
      status: 'matched',
      variance: 'R 0.00',
    },
  ]

  const summaryStats = [
    {
      title: 'Total Processed',
      value: 'R 2,847,392',
      icon: DollarSign,
      color: 'text-blue-600',
    },
    {
      title: 'Matched Records',
      value: '1,198',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Failed Collections',
      value: '23',
      icon: XCircle,
      color: 'text-red-600',
    },
    {
      title: 'Variances',
      value: '26',
      icon: AlertTriangle,
      color: 'text-yellow-600',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Matched</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case 'variance':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertTriangle className="h-3 w-3 mr-1" />Variance</Badge>
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reconciliation</h1>
          <p className="text-slate-600">Real-time reconciliation and payment matching</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => alert('Uploading bank statement for reconciliation...')}
          >
            <Upload className="h-4 w-4" />
            Upload Statement
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => alert('Exporting reconciliation report...')}
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button 
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => alert('Running auto-reconciliation process... This may take a few minutes.')}
          >
            <RefreshCw className="h-4 w-4" />
            Auto Reconcile
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <Card key={stat.title} className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by policy, client, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="variance">Variance</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Reconciliation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Policy</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliationData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.id}</TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.policyNumber}</TableCell>
                  <TableCell>{record.clientName}</TableCell>
                  <TableCell className="font-medium">{record.expectedAmount}</TableCell>
                  <TableCell className="font-medium">{record.actualAmount}</TableCell>
                  <TableCell className={`font-medium ${
                    record.variance === 'R 0.00' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {record.variance}
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => alert(`Viewing details for ${record.id}:\n\nBank Reference: ${record.bankReference}\nDebit Order: ${record.debitOrderId}\nExpected: ${record.expectedAmount}\nActual: ${record.actualAmount}\nVariance: ${record.variance}`)}
                      >
                        View
                      </Button>
                      {record.status === 'variance' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => alert(`Resolving variance for ${record.id}... Manual review required.`)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}