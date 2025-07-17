import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Key,
  Copy,
  Shield,
  ShieldOff,
  Trash2,
  Calendar,
  Building,
  Activity
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ApiKey {
  id: string
  key_name: string
  api_key_preview: string
  permissions: string[]
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string
  cell_captive_name: string
  cell_captive_code: string
  created_by_name: string
}

interface CellCaptive {
  id: string
  name: string
  code: string
  contact_email: string
}

export function APIKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [cellCaptives, setCellCaptives] = useState<CellCaptive[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [showNewKey, setShowNewKey] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    cell_captive_id: '',
    key_name: '',
    expires_in_days: '',
    permissions: ['collections:read', 'collections:write']
  })

  useEffect(() => {
    fetchApiKeys()
    fetchCellCaptives()
  }, [])

  const fetchApiKeys = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockApiKeys: ApiKey[] = [
        {
          id: '1',
          key_name: 'Alpha Insurance Production',
          api_key_preview: 'pct_abc123...',
          permissions: ['collections:read', 'collections:write'],
          is_active: true,
          last_used_at: '2024-01-15T10:30:00Z',
          expires_at: null,
          created_at: '2024-01-01T00:00:00Z',
          cell_captive_name: 'Alpha Insurance Cell',
          cell_captive_code: 'ALPHA001',
          created_by_name: 'System Administrator'
        },
        {
          id: '2',
          key_name: 'Beta Life Development',
          api_key_preview: 'pct_def456...',
          permissions: ['collections:read'],
          is_active: false,
          last_used_at: '2024-01-10T15:45:00Z',
          expires_at: '2024-12-31T23:59:59Z',
          created_at: '2024-01-05T00:00:00Z',
          cell_captive_name: 'Beta Life Cell',
          cell_captive_code: 'BETA002',
          created_by_name: 'System Administrator'
        }
      ]
      setApiKeys(mockApiKeys)
    } catch (error) {
      toast.error('Failed to fetch API keys')
    } finally {
      setLoading(false)
    }
  }

  const fetchCellCaptives = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockCellCaptives: CellCaptive[] = [
        {
          id: '1',
          name: 'Alpha Insurance Cell',
          code: 'ALPHA001',
          contact_email: 'admin@alpha-insurance.com'
        },
        {
          id: '2',
          name: 'Beta Life Cell',
          code: 'BETA002',
          contact_email: 'admin@beta-life.com'
        },
        {
          id: '3',
          name: 'Gamma Health Cell',
          code: 'GAMMA003',
          contact_email: 'admin@gamma-health.com'
        }
      ]
      setCellCaptives(mockCellCaptives)
    } catch (error) {
      toast.error('Failed to fetch cell captives')
    }
  }

  const handleCreateApiKey = async () => {
    try {
      // Mock API key generation - replace with actual API call
      const mockNewKey = `pct_${Math.random().toString(36).substr(2, 32)}`
      setNewApiKey(mockNewKey)
      setShowNewKey(true)
      
      // Add to list
      const selectedCaptive = cellCaptives.find(c => c.id === formData.cell_captive_id)
      const newKey: ApiKey = {
        id: Date.now().toString(),
        key_name: formData.key_name,
        api_key_preview: `${mockNewKey.substring(0, 12)}...`,
        permissions: formData.permissions,
        is_active: true,
        last_used_at: null,
        expires_at: formData.expires_in_days ? 
          new Date(Date.now() + parseInt(formData.expires_in_days) * 24 * 60 * 60 * 1000).toISOString() : null,
        created_at: new Date().toISOString(),
        cell_captive_name: selectedCaptive?.name || '',
        cell_captive_code: selectedCaptive?.code || '',
        created_by_name: 'Current User'
      }
      
      setApiKeys(prev => [newKey, ...prev])
      toast.success('API key generated successfully')
      
      // Reset form
      setFormData({
        cell_captive_id: '',
        key_name: '',
        expires_in_days: '',
        permissions: ['collections:read', 'collections:write']
      })
      
    } catch (error) {
      toast.error('Failed to generate API key')
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    try {
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, is_active: false } : key
      ))
      toast.success('API key revoked successfully')
    } catch (error) {
      toast.error('Failed to revoke API key')
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    try {
      setApiKeys(prev => prev.filter(key => key.id !== keyId))
      toast.success('API key deleted successfully')
    } catch (error) {
      toast.error('Failed to delete API key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const getStatusBadge = (key: ApiKey) => {
    if (!key.is_active) {
      return <Badge variant="destructive" className="gap-1"><ShieldOff className="h-3 w-3" />Revoked</Badge>
    }
    
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return <Badge variant="destructive" className="gap-1"><Calendar className="h-3 w-3" />Expired</Badge>
    }
    
    return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
      <Shield className="h-3 w-3" />Active
    </Badge>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">API Keys</h1>
          <p className="text-slate-600">Manage API keys for cell captive integrations</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Generate API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for a cell captive to access the collection system
              </DialogDescription>
            </DialogHeader>
            
            {newApiKey && showNewKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">API Key Generated</span>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    Please copy this key now. You won't be able to see it again.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={newApiKey} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(newApiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    onClick={() => {
                      setShowCreateDialog(false)
                      setNewApiKey(null)
                      setShowNewKey(false)
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cell_captive_id">Cell Captive</Label>
                  <Select 
                    value={formData.cell_captive_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, cell_captive_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cell captive" />
                    </SelectTrigger>
                    <SelectContent>
                      {cellCaptives.map((captive) => (
                        <SelectItem key={captive.id} value={captive.id}>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            {captive.name} ({captive.code})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="key_name">Key Name</Label>
                  <Input
                    id="key_name"
                    placeholder="e.g., Production API Key"
                    value={formData.key_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, key_name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expires_in_days">Expires In (Days)</Label>
                  <Input
                    id="expires_in_days"
                    type="number"
                    placeholder="Leave empty for no expiration"
                    value={formData.expires_in_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_in_days: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="read"
                        checked={formData.permissions.includes('collections:read')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              permissions: [...prev.permissions, 'collections:read']
                            }))
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              permissions: prev.permissions.filter(p => p !== 'collections:read')
                            }))
                          }
                        }}
                      />
                      <Label htmlFor="read">Read Collections</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="write"
                        checked={formData.permissions.includes('collections:write')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              permissions: [...prev.permissions, 'collections:write']
                            }))
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              permissions: prev.permissions.filter(p => p !== 'collections:write')
                            }))
                          }
                        }}
                      />
                      <Label htmlFor="write">Update Collections</Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateApiKey}
                    disabled={!formData.cell_captive_id || !formData.key_name || formData.permissions.length === 0}
                  >
                    Generate Key
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key Name</TableHead>
                <TableHead>Cell Captive</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.key_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate-400" />
                      <div>
                        <div className="font-medium">{key.cell_captive_name}</div>
                        <div className="text-sm text-slate-500">{key.cell_captive_code}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                        {key.api_key_preview}
                      </code>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(key.api_key_preview)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {key.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(key)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Activity className="h-3 w-3" />
                      {formatDate(key.last_used_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {key.expires_at ? formatDate(key.expires_at) : 'Never'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {key.is_active ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRevokeKey(key.id)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <ShieldOff className="h-3 w-3 mr-1" />
                          Revoke
                        </Button>
                      ) : (
                        <span className="text-sm text-slate-400">Revoked</span>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this API key? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteKey(key.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {apiKeys.length === 0 && (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No API Keys</h3>
              <p className="text-slate-500 mb-4">Generate your first API key to enable cell captive integrations</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate API Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}