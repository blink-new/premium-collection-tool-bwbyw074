import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { toast } from 'react-hot-toast';
import { Key, Plus, Copy, EyeOff, Trash2, Shield, Clock, AlertTriangle } from 'lucide-react';

interface CellCaptive {
  id: string;
  name: string;
  code: string;
  contact_email: string;
  is_active: boolean;
}

interface ApiKey {
  id: string;
  key_name: string;
  api_key?: string;
  api_key_preview: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  cell_captive_name: string;
  cell_captive_code: string;
  created_by_name?: string;
}

const AVAILABLE_PERMISSIONS = [
  { value: 'collections:read', label: 'Read Collections', description: 'View collection data' },
  { value: 'collections:write', label: 'Write Collections', description: 'Create and update collections' },
  { value: 'policies:read', label: 'Read Policies', description: 'View policy data' },
  { value: 'policies:write', label: 'Write Policies', description: 'Create and update policies' },
  { value: 'webhooks:receive', label: 'Receive Webhooks', description: 'Receive webhook notifications' },
  { value: '*', label: 'All Permissions', description: 'Full access to all endpoints' }
];

export function APIKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [cellCaptives, setCellCaptives] = useState<CellCaptive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCellCaptive, setSelectedCellCaptive] = useState('');
  const [keyName, setKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['collections:read', 'collections:write']);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCellCaptive, setFilterCellCaptive] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchApiKeys();
    fetchCellCaptives();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/keys', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.data);
      } else {
        toast.error('Failed to fetch API keys');
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  const fetchCellCaptives = async () => {
    try {
      const response = await fetch('/api/cell-captives', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCellCaptives(data.data.filter((cc: CellCaptive) => cc.is_active));
      }
    } catch (error) {
      console.error('Error fetching cell captives:', error);
    }
  };

  const handleCreateApiKey = async () => {
    if (!selectedCellCaptive || !keyName.trim()) {
      toast.error('Please select a cell captive and enter a key name');
      return;
    }

    try {
      const response = await fetch('/api/keys/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cell_captive_id: selectedCellCaptive,
          key_name: keyName,
          permissions: selectedPermissions,
          expires_in_days: expiresInDays
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNewApiKey(data.data.api_key);
        setShowApiKey(true);
        fetchApiKeys();
        
        // Reset form
        setSelectedCellCaptive('');
        setKeyName('');
        setSelectedPermissions(['collections:read', 'collections:write']);
        setExpiresInDays(null);
        
        toast.success('API key generated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error?.message || 'Failed to generate API key');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key');
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/keys/${keyId}/revoke`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchApiKeys();
        toast.success('API key revoked successfully');
      } else {
        toast.error('Failed to revoke API key');
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key');
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchApiKeys();
        toast.success('API key deleted successfully');
      } else {
        toast.error('Failed to delete API key');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('API key copied to clipboard');
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permission]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permission));
    }
  };

  const filteredApiKeys = apiKeys.filter(key => {
    const matchesSearch = key.key_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.cell_captive_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.cell_captive_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCellCaptive = !filterCellCaptive || key.cell_captive_code === filterCellCaptive;
    
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && key.is_active) ||
                         (filterStatus === 'inactive' && !key.is_active) ||
                         (filterStatus === 'expired' && key.expires_at && new Date(key.expires_at) < new Date());
    
    return matchesSearch && matchesCellCaptive && matchesStatus;
  });

  const getStatusBadge = (key: ApiKey) => {
    if (!key.is_active) {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (key.expires_at && new Date(key.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Expiring Soon</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-600 mt-1">Manage API keys for cell captive integrations</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for a cell captive to access the collection system.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="cellCaptive">Cell Captive</Label>
                <Select value={selectedCellCaptive} onValueChange={setSelectedCellCaptive}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a cell captive" />
                  </SelectTrigger>
                  <SelectContent>
                    {cellCaptives.map(cc => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.name} ({cc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                />
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {AVAILABLE_PERMISSIONS.map(permission => (
                    <div key={permission.value} className="flex items-start space-x-2">
                      <Checkbox
                        id={permission.value}
                        checked={selectedPermissions.includes(permission.value)}
                        onCheckedChange={(checked) => handlePermissionChange(permission.value, checked as boolean)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="expiresInDays">Expires In (Days)</Label>
                <Input
                  id="expiresInDays"
                  type="number"
                  value={expiresInDays || ''}
                  onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Leave empty for no expiration"
                  min="1"
                  max="365"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateApiKey}>
                Generate Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* New API Key Display */}
      {newApiKey && (
        <Dialog open={showApiKey} onOpenChange={setShowApiKey}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                API Key Generated
              </DialogTitle>
              <DialogDescription>
                Please copy this API key now. You won't be able to see it again.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono break-all">{newApiKey}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(newApiKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Usage:</strong></p>
                <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
                  Authorization: Bearer {newApiKey}
                </code>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => {
                setShowApiKey(false);
                setNewApiKey(null);
              }}>
                I've Copied the Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by key name or cell captive..."
              />
            </div>
            
            <div>
              <Label htmlFor="filterCellCaptive">Cell Captive</Label>
              <Select value={filterCellCaptive} onValueChange={setFilterCellCaptive}>
                <SelectTrigger>
                  <SelectValue placeholder="All cell captives" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All cell captives</SelectItem>
                  {cellCaptives.map(cc => (
                    <SelectItem key={cc.code} value={cc.code}>
                      {cc.name} ({cc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="filterStatus">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Revoked</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            API Keys ({filteredApiKeys.length})
          </CardTitle>
          <CardDescription>
            Manage API keys for cell captive integrations
          </CardDescription>
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
              {filteredApiKeys.map(key => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.key_name}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{key.cell_captive_name}</div>
                      <div className="text-sm text-gray-500">{key.cell_captive_code}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {key.api_key_preview}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {key.permissions.slice(0, 2).map(permission => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                      {key.permissions.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{key.permissions.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(key)}</TableCell>
                  <TableCell>
                    {key.last_used_at ? (
                      <div className="text-sm">
                        {new Date(key.last_used_at).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {key.expires_at ? (
                      <div className="flex items-center text-sm">
                        {new Date(key.expires_at) < new Date() ? (
                          <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                        ) : new Date(key.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? (
                          <Clock className="h-4 w-4 mr-1 text-yellow-500" />
                        ) : (
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        )}
                        {new Date(key.expires_at).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {key.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevokeApiKey(key.id)}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
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
                            <AlertDialogAction onClick={() => handleDeleteApiKey(key.id)}>
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
          
          {filteredApiKeys.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No API keys found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            How to use the API keys for webhook integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Authentication</h4>
            <p className="text-sm text-gray-600 mb-2">
              Include the API key in the Authorization header:
            </p>
            <code className="block p-3 bg-gray-100 rounded text-sm">
              Authorization: Bearer pct_your_api_key_here
            </code>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Available Endpoints</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">POST</Badge>
                <code>/api/webhooks/collections/update</code>
                <span className="text-gray-600">- Update collection status</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">POST</Badge>
                <code>/api/webhooks/collections/bulk-update</code>
                <span className="text-gray-600">- Bulk update collections</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">POST</Badge>
                <code>/api/webhooks/policies/update</code>
                <span className="text-gray-600">- Update policy information</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">GET</Badge>
                <code>/api/webhooks/logs</code>
                <span className="text-gray-600">- View webhook logs</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Example Request</h4>
            <pre className="p-3 bg-gray-100 rounded text-xs overflow-x-auto">
{`curl -X POST /api/webhooks/collections/update \\
  -H "Authorization: Bearer pct_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "collection_reference": "COL_123456",
    "status": "successful",
    "investec_reference": "INV_789012",
    "bank_reference": "BANK_345678"
  }'`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}