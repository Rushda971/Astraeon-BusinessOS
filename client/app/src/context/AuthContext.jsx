import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiRequest, clearToken, getToken } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!getToken()) {
      clearToken();
      setLoading(false);
      return () => { active = false; };
    }

    apiRequest('/api/auth/profile', { authenticated: true })
      .then((response) => { if (active) setUser(response.data.user); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const logout = useCallback(() => {
    apiRequest('/api/auth/logout', { method: 'POST', authenticated: true }).catch(() => undefined);
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, isAuthenticated: Boolean(user), logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
