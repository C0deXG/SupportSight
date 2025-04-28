export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          notes: string | null
          created_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          client_id: string
          name: string
          description: string | null
          status: Database['public']['Enums']['project_status']
          start_date: string | null
          end_date: string | null
          progress_percentage: string | null
          estimated_hours: string | null
          created_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          description?: string | null
          status?: Database['public']['Enums']['project_status']
          start_date?: string | null
          end_date?: string | null
          progress_percentage?: string | null
          estimated_hours?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          description?: string | null
          status?: Database['public']['Enums']['project_status']
          start_date?: string | null
          end_date?: string | null
          progress_percentage?: string | null
          estimated_hours?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
      }
      issues: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          type: 'bug' | 'feature' | 'task'
          severity: 'low' | 'medium' | 'high' | 'critical'
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          assigned_to: string | null
          due_date: string | null
          error_trace: string | null
          error_pattern: string | null
          ai_analysis: Json | null
          created_at: string
          updated_at: string
          user_id: string | null
          client_note: string | null
          is_shared: boolean | null
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          type?: 'bug' | 'feature' | 'task'
          severity?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          assigned_to?: string | null
          due_date?: string | null
          error_trace?: string | null
          error_pattern?: string | null
          ai_analysis?: Json | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
          client_note?: string | null
          is_shared?: boolean | null
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          type?: 'bug' | 'feature' | 'task'
          severity?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          assigned_to?: string | null
          due_date?: string | null
          error_trace?: string | null
          error_pattern?: string | null
          ai_analysis?: Json | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
          client_note?: string | null
          is_shared?: boolean | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      issue_severity: 'low' | 'medium' | 'high' | 'critical'
      issue_status: 'open' | 'in_progress' | 'resolved' | 'closed'
      issue_type: 'bug' | 'feature' | 'task'
      project_status: 'active' | 'completed' | 'on_hold' | 'planned' | 'cancelled' | 'in_progress'
    }
  }
} 