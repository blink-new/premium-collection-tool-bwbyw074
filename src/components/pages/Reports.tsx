import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  Activity,
} from 'lucide-react'

export function Reports() {
  const [dateRange, setDateRange] = useState('last-30-days')

  const collectionTrends = [
    { month: 'Jan', amount: 2650000, collections: 1180 },
    { month: 'Feb', amount: 2780000, collections: 1220 },
    { month: 'Mar', amount: 2920000, collections: 1280 },
    { month: 'Apr', amount: 2850000, collections: 1250 },
    { month: 'May', amount: 3100000, collections: 1350 },
    { month: 'Jun', amount: 2950000, collections: 1290 },
  ]

  const successRateData = [
    { name: 'Successful', value: 94.2, count: 1175 },
    { name: 'Failed', value: 3.8, count: 47 },
    { name: 'Pending', value: 2.0, count: 25 },
  ]

  const pasPerformance = [
    { system: 'Grail PAS', policies: 847, successRate: 96.2, avgAmount: 2850 },
    { system: 'Root PAS', policies: 234, successRate: 92.1, avgAmount: 3200 },
    { system: 'Genesys Skyy', policies: 156, successRate: 94.8, avgAmount: 2650 },
    { system: 'Owl PAS', policies: 89, successRate: 88.5, avgAmount: 2950 },
  ]

  const recentReports = [
    {
      id: 'RPT-001',
      name: 'Monthly Collection Summary',
      type: 'Collection Report',
      generated: '2024-01-15 09:30',
      status: 'completed',
      size: '2.4 MB',
    },
    {
      id: 'RPT-002',
      name: 'PAS Integration Status',
      type: 'System Report',
      generated: '2024-01-14 16:45',
      status: 'completed',
      size: '1.8 MB',
    },
    {
      id: 'RPT-003',
      name: 'Failed Collections Analysis',
      type: 'Analysis Report',
      generated: '2024-01-14 11:20',
      status: 'completed',
      size: '3.1 MB',
    },
    {
      id: 'RPT-004',
      name: 'Reconciliation Summary',
      type: 'Reconciliation Report',
      generated: '2024-01-13 14:15',
      status: 'completed',
      size: '1.5 MB',
    },
  ]

  const COLORS = ['#22c55e', '#ef4444', '#f59e0b']

  const kpiData = [
    {
      title: 'Total Collections',
      value: 'R 17,650,000',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'Success Rate',
      value: '94.2%',
      change: '+1.8%',
      trend: 'up',
      icon: TrendingUp,
    },
    {
      title: 'Active Policies',
      value: '1,326',
      change: '+3.2%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Avg Collection Time',
      value: '2.3 days',
      change: '-0.5 days',
      trend: 'up',
      icon: Activity,
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-600">Analytics and reporting dashboard</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 days</SelectItem>
              <SelectItem value="last-30-days">Last 30 days</SelectItem>
              <SelectItem value="last-90-days">Last 90 days</SelectItem>
              <SelectItem value="last-year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => alert('Scheduling automated report generation...')}
          >
            <Calendar className="h-4 w-4" />
            Schedule Report
          </Button>
          <Button 
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => alert('Generating comprehensive report... This may take a few minutes.')}
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
              <div className="flex items-center gap-1 text-xs">
                {kpi.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {kpi.change}
                </span>
                <span className="text-slate-500">from last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Collection Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={collectionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R ${value.toLocaleString()}`, 'Amount']} />
                    <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Success Rate Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={successRateData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {successRateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collections" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Monthly Collection Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={collectionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value.toLocaleString(), 'Collections']} />
                  <Bar dataKey="collections" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">PAS System Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>System</TableHead>
                    <TableHead>Policies</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Avg Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pasPerformance.map((system) => (
                    <TableRow key={system.system}>
                      <TableCell className="font-medium">{system.system}</TableCell>
                      <TableCell>{system.policies.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            system.successRate >= 95 ? 'text-green-600' : 
                            system.successRate >= 90 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {system.successRate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>R {system.avgAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={
                          system.successRate >= 95 ? 'bg-green-100 text-green-800' :
                          system.successRate >= 90 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }>
                          {system.successRate >= 95 ? 'Excellent' : 
                           system.successRate >= 90 ? 'Good' : 'Needs Attention'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.id}</TableCell>
                      <TableCell>{report.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.type}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">{report.generated}</TableCell>
                      <TableCell>{report.size}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => alert(`Downloading ${report.name}...`)}
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => alert(`Viewing ${report.name}:\n\nType: ${report.type}\nGenerated: ${report.generated}\nSize: ${report.size}\nStatus: ${report.status}`)}
                          >
                            View
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