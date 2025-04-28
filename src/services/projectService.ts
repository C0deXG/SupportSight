import { supabase, Project, ProjectInsert, ProjectUpdate, ProjectStatus } from '../lib/supabase'

export const projectService = {
  async createProject(project: Omit<ProjectInsert, 'user_id'>): Promise<Project> {
    // Get the current user's ID
    const { data: authData } = await supabase.auth.getUser()
    
    if (!authData?.user) {
      throw new Error('User not authenticated')
    }
    
    // Add the user_id to the project data
    const projectWithUserId: ProjectInsert = {
      ...project,
      user_id: authData.user.id
    }
    
    const { data, error } = await supabase
      .from('projects')
      .insert(projectWithUserId)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating project:', error)
      throw error
    }
    
    return data
  },
  
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, clients(*)')
      .order('name')
    
    if (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
    
    return data || []
  },
  
  async getProjectById(id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, clients(*), issues(*)')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error(`Error fetching project with id ${id}:`, error)
      throw error
    }
    
    return data
  },
  
  // Public method to get a project by ID without authentication
  async getProjectByIdPublic(id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, clients(name)')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error(`Error fetching public project with id ${id}:`, error)
      throw error
    }
    
    return data
  },
  
  async getProjectsByClientId(clientId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error(`Error fetching projects for client ${clientId}:`, error)
      throw error
    }
    
    return data || []
  },
  
  async updateProject(id: string, updates: ProjectUpdate): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error(`Error updating project with id ${id}:`, error)
      throw error
    }
    
    return data
  },
  
  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error(`Error deleting project with id ${id}:`, error)
      throw error
    }
  },

  // Get shareable link for a project
  getShareableLink(projectId: string): string {
    // This should be based on your application's actual domain
    const baseUrl = window.location.origin
    return `${baseUrl}/shared-project/${projectId}`
  },

  getProjectStatusOptions(): { value: ProjectStatus, label: string }[] {
    return [
      { value: 'planned', label: 'Planned' },
      { value: 'active', label: 'Active' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'on_hold', label: 'On Hold' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' }
    ]
  }
} 