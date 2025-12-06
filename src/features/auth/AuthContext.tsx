import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  role: string | null;
}

const AuthContext = createContext<AuthContextType>({ session: null, loading: true, role: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    setRole(data?.role || 'VIEWER');
    setLoading(false);
  };

  return <AuthContext.Provider value={{ session, loading, role }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);