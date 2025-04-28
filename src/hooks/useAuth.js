import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('🔑 Auth Check:', {
        user: user?.email,
        id: user?.id,
        error
      });
      setUser(user);
    } catch (error) {
      console.error('❌ Auth Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 Auth Hook Initializing...');
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('👤 Auth State Change:', {
        event: _event,
        user: session?.user?.email,
        id: session?.user?.id
      });
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('🔄 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const clearSession = async () => {
    console.log('🧹 Clearing session...');
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Session cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    refreshUser: checkUser,
    clearSession
  };
}; 