import { supabase } from '../lib/supabase'
import type { Issue as SupabaseIssue, IssueInsert, IssueUpdate, IssueStatus, IssueSeverity, IssueType } from '../lib/supabase'
import type { Project } from '../lib/supabase'

// Enhanced issue type with joined relations
export interface Issue extends SupabaseIssue {
  projects?: Project & {
    clients?: {
      name: string;
      id: string;
    }
  };
  client_note?: string | null;
  is_shared?: boolean | null;
}

// Add a specific type for the simplified error log results
interface ParsedErrorLog {
  id: string;
  title: string;
  error_pattern: string | null;
  error_trace: string | null;
  created_at: string;
  projects?: {
    name: string;
    clients?: {
      name: string;
    }
  };
}

export type IssueCreate = Omit<IssueInsert, 'id' | 'created_at' | 'updated_at'>

export const issueService = {
  async createIssue(issue: IssueCreate) {
    // Get the current user's ID
    const { data: authData } = await supabase.auth.getUser()
    
    if (!authData?.user) {
      throw new Error('User not authenticated')
    }
    
    // We don't add user_id to the issue data since the issues table doesn't have this column
    // Instead, RLS will check ownership through project -> client -> user relationship
    
    const { data, error } = await supabase
      .from('issues')
      .insert(issue)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  },

  async getIssues() {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        projects:project_id (
          *,
          clients:client_id (
            name,
            id
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data as Issue[]
  },

  async updateIssue(id: string, updates: Partial<IssueCreate>) {
    const { data, error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  },
  
  // Update issue sharing settings
  async updateIssueSharing(id: string, is_shared: boolean, client_note?: string) {
    const { data, error } = await supabase
      .from('issues')
      .update({ 
        is_shared,
        client_note: client_note || null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  },

  async deleteIssue(id: string) {
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return true
  },

  async getIssuesByProject(projectId: string) {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        projects:project_id (
          *,
          clients:client_id (
            name,
            id
          )
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data as Issue[]
  },
  
  // Get a single issue by ID (authenticated)
  async getIssueById(id: string) {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        projects:project_id (
          *,
          clients:client_id (
            name,
            id
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    return data as Issue
  },
  
  // Public method to get a single issue by ID without authentication
  async getIssueByIdPublic(id: string) {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        projects:project_id (
          name
        )
      `)
      .eq('id', id)
      .eq('is_shared', true)
      .single()

    if (error) {
      throw error
    }

    return data as Issue
  },
  
  // Public method to get issues for a project without authentication
  async getIssuesByProjectPublic(projectId: string) {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        projects:project_id (
          name
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data as Issue[]
  },
  
  // Get shareable link for an issue
  getShareableLink(issueId: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/share/issue/${issueId}`
  },
  
  async getParsedErrorLogs() {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        id,
        title,
        error_pattern,
        error_trace,
        created_at,
        projects:project_id (
          name,
          clients:client_id (
            name
          )
        )
      `)
      .not('error_pattern', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      throw error
    }

    return data as unknown as ParsedErrorLog[]
  }
} 