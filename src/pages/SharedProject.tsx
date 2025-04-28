import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Calendar, Clock, Percent } from 'lucide-react'
import { projectService } from '../services/projectService'
import { issueService } from '../services/issueService'
import { useToast } from '../components/ui/use-toast'
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
import type { Project } from '../lib/supabase'
import type { Issue } from '../services/issueService'

export default function SharedProject() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [projectIssues, setProjectIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingIssues, setLoadingIssues] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (projectId) {
      loadProject(projectId)
    }
  }, [projectId])

  const loadProject = async (id: string) => {
    try {
      setLoading(true)
      const data = await projectService.getProjectByIdPublic(id)
      setProject(data)
      loadIssuesForProject(id)
    } catch (error) {
      console.error('Error loading project:', error)
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  const loadIssuesForProject = async (projectId: string) => {
    try {
      setLoadingIssues(true)
      const data = await issueService.getIssuesByProjectPublic(projectId)
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-50 text-blue-700'
      case 'in_progress':
        return 'bg-purple-50 text-purple-700'
      case 'completed':
        return 'bg-green-50 text-green-700'
      case 'on_hold':
        return 'bg-yellow-50 text-yellow-700'
      case 'planned':
        return 'bg-cyan-50 text-cyan-700'
      case 'cancelled':
        return 'bg-red-50 text-red-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
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

  const getIssueStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-purple-100 text-purple-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getIssueProgressStats = () => {
    if (!projectIssues.length) return { open: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 }
    
    const open = projectIssues.filter(i => i.status === 'open').length
    const inProgress = projectIssues.filter(i => i.status === 'in_progress').length
    const resolved = projectIssues.filter(i => i.status === 'resolved').length
    const closed = projectIssues.filter(i => i.status === 'closed').length
    
    return {
      open,
      inProgress,
      resolved,
      closed,
      total: projectIssues.length
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading project details...</h2>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <p className="text-muted-foreground">The project you're looking for doesn't exist or may have been deleted</p>
        </div>
      </div>
    )
  }

  const issueStats = getIssueProgressStats()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Project Header */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground mt-1">
                {project.clients?.name ? `Client: ${project.clients.name}` : 'No client'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full ${getStatusColor(project.status)}`}>
              {project.status.replace('_', ' ')}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-sm font-semibold mb-2">Project Details</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="font-medium">Start Date:</span>
                  <span className="ml-2">{formatDate(project.start_date)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="font-medium">End Date:</span>
                  <span className="ml-2">{formatDate(project.end_date)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Percent className="h-4 w-4 mr-2" />
                  <span className="font-medium">Estimated Hours:</span>
                  <span className="ml-2">{project.estimated_hours || '-'}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Project Progress</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Completion</span>
                    <span>{project.progress_percentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${project.progress_percentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {project.description && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm">{project.description}</p>
            </div>
          )}
        </div>
        
        {/* Issues Section */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Issues ({projectIssues.length})</h2>
          
          {/* Issues Progress */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Issue Progress</h3>
            <div className="grid grid-cols-4 gap-4">
              <Card className="shadow-none border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Open</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-3xl font-bold">{issueStats.open}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {issueStats.total ? `${Math.round((issueStats.open / issueStats.total) * 100)}%` : '0%'} of total
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-none border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">In Progress</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-3xl font-bold">{issueStats.inProgress}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {issueStats.total ? `${Math.round((issueStats.inProgress / issueStats.total) * 100)}%` : '0%'} of total
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-none border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Resolved</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-3xl font-bold">{issueStats.resolved}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {issueStats.total ? `${Math.round((issueStats.resolved / issueStats.total) * 100)}%` : '0%'} of total
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-none border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Closed</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-3xl font-bold">{issueStats.closed}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {issueStats.total ? `${Math.round((issueStats.closed / issueStats.total) * 100)}%` : '0%'} of total
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Issue Progress Bar */}
            {issueStats.total > 0 && (
              <div className="mt-4">
                <div className="w-full h-2 rounded-full bg-gray-200 flex overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full" 
                    style={{ width: `${Math.round((issueStats.open / issueStats.total) * 100)}%` }} 
                  />
                  <div 
                    className="bg-purple-500 h-full" 
                    style={{ width: `${Math.round((issueStats.inProgress / issueStats.total) * 100)}%` }} 
                  />
                  <div 
                    className="bg-green-500 h-full" 
                    style={{ width: `${Math.round((issueStats.resolved / issueStats.total) * 100)}%` }} 
                  />
                  <div 
                    className="bg-gray-500 h-full" 
                    style={{ width: `${Math.round((issueStats.closed / issueStats.total) * 100)}%` }} 
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
          </div>
          
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
                        <TableCell className="capitalize">{issue.type}</TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                            {issue.severity}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getIssueStatusColor(issue.status)}`}>
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
              {/* Open issues tab content */}
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
                        <TableCell className="capitalize">{issue.type}</TableCell>
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
              {/* In Progress issues tab content - similar structure */}
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
                        <TableCell className="capitalize">{issue.type}</TableCell>
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
              {/* Resolved issues tab content - similar structure */}
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
                        <TableCell className="capitalize">{issue.type}</TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                            {issue.severity}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getIssueStatusColor(issue.status)}`}>
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
    </div>
  )
} 