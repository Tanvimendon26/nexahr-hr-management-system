import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
  companyName: string;
  updateCompanyNameInState: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('nexahr_token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [companyName, setCompanyName] = useState('NexaHR Enterprise');

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Safe API Fetch Client with Auth Headers
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(url, { ...options, headers });
    
    // If unauthorized, auto-logout (except for login requests)
    if (response.status === 401 && !url.includes('/api/auth/login')) {
      setToken(null);
      setUser(null);
      localStorage.removeItem('nexahr_token');
      showToast('Session expired. Please log in again.', 'error');
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${response.status}`);
    }

    // Check if CSV download (to avoid parsing json)
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('text/csv')) {
      return response.text();
    }

    return response.json();
  };

  // Verify token and fetch profile on load
  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch('/api/auth/me');
        setUser(data.user);
        
        // Fetch settings company name
        const settings = await apiFetch('/api/settings').catch(() => ({ companyName: 'NexaHR Enterprise' }));
        if (settings && settings.companyName) {
          setCompanyName(settings.companyName);
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        setToken(null);
        setUser(null);
        localStorage.removeItem('nexahr_token');
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('nexahr_token', newToken);
    showToast(`Welcome back, ${newUser.email}!`, 'success');
  };

  const logout = async () => {
    if (token) {
      await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('nexahr_token');
    showToast('Logged out successfully.', 'info');
  };

  const updateCompanyNameInState = (name: string) => {
    setCompanyName(name);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        showToast,
        toasts,
        removeToast,
        apiFetch,
        companyName,
        updateCompanyNameInState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
