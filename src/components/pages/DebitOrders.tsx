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
  FileText,
  Upload,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react'

export function DebitOrders() {
  const debitOrderFiles = [
    {
      id: 'DO-2024-001',
      filename: 'investec_debit_20240115.csv',
      type: 'Recurring',
      records: 1247,
      amount: 'R 2,847,392.00',
      status: 'submitted',
      submittedAt: '2024-01-15 09:30',
      processedAt: '2024-01-15 10:45',
    },
    {
      id: 'DO-2024-002',
      filename: 'investec_adhoc_20240114.csv',
      type: 'Ad-hoc',
      records: 23,
      amount: 'R 45,670.00',
      status: 'processing',
      submittedAt: '2024-01-14 14:20',
      processedAt: null,
    },
    {
      id: 'DO-2024-003',
      filename: 'investec_debit_20240113.csv',
      type: 'Recurring',
      records: 1198,
      amount: 'R 2,756,890.00',
      status: 'completed',
      submittedAt: '2024-01-13 09:15',
      processedAt: '2024-01-13 11:30',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock className="h-3 w-3 mr-1" />Processing</Badge>
      case 'submitted':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Upload className="h-3 w-3 mr-1" />Submitted</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Debit Orders</h1>
          <p className="text-slate-600">Manage Investec debit order file generation and submission</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => alert('Downloading debit order template...')}
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          <Button 
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => alert('Generating new debit order file... This may take a few minutes.')}
          >
            <FileText className="h-4 w-4" />
            Generate File
          </Button>
        </div>
      </div>

      {/* File Generation Status */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Next Recurring Run</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">Feb 1, 2024</div>
            <div className="text-sm text-slate-500">09:00 AM</div>
            <div className="mt-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-slate-600">Estimated 1,250 records</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Processing Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">2</div>
            <div className="text-sm text-slate-500">Files pending</div>
            <div className="mt-3">
              <Progress value={65} className="h-2" />
              <div className="text-xs text-slate-500 mt-1">65% complete</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">98.2%</div>
            <div className="text-sm text-slate-500">Last 30 days</div>
            <div className="mt-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-slate-600">2,847 successful</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Generation Panel */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Generate New Debit Order File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-medium text-slate-900">Recurring Collection</h3>
              <p className="text-sm text-slate-600">Generate monthly/quarterly premium collections</p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FileText className="h-4 w-4" />
                <span>~1,250 policies ready</span>
              </div>
              <Button 
                className="w-full"
                onClick={() => alert('Generating recurring collection file for 1,250 policies...')}
              >
                Generate Recurring File
              </Button>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-slate-900">Ad-hoc Collection</h3>
              <p className="text-sm text-slate-600">Generate one-off collections for specific policies</p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <AlertTriangle className="h-4 w-4" />
                <span>Requires approval</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => alert('Ad-hoc collection file generation requires supervisor approval. Request submitted.')}
              >
                Generate Ad-hoc File
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File History */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">File History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File ID</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debitOrderFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.id}</TableCell>
                  <TableCell className="font-mono text-sm">{file.filename}</TableCell>
                  <TableCell>
                    <Badge variant={file.type === 'Recurring' ? 'default' : 'secondary'}>
                      {file.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{file.records.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{file.amount}</TableCell>
                  <TableCell>{getStatusBadge(file.status)}</TableCell>
                  <TableCell className="text-slate-500">{file.submittedAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => alert(`Downloading file ${file.filename}...`)}
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => alert(`Viewing details for ${file.id}:\n\nFile: ${file.filename}\nType: ${file.type}\nRecords: ${file.records}\nAmount: ${file.amount}\nStatus: ${file.status}\nSubmitted: ${file.submittedAt}`)}
                      >
                        View Details
                      </Button>
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