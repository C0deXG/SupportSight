const createNewClient = async (clientData) => {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('Current user:', user)
    
    if (userError || !user) {
      console.error('Auth error:', userError)
      return null
    }

    // Try to create the client
    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...clientData,
        user_id: user.id
      })
      .select('*, user_id')
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return null
    }

    console.log('Created client:', data)

    // Verify the client was created with correct user_id
    const { data: verification, error: verificationError } = await supabase
      .from('clients')
      .select('*, user_id')
      .eq('id', data.id)
      .single()

    console.log('Verification check:', verification)
    if (verificationError) {
      console.error('Verification error:', verificationError)
    }

    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
} 