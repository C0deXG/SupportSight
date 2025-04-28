import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '../components/ui/card'
import { Input } from '../components/ui/input'
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
import { Plus, Search, AlertCircle, FileText, CheckCircle, Bug, CheckIcon, Trash2 } from 'lucide-react'
import { issueService } from '../services/issueService'
import type { Issue, IssueCreate } from '../services/issueService'
import { projectService } from '../services/projectService'
import type { Project } from '../lib/supabase'
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
import { Textarea } from '../components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useAuth } from '../lib/AuthContext'
import { Switch } from '../components/ui/switch'

// Types for regex pattern matching and highlighting
interface RegexMatch {
  pattern: RegExp;
  matches: {
    fullMatch: string;
    groups: string[];
    startIndex: number;
    endIndex: number;
  }[];
  label: string;
  color: string;
}

export default function Issues() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [issues, setIssues] = useState<Issue[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()
  const [newIssue, setNewIssue] = useState<Partial<IssueCreate>>({
    title: '',
    description: '',
    project_id: '',
    type: 'bug',
    severity: 'medium',
    status: 'open',
    assigned_to: '',
    due_date: '',
    error_trace: ''
  })
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [selectedIssueForDetails, setSelectedIssueForDetails] = useState<Issue | null>(null)
  const [issueDetailsOpen, setIssueDetailsOpen] = useState(false)
  const [parsedErrorInfo, setParsedErrorInfo] = useState<string | null>(null)
  const [highlightedErrorMatches, setHighlightedErrorMatches] = useState<RegexMatch[]>([])
  const [isParsingError, setIsParsingError] = useState(false)
  const [recentErrorLogs, setRecentErrorLogs] = useState<Issue[]>([])
  const [shareEnabled, setShareEnabled] = useState(false)
  const [clientNote, setClientNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [linkGenerated, setLinkGenerated] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    loadIssues()
    loadProjects()
    loadRecentErrorLogs()
  }, [])

  const loadIssues = async () => {
    try {
      setLoading(true)
      const data = await issueService.getIssues()
      setIssues(data || [])
    } catch (error) {
      console.error('Error loading issues:', error)
      toast({
        title: "Error",
        description: "Failed to load issues",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects()
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadRecentErrorLogs = async () => {
    try {
      const data = await issueService.getParsedErrorLogs()
      setRecentErrorLogs(data as unknown as Issue[])
    } catch (error) {
      console.error('Error loading recent error logs:', error)
    }
  }

  // Enhanced error parsing function
  const parseErrorTrace = (errorTrace: string) => {
    setIsParsingError(true)
    
    try {
      // Create an array to store all regex patterns and their matches
      const allMatches: RegexMatch[] = [
        // Standard error pattern - Error: message at file:line:column
        findAllMatches(
          errorTrace,
          /Error:\s+(.+?)\s+at\s+(.+?):(\d+):(\d+)/g,
          "Error Location",
          "red"
        ),
        
        // Stack trace pattern - at function (file:line:column)
        findAllMatches(
          errorTrace,
          /at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/g,
          "Stack Entry",
          "orange"
        ),
        
        // TypeScript/ESLint errors - file:line:column - message
        findAllMatches(
          errorTrace,
          /([a-zA-Z0-9\/\\.\\-_]+\.(?:ts|tsx|js|jsx))(?::|\s*\(?)(\d+)(?::|\s*,\s*)(\d+)(?:\)?)?\s*(?:-|–)\s*(.+)/g,
          "Compiler Error",
          "blue"
        ),
        
        // Module not found errors
        findAllMatches(
          errorTrace,
          /Cannot find module\s*['"]([^'"]+)['"]/g,
          "Missing Module",
          "purple"
        ),

        // TypeScript type errors
        findAllMatches(
          errorTrace,
          /Type\s+'(.+?)'\s+is\s+not\s+assignable\s+to\s+type\s+'(.+?)'/g,
          "Type Error",
          "teal"
        ),
        
        // React specific errors
        findAllMatches(
          errorTrace,
          /React.createElement:\s+type\s+is\s+invalid\s+--\s+expected\s+a\s+string\s+or\s+a\s+class\/function\s+but\s+got:\s+(.+?)\./g,
          "React Error",
          "pink"
        )
      ];
      
      // Filter out patterns with no matches
      const matchesFound = allMatches.filter(m => m.matches.length > 0);
      
      // Set the highlighted matches for rendering
      setHighlightedErrorMatches(matchesFound);
      
      // Build a summary for the error_pattern field
      let summaryInfo = "";
      
      if (matchesFound.length > 0) {
        // Take the first match of each type for the summary
        summaryInfo = matchesFound.map(match => {
          const firstMatch = match.matches[0];
          // Format based on the pattern type
          if (match.label === "Error Location") {
            const [_, message, file, line, col] = [firstMatch.fullMatch, ...firstMatch.groups];
            return `Error in ${file} at line ${line}, column ${col}: ${message}`;
          } else if (match.label === "Stack Entry") {
            const [_, func, file, line, col] = [firstMatch.fullMatch, ...firstMatch.groups];
            return `Stack: ${func} in ${file} at line ${line}`;
          } else if (match.label === "Compiler Error") {
            const [_, file, line, col, message] = [firstMatch.fullMatch, ...firstMatch.groups];
            return `${file}:${line}:${col} - ${message}`;
          } else if (match.label === "Missing Module") {
            return `Missing module: ${firstMatch.groups[0]}`;
          } else if (match.label === "Type Error") {
            return `Type '${firstMatch.groups[0]}' is not assignable to type '${firstMatch.groups[1]}'`;
          } else if (match.label === "React Error") {
            return `React error: invalid element type ${firstMatch.groups[0]}`;
          }
          return match.matches[0].fullMatch;
        }).join("\n");
      } else {
        // If no specific patterns matched, use the first line as a generic error message
        const firstLine = errorTrace.split('\n')[0]?.trim();
        if (firstLine) {
          summaryInfo = firstLine;
        } else {
          summaryInfo = "Unknown error format";
        }
      }
      
      setParsedErrorInfo(summaryInfo);
      return summaryInfo;
    } catch (error) {
      console.error('Error parsing error trace:', error);
      setParsedErrorInfo("Failed to parse error message");
      setHighlightedErrorMatches([]);
      return null;
    } finally {
      setIsParsingError(false);
    }
  }

  // Helper function to find all regex matches in a text
  const findAllMatches = (text: string, pattern: RegExp, label: string, color: string): RegexMatch => {
    const matches: {
      fullMatch: string;
      groups: string[];
      startIndex: number;
      endIndex: number;
    }[] = [];
    
    let match;
    // Need to create a new RegExp to ensure we start from the beginning each time
    const regex = new RegExp(pattern);
    
    while ((match = regex.exec(text)) !== null) {
      // Avoid infinite loops with zero-width matches
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      
      matches.push({
        fullMatch: match[0],
        groups: match.slice(1),
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    
    return {
      pattern,
      matches,
      label,
      color
    };
  }

  // Function to render text with highlighted matches
  const renderErrorWithHighlights = (text: string, matches: RegexMatch[]) => {
    if (!text || matches.length === 0) {
      return <pre className="whitespace-pre-wrap">{text}</pre>;
    }
    
    // Flatten all matches and sort by start index
    const allMatchesFlat = matches.flatMap(matchGroup => 
      matchGroup.matches.map(match => ({ 
        ...match, 
        label: matchGroup.label, 
        color: matchGroup.color 
      }))
    ).sort((a, b) => a.startIndex - b.startIndex);
    
    const result: JSX.Element[] = [];
    let lastIndex = 0;
    
    allMatchesFlat.forEach((match, idx) => {
      // Add text before this match
      if (match.startIndex > lastIndex) {
        result.push(
          <span key={`text-${idx}`} className="text-gray-400">
            {text.substring(lastIndex, match.startIndex)}
          </span>
        );
      }
      
      // Add the highlighted match with specific classes instead of dynamic template literals
      const colorClasses: Record<string, string> = {
        red: "bg-red-100 text-red-800 border-red-200",
        orange: "bg-orange-100 text-orange-800 border-orange-200",
        blue: "bg-blue-100 text-blue-800 border-blue-200",
        purple: "bg-purple-100 text-purple-800 border-purple-200",
        teal: "bg-teal-100 text-teal-800 border-teal-200",
        pink: "bg-pink-100 text-pink-800 border-pink-200",
        gray: "bg-gray-100 text-gray-800 border-gray-200"
      };
      
      const colorClass = colorClasses[match.color] || colorClasses.gray;
      
      result.push(
        <span 
          key={`match-${idx}`} 
          className={`px-1 rounded font-semibold ${colorClass}`}
          title={match.label}
        >
          {text.substring(match.startIndex, match.endIndex)}
        </span>
      );
      
      lastIndex = match.endIndex;
    });
    
    // Add any remaining text
    if (lastIndex < text.length) {
      result.push(
        <span key="text-end" className="text-gray-400">
          {text.substring(lastIndex)}
        </span>
      );
    }
    
    return <div className="whitespace-pre-wrap">{result}</div>;
  }

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIssue.title || !newIssue.project_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Parse error trace if provided
      const errorPattern = newIssue.error_trace ? parseErrorTrace(newIssue.error_trace) : null;
      
      // Use the current user's ID (UUID) as the assignee
      // This is important because the database expects a UUID, not an email
      const userId = user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Create the issue with all required fields
      const issueData: IssueCreate = {
        ...newIssue as IssueCreate,
        error_pattern: errorPattern || undefined,
        assigned_to: userId // Use UUID instead of email
      };

      const data = await issueService.createIssue(issueData)
      
      setIssues(prev => [data, ...prev])
      toast({
        title: "Success",
        description: "Issue created successfully"
      })
      setNewIssue({
        title: '',
        description: '',
        project_id: '',
        type: 'bug',
        severity: 'medium',
        status: 'open',
        assigned_to: '',
        due_date: '',
        error_trace: ''
      })
      setParsedErrorInfo(null)
      setHighlightedErrorMatches([])
    } catch (error) {
      console.error('Error creating issue:', error)
      toast({
        title: "Error",
        description: "Failed to create issue",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleUpdateIssueStatus = async (issueId: string, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    try {
      await issueService.updateIssue(issueId, { status: newStatus })
      toast({
        title: "Success",
        description: `Issue status updated to ${newStatus.replace('_', ' ')}`
      })
      loadIssues()
    } catch (error) {
      console.error('Error updating issue status:', error)
      toast({
        title: "Error",
        description: "Failed to update issue status",
        variant: "destructive"
      })
    }
  }

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.description && issue.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (issue.projects?.clients?.name && issue.projects?.clients?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (issue.projects?.name && issue.projects?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter
    
    return matchesSearch && matchesStatus && matchesSeverity
  })

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

  const getStatusColor = (status: string) => {
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

  const handleSaveAndGenerateLink = async () => {
    if (!selectedIssueForDetails) return
    
    try {
      setIsSaving(true)
      
      await issueService.updateIssueSharing(
        selectedIssueForDetails.id,
        shareEnabled,
        clientNote
      )
      
      setLinkGenerated(true)
      
      toast({
        title: "Success",
        description: shareEnabled 
          ? "Shareable link has been generated and is ready to use" 
          : "Sharing has been disabled for this issue",
      })
    } catch (error) {
      console.error('Error updating issue sharing:', error)
      toast({
        title: "Error",
        description: "Failed to update sharing settings",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const openIssueDetails = (issue: Issue) => {
    setSelectedIssueForDetails(issue)
    setIssueDetailsOpen(true)
    
    // Set the sharing states based on the issue
    setShareEnabled(issue.is_shared || false)
    setClientNote(issue.client_note || '')
    setLinkGenerated(issue.is_shared || false)
    
    // If the issue has an error trace, parse it
    if (issue.error_trace) {
      parseErrorTrace(issue.error_trace)
    } else {
      setParsedErrorInfo(null)
      setHighlightedErrorMatches([])
    }
  }

  const handleDeleteIssue = async () => {
    if (!selectedIssueForDetails) return

    try {
      setIsDeleting(true)
      await issueService.deleteIssue(selectedIssueForDetails.id)
      
      // Remove the issue from the local state
      setIssues(issues.filter(i => i.id !== selectedIssueForDetails.id))
      
      toast({
        title: "Success",
        description: "Issue deleted successfully"
      })
      setIssueDetailsOpen(false)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting issue:', error)
      toast({
        title: "Error",
        description: "Failed to delete issue",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Issues</h2>
          <p className="text-muted-foreground">Track and manage project issues and bugs.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Issue</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateIssue} className="overflow-y-auto pr-2">
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select 
                    onValueChange={(value) => setNewIssue({ ...newIssue, project_id: value })}
                    value={newIssue.project_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Issue Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter issue title"
                    value={newIssue.title}
                    onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the issue"
                    value={newIssue.description || ''}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="error_trace" className="flex items-center justify-between">
                    <span>Error Trace/Log</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.preventDefault()
                        if (newIssue.error_trace) {
                          parseErrorTrace(newIssue.error_trace)
                        }
                      }}
                      disabled={!newIssue.error_trace || isParsingError}
                    >
                      Parse Error
                    </Button>
                  </Label>
                  <Textarea
                    id="error_trace"
                    placeholder="Paste error messages or logs here for automatic parsing"
                    value={newIssue.error_trace || ''}
                    onChange={(e) => setNewIssue({ ...newIssue, error_trace: e.target.value })}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  
                  {/* Show parsed error information with highlighting */}
                  {(parsedErrorInfo || highlightedErrorMatches.length > 0) && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-sm font-medium text-blue-700 mb-2">Error Analysis:</p>
                      
                      {parsedErrorInfo && (
                        <div className="mb-2 text-xs space-y-1 text-blue-700 font-semibold">
                          {parsedErrorInfo.split('\n').map((line, index) => (
                            <div key={index}>{line}</div>
                          ))}
                        </div>
                      )}
                      
                      {highlightedErrorMatches.length > 0 && newIssue.error_trace && (
                        <div className="mt-4 border-t border-blue-200 pt-2">
                          <p className="text-xs font-medium text-blue-700 mb-1">Highlighted Error:</p>
                          <div className="text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto bg-gray-900 text-gray-100 p-2 rounded">
                            {renderErrorWithHighlights(newIssue.error_trace, highlightedErrorMatches)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select 
                      onValueChange={(value) => setNewIssue({ ...newIssue, type: value as any })}
                      value={newIssue.type}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="feature">Feature</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select 
                      onValueChange={(value) => setNewIssue({ ...newIssue, severity: value as any })}
                      value={newIssue.severity}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      onValueChange={(value) => setNewIssue({ ...newIssue, status: value as any })}
                      value={newIssue.status}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newIssue.due_date || ''}
                      onChange={(e) => setNewIssue({ ...newIssue, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Issue'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Issue List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-10 text-gray-500">Loading issues...</div>
              ) : filteredIssues.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  {searchTerm || statusFilter !== 'all' || severityFilter !== 'all' 
                    ? "No issues match your filters" 
                    : "No issues yet. Create your first issue!"}
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredIssues.map((issue) => (
                    <Card key={issue.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openIssueDetails(issue)}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg font-medium">{issue.title}</CardTitle>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                            {issue.severity}
                          </div>
                        </div>
                        <CardDescription className="text-sm flex items-center">
                          {getTypeIcon(issue.type)}
                          <span className="capitalize">{issue.type}</span>
                          {issue.projects?.name && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{issue.projects.name}</span>
                            </>
                          )}
                          {issue.projects?.clients && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{issue.projects.clients.name}</span>
                            </>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p className="line-clamp-2">{issue.description}</p>
                        
                        {issue.error_pattern && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-md border text-xs flex items-start">
                            <FileText className="h-3 w-3 mr-1 mt-0.5 text-gray-500" />
                            <span className="line-clamp-2">{issue.error_pattern}</span>
                          </div>
                        )}
                        
                        <div className={`mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                          {issue.status.replace('_', ' ')}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-1 pb-3 gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateIssueStatus(issue.id, 'open')}
                          disabled={issue.status === 'open' || selectedIssueId === issue.id}
                          className="text-xs"
                        >
                          Open
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateIssueStatus(issue.id, 'in_progress')}
                          disabled={issue.status === 'in_progress' || selectedIssueId === issue.id}
                          className="text-xs"
                        >
                          In Progress
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateIssueStatus(issue.id, 'resolved')}
                          disabled={issue.status === 'resolved' || selectedIssueId === issue.id}
                          className="text-xs"
                        >
                          Resolved
                        </Button>
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateIssueStatus(issue.id, 'closed')}
                          disabled={issue.status === 'closed' || selectedIssueId === issue.id}
                          className="text-xs"
                        >
                          Closed
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="open" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredIssues.filter(i => i.status === 'open').map((issue) => (
                  <Card key={issue.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openIssueDetails(issue)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-medium">{issue.title}</CardTitle>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </div>
                      </div>
                      <CardDescription className="text-sm flex items-center">
                        {getTypeIcon(issue.type)}
                        <span className="capitalize">{issue.type}</span>
                        {issue.projects?.name && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{issue.projects.name}</span>
                          </>
                        )}
                        {issue.projects?.clients && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{issue.projects.clients.name}</span>
                          </>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="line-clamp-2">{issue.description}</p>
                      
                      {issue.error_pattern && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md border text-xs flex items-start">
                          <FileText className="h-3 w-3 mr-1 mt-0.5 text-gray-500" />
                          <span className="line-clamp-2">{issue.error_pattern}</span>
                        </div>
                      )}
                      
                      <div className={`mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                        {issue.status.replace('_', ' ')}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-1 pb-3 gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateIssueStatus(issue.id, 'in_progress')}
                        disabled={selectedIssueId === issue.id}
                        className="text-xs"
                      >
                        In Progress
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateIssueStatus(issue.id, 'resolved')}
                        disabled={selectedIssueId === issue.id}
                        className="text-xs"
                      >
                        Resolved
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUpdateIssueStatus(issue.id, 'closed')}
                        disabled={selectedIssueId === issue.id}
                        className="text-xs"
                      >
                        Closed
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="in_progress" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredIssues.filter(i => i.status === 'in_progress').map((issue) => (
                  <Card key={issue.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openIssueDetails(issue)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-medium">{issue.title}</CardTitle>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </div>
                      </div>
                      <CardDescription className="text-sm flex items-center">
                        {getTypeIcon(issue.type)}
                        <span className="capitalize">{issue.type}</span>
                        {issue.projects?.name && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{issue.projects.name}</span>
                          </>
                        )}
                        {issue.projects?.clients && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{issue.projects.clients.name}</span>
                          </>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="line-clamp-2">{issue.description}</p>
                      
                      {issue.error_pattern && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md border text-xs flex items-start">
                          <FileText className="h-3 w-3 mr-1 mt-0.5 text-gray-500" />
                          <span className="line-clamp-2">{issue.error_pattern}</span>
                        </div>
                      )}
                      
                      <div className={`mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                        {issue.status.replace('_', ' ')}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-1 pb-3 gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateIssueStatus(issue.id, 'open')}
                        disabled={selectedIssueId === issue.id}
                        className="text-xs"
                      >
                        Open
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateIssueStatus(issue.id, 'resolved')}
                        disabled={selectedIssueId === issue.id}
                        className="text-xs"
                      >
                        Resolved
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUpdateIssueStatus(issue.id, 'closed')}
                        disabled={selectedIssueId === issue.id}
                        className="text-xs"
                      >
                        Closed
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="resolved" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredIssues.filter(i => i.status === 'resolved').map((issue) => (
                  <Card key={issue.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openIssueDetails(issue)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-medium">{issue.title}</CardTitle>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </div>
                      </div>
                      <CardDescription className="text-sm flex items-center">
                        {getTypeIcon(issue.type)}
                        <span className="capitalize">{issue.type}</span>
                        {issue.projects?.name && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{issue.projects.name}</span>
                          </>
                        )}
                        {issue.projects?.clients && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{issue.projects.clients.name}</span>
                          </>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="line-clamp-2">{issue.description}</p>
                      
                      {issue.error_pattern && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md border text-xs flex items-start">
                          <FileText className="h-3 w-3 mr-1 mt-0.5 text-gray-500" />
                          <span className="line-clamp-2">{issue.error_pattern}</span>
                        </div>
                      )}
                      
                      <div className={`mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                        {issue.status.replace('_', ' ')}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-1 pb-3 gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateIssueStatus(issue.id, 'open')}
                        disabled={selectedIssueId === issue.id}
                        className="text-xs"
                      >
                        Open
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateIssueStatus(issue.id, 'in_progress')}
                        disabled={selectedIssueId === issue.id}
                        className="text-xs"
                      >
                        In Progress
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUpdateIssueStatus(issue.id, 'closed')}
                        disabled={selectedIssueId === issue.id}
                        className="text-xs"
                      >
                        Closed
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recently Parsed Error Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recently Parsed Error Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentErrorLogs.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              <FileText className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
              <p>No error logs have been parsed yet.</p>
              <p className="text-sm mt-1">Submit new errors using the "New Issue" form and "Parse Error" button.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentErrorLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{log.title}</h4>
                    <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-black rounded text-xs text-white font-mono overflow-x-auto whitespace-pre">
                    {log.error_pattern}
                  </div>
                  {log.error_trace && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-primary">View full trace</summary>
                      <div className="p-3 bg-gray-100 rounded mt-2 text-xs font-mono overflow-x-auto whitespace-pre">
                        {log.error_trace}
                      </div>
                    </details>
                  )}
                  {log.projects && (
                    <div className="mt-2 text-xs text-gray-500">
                      Project: {log.projects.name}
                      {log.projects.clients && ` • Client: ${log.projects.clients.name}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Details Dialog - Enhanced with better error highlighting */}
      <Dialog open={issueDetailsOpen} onOpenChange={setIssueDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedIssueForDetails?.title}</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(selectedIssueForDetails?.status || 'open')}`}>
                  {selectedIssueForDetails?.status.replace('_', ' ')}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="error-analysis">Error Analysis</TabsTrigger>
              <TabsTrigger value="share">Share with Client</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6 py-4">
              {/* Issue metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Status</h4>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedIssueForDetails?.status || 'open')}`}>
                    {selectedIssueForDetails?.status.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Type</h4>
                  <div className="flex items-center">
                    {getTypeIcon(selectedIssueForDetails?.type || 'bug')}
                    <span className="capitalize">{selectedIssueForDetails?.type || 'Bug'}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Project</h4>
                  <p className="text-sm">{selectedIssueForDetails?.projects?.name || 'Unknown'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Client</h4>
                  <p className="text-sm">{selectedIssueForDetails?.projects?.clients?.name || 'Unknown'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Created At</h4>
                  <p className="text-sm">{new Date(selectedIssueForDetails?.created_at || '').toLocaleString()}</p>
                </div>
                {selectedIssueForDetails?.due_date && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Due Date</h4>
                    <p className="text-sm">{new Date(selectedIssueForDetails.due_date).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold mb-1">Assigned To</h4>
                  <p className="text-sm">{selectedIssueForDetails?.assigned_to || 'Unassigned'}</p>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Description</h4>
                <div className="bg-muted/30 p-3 rounded-md text-sm">
                  {selectedIssueForDetails?.description || 'No description provided.'}
                </div>
              </div>
              
              {/* Status update buttons */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Update Status</h4>
                <div className="flex justify-between space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedIssueForDetails) {
                        handleUpdateIssueStatus(selectedIssueForDetails.id, 'open');
                        setSelectedIssueForDetails({...selectedIssueForDetails, status: 'open'});
                      }
                    }}
                    disabled={selectedIssueForDetails?.status === 'open'}
                  >
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedIssueForDetails) {
                        handleUpdateIssueStatus(selectedIssueForDetails.id, 'in_progress');
                        setSelectedIssueForDetails({...selectedIssueForDetails, status: 'in_progress'});
                      }
                    }}
                    disabled={selectedIssueForDetails?.status === 'in_progress'}
                  >
                    In Progress
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedIssueForDetails) {
                        handleUpdateIssueStatus(selectedIssueForDetails.id, 'resolved');
                        setSelectedIssueForDetails({...selectedIssueForDetails, status: 'resolved'});
                      }
                    }}
                    disabled={selectedIssueForDetails?.status === 'resolved'}
                  >
                    Resolved
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedIssueForDetails) {
                        handleUpdateIssueStatus(selectedIssueForDetails.id, 'closed');
                        setSelectedIssueForDetails({...selectedIssueForDetails, status: 'closed'});
                      }
                    }}
                    disabled={selectedIssueForDetails?.status === 'closed'}
                  >
                    Closed
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="error-analysis" className="space-y-6 py-4">
              {selectedIssueForDetails?.error_trace ? (
                <div>
                  {/* Error Summary */}
                  {selectedIssueForDetails.error_pattern && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Error Analysis</h4>
                      <div className="bg-black p-3 rounded-md text-white font-mono text-xs overflow-x-auto mb-4">
                        {selectedIssueForDetails.error_pattern.split('\n').map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Full Error Trace with Highlighting */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Full Error Trace</h4>
                    <div className="bg-gray-900 text-gray-200 p-3 rounded-md font-mono text-xs overflow-x-auto">
                      {highlightedErrorMatches.length > 0 && selectedIssueForDetails?.error_trace
                        ? renderErrorWithHighlights(selectedIssueForDetails.error_trace, highlightedErrorMatches)
                        : <pre className="whitespace-pre-wrap">{selectedIssueForDetails?.error_trace || ''}</pre>
                      }
                    </div>
                  </div>
                  
                  {/* Parse Error Button - For re-parsing if needed */}
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedIssueForDetails?.error_trace) {
                          parseErrorTrace(selectedIssueForDetails.error_trace);
                        }
                      }}
                      disabled={isParsingError || !selectedIssueForDetails?.error_trace}
                    >
                      Re-analyze Error
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                  <p>No error trace provided for this issue.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="share" className="space-y-6 py-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Share with Client</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a shareable link for your client to view the status and updates for this issue.
                  The link will be read-only and won't require authentication.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="share-enabled"
                      checked={shareEnabled}
                      onCheckedChange={setShareEnabled}
                    />
                    <Label htmlFor="share-enabled">Enable sharing for this issue</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="client-note">Note for client (will be visible on shared page)</Label>
                    <Textarea
                      id="client-note"
                      placeholder="Add a note that will be visible to the client..."
                      value={clientNote}
                      onChange={(e) => setClientNote(e.target.value)}
                      rows={3}
                      disabled={!shareEnabled}
                    />
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Preview of Client View</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {selectedIssueForDetails ? (
                        <div className="text-xs space-y-2 border rounded-md p-3 bg-gray-50">
                          <div className="flex justify-between">
                            <span className="font-medium">{selectedIssueForDetails.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedIssueForDetails.status)}`}>
                              {selectedIssueForDetails.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-600">Project: {selectedIssueForDetails.projects?.name}</p>
                            {selectedIssueForDetails.due_date && (
                              <p className="text-gray-600">Due: {new Date(selectedIssueForDetails.due_date).toLocaleDateString()}</p>
                            )}
                          </div>
                          <div className="border-t pt-1 mt-1">
                            <p className="text-gray-600 italic">
                              {clientNote || 'No client notes added.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-2">Select an issue to preview</div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <div className="flex flex-col space-y-4">
                    <div className="relative">
                      <Input
                        id="share-link"
                        readOnly
                        value={shareEnabled && selectedIssueForDetails ? issueService.getShareableLink(selectedIssueForDetails.id) : 'Sharing is disabled for this issue'}
                        className="pr-20"
                        disabled={!shareEnabled || !linkGenerated || !selectedIssueForDetails}
                      />
                      <Button 
                        className="absolute right-1 top-1 h-7"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (selectedIssueForDetails) {
                            navigator.clipboard.writeText(issueService.getShareableLink(selectedIssueForDetails.id));
                            toast({
                              title: "Link copied",
                              description: "Shareable link copied to clipboard",
                            });
                          }
                        }}
                        disabled={!shareEnabled || !linkGenerated || !selectedIssueForDetails}
                      >
                        Copy Link
                      </Button>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          if (selectedIssueForDetails) {
                            setShareEnabled(selectedIssueForDetails.is_shared || false);
                            setClientNote(selectedIssueForDetails.client_note || '');
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        className="text-xs"
                        onClick={handleSaveAndGenerateLink}
                        disabled={isSaving || !selectedIssueForDetails}
                      >
                        {isSaving ? 'Saving...' : (linkGenerated ? 'Update Sharing' : 'Save & Generate Link')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Issue</DialogTitle>
            <DialogDescription className="pt-2">
              <div className="flex items-center space-x-2 text-amber-500 mb-2">
                <AlertCircle className="h-5 w-5" />
                <span>Warning: This action cannot be undone.</span>
              </div>
              <p>
                Are you sure you want to delete issue "{selectedIssueForDetails?.title}"?
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
              onClick={handleDeleteIssue}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 