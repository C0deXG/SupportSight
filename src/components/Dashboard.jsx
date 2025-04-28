import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const Dashboard = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    console.log('📊 Starting data fetch...', {
      userEmail: user?.email,
      userId: user?.id
    });

    try {
      if (!user?.id) {
        console.error('❌ No user ID available');
        setError('Authentication required');
        return;
      }

      setLoading(true);

      // Test auth state
      const { data: authCheck } = await supabase.auth.getUser();
      console.log('🔑 Current auth state:', {
        user: authCheck.user?.email,
        id: authCheck.user?.id
      });

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          projects:projects(
            id,
            name,
            status
          ),
          issues:issues(
            id,
            title,
            status,
            severity
          )
        `)
        .eq('user_id', user.id);

      console.log('📥 Query results:', {
        success: !clientsError,
        count: clientsData?.length,
        error: clientsError?.message,
        data: clientsData
      });

      if (clientsError) {
        console.error('❌ Error fetching clients:', clientsError);
        setError(clientsError.message);
        return;
      }

      const validClients = clientsData?.filter(client => client.user_id === user.id) || [];
      console.log('✅ Valid clients:', {
        total: clientsData?.length,
        valid: validClients.length,
        filtered: clientsData?.length - validClients.length
      });

      setClients(validClients);
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when user changes
  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    } else {
      setClients([]); // Clear data when no user
    }
  }, [user?.id]);

  // Clear data on unmount
  useEffect(() => {
    return () => {
      setClients([]);
    };
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="debug-info" style={{ display: 'none' }}>
        <pre>
          {JSON.stringify({
            currentUser: user?.email,
            userId: user?.id,
            clientCount: clients.length,
            clientIds: clients.map(c => c.id)
          }, null, 2)}
        </pre>
      </div>
      
      {/* Rest of your dashboard UI */}
    </div>
  );
}; 