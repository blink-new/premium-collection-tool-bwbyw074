import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
} from 'lucide-react'

export function Collections() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const recurringCollections = [
    {
      id: 'REC-001',
      policy: 'POL-12345',
      client: 'John Smith',
      amount: 'R 2,450.00',
      nextRun: '2024-02-01',
      status: 'active',
      frequency: 'Monthly',
    },
    {
      id: 'REC-002',
      policy: 'POL-12346',
      client: 'Sarah Johnson',
      amount: 'R 1,890.00',
      nextRun: '2024-02-01',
      status: 'paused',
      frequency: 'Monthly',
    },
    {
      id: 'REC-003',
      policy: 'POL-12347',
      client: 'Mike Wilson',
      amount: 'R 3,200.00',
      nextRun: '2024-02-15',
      status: 'active',
      frequency: 'Quarterly',
    },
  ]

  const adhocCollections = [
    {
      id: 'ADH-001',
      policy: 'POL-12348',
      client: 'Emma Davis',
      amount: 'R 1,750.00',
      requestedBy: 'Admin User',
      status: 'pending_approval',
      createdAt: '2024-01-15',
    },
    {
      id: 'ADH-002',
      policy: 'POL-12349',
      client: 'David Brown',
      amount: 'R 2,100.00',
      requestedBy: 'Admin User',
      status: 'approved',
      createdAt: '2024-01-14',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Paused</Badge>
      case 'pending_approval':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100"><Clock className="h-3 w-3 mr-1" />Pending Approval</Badge>
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
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
          <h1 className="text-3xl font-bold text-slate-900">Collections</h1>
          <p className="text-slate-600">Manage recurring and ad-hoc premium collections</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => alert('Exporting collections data... Download will start shortly.')}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                New Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Collection</DialogTitle>
                <DialogDescription>
                  Set up a new recurring or ad-hoc collection
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Collection Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recurring">Recurring</SelectItem>
                      <SelectItem value="adhoc">Ad-hoc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Policy Number</label>
                  <Input placeholder="Enter policy number" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input placeholder="R 0.00" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={() => alert('Collection created successfully!')}>Create Collection</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search collections..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => alert('Advanced filters panel opening... Filter by date range, amount, PAS system, and more.')}
            >
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Collections Tabs */}
      <Tabs defaultValue="recurring" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recurring">Recurring Collections</TabsTrigger>
          <TabsTrigger value="adhoc">Ad-hoc Collections</TabsTrigger>
        </TabsList>

        <TabsContent value="recurring" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900">Recurring Collections</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => alert('Syncing all recurring collections with PAS systems... This may take several minutes.')}
                >
                  <RefreshCw className="h-4 w-4" />
                  Sync All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collection ID</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringCollections.map((collection) => (
                    <TableRow key={collection.id}>
                      <TableCell className="font-medium">{collection.id}</TableCell>
                      <TableCell>{collection.policy}</TableCell>
                      <TableCell>{collection.client}</TableCell>
                      <TableCell className="font-medium">{collection.amount}</TableCell>
                      <TableCell>{collection.frequency}</TableCell>
                      <TableCell className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {collection.nextRun}
                      </TableCell>
                      <TableCell>{getStatusBadge(collection.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => alert(`Editing collection ${collection.id}`)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => alert(`Collection ${collection.id} ${collection.status === 'active' ? 'paused' : 'resumed'} successfully!`)}
                          >
                            {collection.status === 'active' ? 'Pause' : 'Resume'}
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

        <TabsContent value="adhoc" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Ad-hoc Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collection ID</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adhocCollections.map((collection) => (
                    <TableRow key={collection.id}>
                      <TableCell className="font-medium">{collection.id}</TableCell>
                      <TableCell>{collection.policy}</TableCell>
                      <TableCell>{collection.client}</TableCell>
                      <TableCell className="font-medium">{collection.amount}</TableCell>
                      <TableCell>{collection.requestedBy}</TableCell>
                      <TableCell>{collection.createdAt}</TableCell>
                      <TableCell>{getStatusBadge(collection.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {collection.status === 'pending_approval' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-green-600 hover:text-green-700"
                                onClick={() => alert(`Collection ${collection.id} approved successfully!`)}
                              >
                                Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => alert(`Collection ${collection.id} rejected.`)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {collection.status === 'approved' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => alert(`Processing collection ${collection.id}...`)}
                            >
                              Process
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
        </TabsContent>
      </Tabs>
    </div>
  )
}