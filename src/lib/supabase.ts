import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables for Supabase')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Type definitions for our database tables
export type Client = Database['public']['Tables']['clients']['Row']
export type Project = Database['public']['Tables']['projects']['Row'] & {
  clients?: Client;
  issues?: Issue[];
}
export type Issue = Database['public']['Tables']['issues']['Row']

export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type IssueInsert = Database['public']['Tables']['issues']['Insert']

export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type IssueUpdate = Database['public']['Tables']['issues']['Update']

export type IssueType = Database['public']['Enums']['issue_type']
export type IssueSeverity = Database['public']['Enums']['issue_severity']
export type IssueStatus = Database['public']['Enums']['issue_status']
export type ProjectStatus = Database['public']['Enums']['project_status'] | 'in_progress' 