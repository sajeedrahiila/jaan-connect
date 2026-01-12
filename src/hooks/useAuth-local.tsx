import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role?: 'admin' | 'moderator' | 'user';
}

interface Session {
  token: string;
  expires_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      const storedToken = localStorage.getItem('session_token');
      
      if (storedToken) {
        try {
          const response = await fetch(`${API_URL}/api/auth/user`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setSession({ token: storedToken, expires_at: '' });
            setIsAdmin(data.user.role === 'admin');
          } else {
            // Invalid session, clear it
            localStorage.removeItem('session_token');
          }
        } catch (error) {
          console.error('Failed to load session:', error);
          localStorage.removeItem('session_token');
        }
      }
      
      setIsLoading(false);
    };
    
    loadSession();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        return { error: new Error(data.error || 'Failed to sign in') };
      }
      
      const data = await response.json();
      setUser(data.user);
      setSession(data.session);
      setIsAdmin(data.user.role === 'admin');
      
      // Store token in localStorage
      localStorage.setItem('session_token', data.session.token);
      
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to sign in') };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, fullName }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        return { error: new Error(data.error || 'Failed to sign up') };
      }
      
      const data = await response.json();
      setUser(data.user);
      setSession(data.session);
      setIsAdmin(data.user.role === 'admin');
      
      // Store token in localStorage
      localStorage.setItem('session_token', data.session.token);
      
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to sign up') };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const token = localStorage.getItem('session_token');
      
      if (token) {
        await fetch(`${API_URL}/api/auth/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Failed to sign out:', error);
    } finally {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      localStorage.removeItem('session_token');
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    // Password reset not implemented yet for local PostgreSQL
    // You would need to implement email functionality
    return { error: new Error('Password reset not implemented yet') };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}
