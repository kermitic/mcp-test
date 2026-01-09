import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Login from './components/Login';
import StoreForm from './components/StoreForm';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!session) {
    return <Login supabase={supabase} />;
  }

  return <StoreForm supabase={supabase} session={session} />;
}

export default App;
