import { supabase, Client, ClientInsert, ClientUpdate } from '../lib/supabase'

export const clientService = {
  async createClient(client: Omit<ClientInsert, 'user_id'>): Promise<Client> {
    // Get the current user's ID
    const { data: authData } = await supabase.auth.getUser()
    
    if (!authData?.user) {
      throw new Error('User not authenticated')
    }
    
    // Add the user_id to the client data
    const clientWithUserId: ClientInsert = {
      ...client,
      user_id: authData.user.id
    }
    
    const { data, error } = await supabase
      .from('clients')
      .insert(clientWithUserId)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating client:', error)
      throw error
    }
    
    return data
  },
  
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching clients:', error)
      throw error
    }
    
    return data || []
  },
  
  async getClientById(id: string): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error(`Error fetching client with id ${id}:`, error)
      throw error
    }
    
    return data
  },
  
  async updateClient(id: string, updates: ClientUpdate): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error(`Error updating client with id ${id}:`, error)
      throw error
    }
    
    return data
  },
  
  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error(`Error deleting client with id ${id}:`, error)
      throw error
    }
  }
} 