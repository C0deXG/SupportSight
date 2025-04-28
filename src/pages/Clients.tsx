import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Plus, Search, UserPlus, Trash2, AlertCircle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { clientService } from '../services/clientService'
import type { Client } from '../lib/supabase'
import { Label } from '../components/ui/label'
import { useToast } from '../components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog"

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: ''
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const data = await clientService.getClients()
      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateClient = async () => {
    if (!newClient.name) {
      toast({
        title: "Validation Error",
        description: "Client name is required",
        variant: "destructive"
      })
      return false
    }
    
    try {
      await clientService.createClient(newClient)
      toast({
        title: "Success",
        description: "Client created successfully"
      })
      loadClients() // Reload the clients list
      setNewClient({ name: '', email: '', phone: '', company: '', notes: '' })
      return true // Return true to indicate success
    } catch (error) {
      console.error('Error creating client:', error)
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive"
      })
      return false // Return false to indicate failure
    }
  }

  const handleDeleteClient = async (client: Client) => {
    setClientToDelete(client)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return

    try {
      setIsDeleting(true)
      await clientService.deleteClient(clientToDelete.id)
      
      // Remove the client from the local state
      setClients(clients.filter(c => c.id !== clientToDelete.id))
      
      toast({
        title: "Success",
        description: "Client deleted successfully"
      })
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting client:', error)
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setClientToDelete(null)
    }
  }

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
        <p className="text-muted-foreground">Manage your client relationships.</p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Client List</TabsTrigger>
          <TabsTrigger value="add">Add New Client</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Client List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No clients found</TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>{client.company}</TableCell>
                        <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClient(client);
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="add" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="mr-2 h-5 w-5" />
                Add New Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter client name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter client email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Enter company name"
                    value={newClient.company}
                    onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Enter any additional notes"
                    value={newClient.notes}
                    onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateClient}
                >
                  Create Client
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription className="pt-2">
              <div className="flex items-center space-x-2 text-amber-500 mb-2">
                <AlertCircle className="h-5 w-5" />
                <span>Warning: This action cannot be undone.</span>
              </div>
              <p>
                Are you sure you want to delete {clientToDelete?.name}? This will also remove all associated projects and issues.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteClient}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 