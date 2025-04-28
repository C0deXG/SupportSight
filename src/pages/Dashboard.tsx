import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Users, FolderKanban, Bug, Clock, AlertTriangle, FileText, Calendar } from 'lucide-react'
import { clientService } from '../services/clientService'
import { projectService } from '../services/projectService'
import { issueService } from '../services/issueService'
import { useToast } from '../components/ui/use-toast'
import { Link } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import DashboardCalendar from '../components/DashboardCalendar'
import type { Project } from '../lib/supabase'
import type { Issue } from '../services/issueService'

export default function Dashboard() {
  const [stats, setStats] = useState({
    clients: 0,
    projects: 0,
    issues: 0,
    highSeverityIssues: 0,
    resolvedIssues: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [topClients, setTopClients] = useState<any[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)
        
        // Get clients
        const clients = await clientService.getClients()
        
        // Get projects
        const projects = await projectService.getProjects()
        setProjects(projects)
        
        // Get issues
        const issues = await issueService.getIssues()
        setIssues(issues)
        
        // Count high severity issues and resolved issues
        const highSeverityIssues = issues.filter(issue => 
          issue.severity === 'high' || issue.severity === 'critical'
        ).length
        
        const resolvedIssues = issues.filter(issue => 
          issue.status === 'resolved' || issue.status === 'closed'
        ).length
        
        // Set stats
        setStats({
          clients: clients.length,
          projects: projects.length,
          issues: issues.length,
          highSeverityIssues,
          resolvedIssues
        })
        
        // Create recent activity from newest items (up to 8)
        const activities = [
          ...issues.map(issue => ({
            id: issue.id,
            type: 'issue',
            title: issue.title,
            client: issue.projects?.clients?.name || 'Unknown Client',
            timestamp: new Date(issue.created_at).toLocaleString(),
            status: issue.status,
            entityId: issue.id,
            action: 'created'
          })),
          ...projects.map(project => ({
            id: project.id,
            type: 'project',
            title: project.name,
            client: project.clients?.name || 'Unknown Client',
            timestamp: new Date(project.created_at).toLocaleString(),
            status: project.status,
            entityId: project.id,
            action: 'created'
          }))
        ]
        
        // Sort by newest first and take first 8
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setRecentActivity(activities.slice(0, 8))
        
        // Calculate top clients with most projects/issues
        const clientsWithStats = clients.map(client => {
          const clientProjects = projects.filter(project => project.client_id === client.id).length;
          const clientIssues = issues.filter(issue => issue.projects?.client_id === client.id).length;
          
          return {
            ...client,
            projectCount: clientProjects,
            issueCount: clientIssues,
            totalItems: clientProjects + clientIssues
          };
        });
        
        // Sort by total projects and issues, take top 5
        clientsWithStats.sort((a, b) => b.totalItems - a.totalItems);
        setTopClients(clientsWithStats.slice(0, 5));
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboardData()
  }, [toast])

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'critical':
      case 'open':
        return 'bg-red-50 text-red-700'
      case 'in_progress':
      case 'active':
        return 'bg-blue-50 text-blue-700'
      case 'resolved':
      case 'completed':
      case 'closed':
        return 'bg-green-50 text-green-700'
      case 'on_hold':
        return 'bg-yellow-50 text-yellow-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ')
  }

  const getActionText = (activity: any) => {
    if (activity.type === 'issue') {
      return `New issue created`;
    } else if (activity.type === 'project') {
      return `New project added`;
    }
    return 'Activity logged';
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your SupportSight system.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.clients}</div>
            <p className="text-xs text-muted-foreground">
              Active client relationships
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.projects}</div>
            <p className="text-xs text-muted-foreground">
              Ongoing projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.issues}</div>
            <p className="text-xs text-muted-foreground">
              Issues requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.highSeverityIssues}</div>
            <p className="text-xs text-muted-foreground">
              Critical priority issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Issues</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.resolvedIssues}</div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved issues
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        {/* Top Clients */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : topClients.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No clients yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <Link to="/clients" className="hover:underline">{client.name}</Link>
                      </TableCell>
                      <TableCell>{client.projectCount}</TableCell>
                      <TableCell>{client.issueCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : recentActivity.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No recent activity</div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={`${activity.type}-${activity.id}`}
                    className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        <Link to={activity.type === 'issue' ? '/issues' : '/projects'} className="hover:underline">
                          {getActionText(activity)}
                        </Link>
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{activity.title}</span>
                        <span className="text-xs text-muted-foreground">({activity.client})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(activity.status)}`}>
                        {formatStatus(activity.status)}
                      </span>
                      <span className="text-sm text-muted-foreground">{activity.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Calendar - moved to the bottom */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading calendar...</div>
          ) : (
            <DashboardCalendar projects={projects} issues={issues} />
          )}
        </CardContent>
      </Card>
    </div>
  )
} 