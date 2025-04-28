import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

console.log('Supabase URL:', supabaseUrl)
console.log('Initializing Supabase client...')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-my-custom-header': 'my-app-name',
    },
  },
})

// Add this debug function
export const checkAuth = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  console.log('Current user:', user)
  console.log('Auth error:', error)
  return user
}

// Add a debug function
export const debugSupabaseConnection = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Current auth state:', { user: user?.email, error: authError })

    const { data, error } = await supabase
      .from('clients')
      .select('count(*)')
    console.log('Test query result:', { data, error })

    return { user, data, authError, queryError: error }
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return { error }
  }
}

// Add this to your supabase.js file
export const testConnection = async () => {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Auth state:', {
      user: user?.email,
      id: user?.id,
      error: authError
    });

    // Test RLS
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('count(*)');
    
    console.log('📊 Data access:', {
      success: !clientsError,
      count: clients?.[0]?.count,
      error: clientsError
    });

    return {
      auth: { user, error: authError },
      data: { clients, error: clientsError }
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { error };
  }
}; 