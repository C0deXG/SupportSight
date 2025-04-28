import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Plus, Search, Calendar, Clock, AlertCircle, CheckCircle, Bug, CheckIcon, Percent, Share2, Copy, Check, Trash2 } from 'lucide-react'
import { projectService } from '../services/projectService'
import { clientService } from '../services/clientService'
import { issueService } from '../services/issueService'
import { useToast } from '../components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog"
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs"
import type { Client, Project, ProjectStatus } from '../lib/supabase'
import type { Issue } from '../services/issueService'
import { Textarea } from '../components/ui/textarea'

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projectIssues, setProjectIssues] = useState<Issue[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false)
  const [loadingIssues, setLoadingIssues] = useState(false)
  const { toast } = useToast()
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    client_id: '',
    status: 'active' as ProjectStatus,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    progress_percentage: '0',
    estimated_hours: ''
  })
  const [updatedStatus, setUpdatedStatus] = useState<ProjectStatus>('active')
  const [updatedProgress, setUpdatedProgress] = useState('')
  const [updatedEstimatedHours, setUpdatedEstimatedHours] = useState('')
  const [updatingProject, setUpdatingProject] = useState(false)
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    loadProjects()
    loadClients()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await projectService.getProjects()
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const data = await clientService.getClients()
      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }
  
  const loadIssuesForProject = async (projectId: string) => {
    try {
      setLoadingIssues(true)
      const data = await issueService.getIssuesByProject(projectId)
      setProjectIssues(data || [])
    } catch (error) {
      console.error('Error loading issues for project:', error)
      toast({
        title: "Error",
        description: "Failed to load issues for this project",
        variant: "destructive"
      })
    } finally {
      setLoadingIssues(false)
    }
  }

  const openProjectDetails = (project: Project) => {
    setSelectedProject(project)
    setProjectDetailsOpen(true)
    loadIssuesForProject(project.id)
    
    // Set initial values for updating
    setUpdatedStatus(project.status)
    setUpdatedProgress(project.progress_percentage || '')
    setUpdatedEstimatedHours(project.estimated_hours || '')
  }

  const handleCreateProject = async () => {
    try {
      if (!newProject.client_id) {
        toast({
          title: "Error",
          description: "Please select a client",
          variant: "destructive"
        })
        return false
      }

      if (!newProject.name) {
        toast({
          title: "Error",
          description: "Project name is required",
          variant: "destructive"
        })
        return false
      }

      await projectService.createProject(newProject)
      toast({
        title: "Success",
        description: "Project created successfully"
      })
      loadProjects()
      return true
    } catch (error) {
      console.error('Error creating project:', error)
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      })
      return false
    }
  }

  const updateProjectStatus = async () => {
    if (!selectedProject) return

    try {
      setUpdatingProject(true)
      
      await projectService.updateProject(selectedProject.id, {
        status: updatedStatus,
        progress_percentage: updatedProgress,
        estimated_hours: updatedEstimatedHours
      })
      
      // Update the selected project in local state
      setSelectedProject({
        ...selectedProject,
        status: updatedStatus,
        progress_percentage: updatedProgress,
        estimated_hours: updatedEstimatedHours
      })
      
      // Update the project in the projects list
      setProjects(projects.map(p => 
        p.id === selectedProject.id 
          ? {
              ...p,
              status: updatedStatus,
              progress_percentage: updatedProgress,
              estimated_hours: updatedEstimatedHours
            } 
          : p
      ))
      
      toast({
        title: "Success",
        description: "Project updated successfully"
      })
    } catch (error) {
      console.error('Error updating project:', error)
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive"
      })
    } finally {
      setUpdatingProject(false)
    }
  }

  const copyLinkToClipboard = (projectId: string) => {
    const link = projectService.getShareableLink(projectId);
    setShareLink(link);
    navigator.clipboard.writeText(link);
    setCopied(true);
    
    toast({
      title: "Success",
      description: "Project link copied to clipboard"
    });
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return

    try {
      setIsDeleting(true)
      await projectService.deleteProject(selectedProject.id)
      
      // Remove the project from the local state
      setProjects(projects.filter(p => p.id !== selectedProject.id))
      
      toast({
        title: "Success",
        description: "Project deleted successfully"
      })
      setProjectDetailsOpen(false)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting project:', error)
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.clients?.name && project.clients.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-50 text-blue-700'
      case 'completed':
        return 'bg-green-50 text-green-700'
      case 'on_hold':
        return 'bg-yellow-50 text-yellow-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }
  
  const calculateProjectProgress = (project: Project, issues: Issue[]) => {
    if (!issues || issues.length === 0) return 0
    
    const completed = issues.filter(issue => 
      issue.status === 'resolved' || issue.status === 'closed'
    ).length
    
    return Math.round((completed / issues.length) * 100)
  }
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <Bug className="h-4 w-4 mr-1" />
      case 'feature':
        return <CheckIcon className="h-4 w-4 mr-1" />
      default:
        return null
    }
  }

  const getIssueProgressStats = (issues: Issue[]) => {
    if (!issues.length) return { open: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 }
    
    const open = issues.filter(i => i.status === 'open').length
    const inProgress = issues.filter(i => i.status === 'in_progress').length
    const resolved = issues.filter(i => i.status === 'resolved').length
    const closed = issues.filter(i => i.status === 'closed').length
    
    return {
      open,
      inProgress,
      resolved,
      closed,
      total: issues.length
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        <p className="text-muted-foreground">Manage and track your ongoing projects.</p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Project List</TabsTrigger>
          <TabsTrigger value="add">Add New Project</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading projects...</div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-8">
                  {searchTerm ? "No projects match your search" : "No projects yet. Create your first project!"}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredProjects.map((project) => (
                    <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openProjectDetails(project)}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{project.name}</span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(project.status)}`}
                          >
                            {project.status.replace('_', ' ')}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Client</p>
                          <p>{project.clients?.name || 'No client'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Description</p>
                          <p className="text-sm">{project.description || 'No description'}</p>
                        </div>
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(project.start_date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(project.end_date)}</span>
                          </div>
                        </div>
                        {project.progress_percentage && (
                          <div>
                            <div className="flex justify-between text-sm font-medium">
                              <span>Progress</span>
                              <span>{project.progress_percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${project.progress_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="flex justify-between text-sm font-medium">
                            <span>Issues</span>
                            <span>{project.issues?.length || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="add" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Add New Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select 
                    onValueChange={(value) => setNewProject({ ...newProject, client_id: value })}
                    value={newProject.client_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter project name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter project description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    onValueChange={(value) => setNewProject({ ...newProject, status: value as ProjectStatus })}
                    value={newProject.status}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectService.getProjectStatusOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="progress_percentage">Progress (%)</Label>
                    <Input
                      id="progress_percentage"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g. 50"
                      value={newProject.progress_percentage}
                      onChange={(e) => setNewProject({ ...newProject, progress_percentage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_hours">Est. Hours</Label>
                    <Input
                      id="estimated_hours"
                      type="number"
                      min="0"
                      placeholder="e.g. 40"
                      value={newProject.estimated_hours}
                      onChange={(e) => setNewProject({ ...newProject, estimated_hours: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newProject.start_date}
                      onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newProject.end_date}
                      onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={async () => {
                    const success = await handleCreateProject()
                    if (success) {
                      setNewProject({
                        name: '',
                        description: '',
                        client_id: '',
                        status: 'active',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: '',
                        progress_percentage: '0',
                        estimated_hours: ''
                      })
                    }
                  }}
                >
                  Create Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Project Details Dialog */}
      <Dialog open={projectDetailsOpen} onOpenChange={setProjectDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle className="text-xl">{selectedProject.name}</DialogTitle>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1" 
                      onClick={() => copyLinkToClipboard(selectedProject.id)}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied!' : 'Share'}</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(selectedProject.status)}`}>
                      {selectedProject.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Project Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Client</h4>
                    <p className="text-sm">{selectedProject.clients?.name || 'No client'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Status</h4>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedProject.status)}`}>
                      {selectedProject.status.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Start Date</h4>
                    <p className="text-sm">{formatDate(selectedProject.start_date)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">End Date</h4>
                    <p className="text-sm">{formatDate(selectedProject.end_date)}</p>
                  </div>
                  <div className="col-span-2">
                    <h4 className="text-sm font-semibold mb-1">Description</h4>
                    <p className="text-sm">{selectedProject.description || 'No description'}</p>
                  </div>
                </div>
                
                {/* Update Project Status Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Update Project Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="updated-status">Status</Label>
                        <Select 
                          onValueChange={(value) => setUpdatedStatus(value as ProjectStatus)}
                          value={updatedStatus}
                          defaultValue={selectedProject.status}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectService.getProjectStatusOptions().map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="progress">Progress (%)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="progress"
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Enter progress percentage"
                            value={updatedProgress}
                            onChange={(e) => setUpdatedProgress(e.target.value)}
                            defaultValue={selectedProject.progress_percentage || '0'}
                          />
                          <Percent className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="estimated-hours">Estimated Hours</Label>
                      <Input
                        id="estimated-hours"
                        type="number"
                        min="0"
                        placeholder="Enter estimated hours"
                        value={updatedEstimatedHours}
                        onChange={(e) => setUpdatedEstimatedHours(e.target.value)}
                        defaultValue={selectedProject.estimated_hours || ''}
                      />
                    </div>
                    <Button 
                      onClick={updateProjectStatus}
                      disabled={updatingProject}
                      className="w-full"
                    >
                      {updatingProject ? 'Updating...' : 'Update Project'}
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Project Progress section */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Project Progress</h4>
                  <div className="space-y-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${selectedProject.progress_percentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <div>
                        <span className="font-medium">{selectedProject.progress_percentage || 0}%</span> Complete
                      </div>
                      <div>
                        <span className="font-medium">{selectedProject.estimated_hours || '-'}</span> Est. Hours
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Issue Progress Stats */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-3">Issue Progress</h4>
                  
                  {loadingIssues ? (
                    <div className="text-center py-2">Loading issue stats...</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 gap-4">
                        {(() => {
                          const stats = getIssueProgressStats(projectIssues);
                          return (
                            <>
                              <Card className="shadow-none border">
                                <CardHeader className="p-4 pb-2">
                                  <CardTitle className="text-sm">Open</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                  <div className="text-2xl font-bold">{stats.open}</div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {stats.total ? `${Math.round((stats.open / stats.total) * 100)}%` : '0%'} of total
                                  </p>
                                </CardContent>
                              </Card>
                              <Card className="shadow-none border">
                                <CardHeader className="p-4 pb-2">
                                  <CardTitle className="text-sm">In Progress</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                  <div className="text-2xl font-bold">{stats.inProgress}</div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {stats.total ? `${Math.round((stats.inProgress / stats.total) * 100)}%` : '0%'} of total
                                  </p>
                                </CardContent>
                              </Card>
                              <Card className="shadow-none border">
                                <CardHeader className="p-4 pb-2">
                                  <CardTitle className="text-sm">Resolved</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                  <div className="text-2xl font-bold">{stats.resolved}</div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {stats.total ? `${Math.round((stats.resolved / stats.total) * 100)}%` : '0%'} of total
                                  </p>
                                </CardContent>
                              </Card>
                              <Card className="shadow-none border">
                                <CardHeader className="p-4 pb-2">
                                  <CardTitle className="text-sm">Closed</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                  <div className="text-2xl font-bold">{stats.closed}</div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {stats.total ? `${Math.round((stats.closed / stats.total) * 100)}%` : '0%'} of total
                                  </p>
                                </CardContent>
                              </Card>
                            </>
                          );
                        })()}
                      </div>
                      
                      {/* Issue Progress Bar */}
                      {projectIssues.length > 0 && (
                        <div className="mt-4">
                          <div className="w-full h-2 rounded-full bg-gray-200 flex overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full" 
                              style={{ width: `${Math.round((projectIssues.filter(i => i.status === 'open').length / projectIssues.length) * 100)}%` }} 
                            />
                            <div 
                              className="bg-purple-500 h-full" 
                              style={{ width: `${Math.round((projectIssues.filter(i => i.status === 'in_progress').length / projectIssues.length) * 100)}%` }} 
                            />
                            <div 
                              className="bg-green-500 h-full" 
                              style={{ width: `${Math.round((projectIssues.filter(i => i.status === 'resolved').length / projectIssues.length) * 100)}%` }} 
                            />
                            <div 
                              className="bg-gray-500 h-full" 
                              style={{ width: `${Math.round((projectIssues.filter(i => i.status === 'closed').length / projectIssues.length) * 100)}%` }} 
                            />
                          </div>
                          <div className="flex text-xs mt-1 justify-between text-muted-foreground">
                            <span>Open</span>
                            <span>In Progress</span>
                            <span>Resolved</span>
                            <span>Closed</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Project issues */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Project Issues</h4>
                  
                  <Tabs defaultValue="all">
                    <TabsList>
                      <TabsTrigger value="all">All Issues</TabsTrigger>
                      <TabsTrigger value="open">Open</TabsTrigger>
                      <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                      <TabsTrigger value="resolved">Resolved</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all" className="mt-4">
                      {loadingIssues ? (
                        <div className="text-center py-4">Loading issues...</div>
                      ) : projectIssues.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No issues found for this project
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Severity</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {projectIssues.map(issue => (
                              <TableRow key={issue.id}>
                                <TableCell className="font-medium">{issue.title}</TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    {getTypeIcon(issue.type)}
                                    <span className="capitalize">{issue.type}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                    {issue.severity}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    issue.status === 'open' ? 'bg-blue-100 text-blue-800' :
                                    issue.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                                    issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {issue.status.replace('_', ' ')}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(issue.created_at).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="open" className="mt-4">
                      {loadingIssues ? (
                        <div className="text-center py-4">Loading issues...</div>
                      ) : projectIssues.filter(i => i.status === 'open').length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No open issues
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Severity</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {projectIssues.filter(i => i.status === 'open').map(issue => (
                              <TableRow key={issue.id}>
                                <TableCell className="font-medium">{issue.title}</TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    {getTypeIcon(issue.type)}
                                    <span className="capitalize">{issue.type}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                    {issue.severity}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(issue.created_at).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="in_progress" className="mt-4">
                      {/* Similar table for in_progress issues */}
                      {loadingIssues ? (
                        <div className="text-center py-4">Loading issues...</div>
                      ) : projectIssues.filter(i => i.status === 'in_progress').length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No issues in progress
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Severity</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {projectIssues.filter(i => i.status === 'in_progress').map(issue => (
                              <TableRow key={issue.id}>
                                <TableCell className="font-medium">{issue.title}</TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    {getTypeIcon(issue.type)}
                                    <span className="capitalize">{issue.type}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                    {issue.severity}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(issue.created_at).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="resolved" className="mt-4">
                      {/* Similar table for resolved issues */}
                      {loadingIssues ? (
                        <div className="text-center py-4">Loading issues...</div>
                      ) : projectIssues.filter(i => i.status === 'resolved' || i.status === 'closed').length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No resolved issues
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Severity</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {projectIssues.filter(i => i.status === 'resolved' || i.status === 'closed').map(issue => (
                              <TableRow key={issue.id}>
                                <TableCell className="font-medium">{issue.title}</TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    {getTypeIcon(issue.type)}
                                    <span className="capitalize">{issue.type}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                    {issue.severity}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    issue.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {issue.status.replace('_', ' ')}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(issue.created_at).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription className="pt-2">
              <div className="flex items-center space-x-2 text-amber-500 mb-2">
                <AlertCircle className="h-5 w-5" />
                <span>Warning: This action cannot be undone.</span>
              </div>
              <p>
                Are you sure you want to delete "{selectedProject?.name}"? This will also remove all associated issues.
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
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 