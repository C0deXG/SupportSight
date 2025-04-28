import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const ClientForm = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error checking user:', error);
      return;
    }
    setUser(user);
  };

  const verifyUserAccess = async () => {
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('clients')
      .select('count(*)')
      .eq('user_id', user.id)
      .single();
      
    if (error) {
      console.error('Error verifying access:', error);
      return false;
    }
    
    console.log('Current user clients count:', data.count);
    return true;
  };

  const createClient = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const hasAccess = await verifyUserAccess();
      if (!hasAccess) {
        setError('Access verification failed');
        return null;
      }

      if (!user) {
        setError('Must be logged in to create clients');
        return null;
      }

      // Insert with explicit user_id
      const { data, error: insertError } = await supabase
        .from('clients')
        .insert({
          ...formData,
          user_id: user.id
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Error creating client:', insertError);
        setError(insertError.message);
        return null;
      }

      // Verify the insert
      const { data: verification, error: verifyError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', data.id)
        .single();

      if (verifyError) {
        console.error('Error verifying client:', verifyError);
        setError('Created but could not verify');
        return data;
      }

      console.log('Successfully created and verified client:', verification);
      return verification;

    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createClient,
    loading,
    error,
    user
  };
}; 