import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Calendar, Clock, AlertCircle } from 'lucide-react'
import { issueService } from '../services/issueService'
import { useToast } from '../components/ui/use-toast'
import type { Issue } from '../services/issueService'

export default function SharedIssue() {
  const { issueId } = useParams<{ issueId: string }>()
  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (issueId) {
      loadIssue(issueId)
    }
  }, [issueId])

  const loadIssue = async (id: string) => {
    try {
      setLoading(true)
      // We'll need to add this method to the issueService
      const data = await issueService.getIssueByIdPublic(id)
      setIssue(data)
    } catch (error) {
      console.error('Error loading issue:', error)
      toast({
        title: "Error",
        description: "Failed to load issue details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800'
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading issue details...</p>
        </div>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Issue Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <p>The issue you're looking for doesn't exist or you don't have permission to view it.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{issue.title}</CardTitle>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
              {issue.status.replace('_', ' ')}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project info */}
          <div className="text-sm text-muted-foreground">
            Project: {issue.projects?.name || 'Unknown'}
          </div>

          {/* Issue metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created on</p>
                <p className="text-sm">{formatDate(issue.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Due date</p>
                <p className="text-sm">{formatDate(issue.due_date)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Severity</p>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getSeverityColor(issue.severity)}`}>
                {issue.severity}
              </div>
            </div>
          </div>

          {/* Description */}
          {issue.description && (
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <div className="text-sm p-4 bg-muted rounded-md">
                {issue.description.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Client Note */}
          {issue.client_note && (
            <div>
              <h3 className="text-sm font-medium mb-2">Notes</h3>
              <div className="text-sm p-4 bg-muted rounded-md">
                {issue.client_note.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 