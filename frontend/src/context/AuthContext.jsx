import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import api from '../api/axiosClient';

const AuthContext = createContext(null);

function normalizeUser(user) {
  if (!user) return null;

  return {
    ...user,
    displayName: user.username || user.email,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Try to restore session from stored access token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    authApi.me()
      .then(res => setUser(normalizeUser(res.data)))
      .catch(() => {
        localStorage.removeItem('access_token');
        delete api.defaults.headers.common['Authorization'];
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier, password) => {
    const res = await authApi.login(identifier, password);
    const { accessToken } = res.data;
    localStorage.setItem('access_token', accessToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    const meRes = await authApi.me();
    const userData = normalizeUser(meRes.data);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (username, email, password) => {
    return authApi.register(username, email, password);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('csrf_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    await authApi.deleteAccount();
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('csrf_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  const value = { user, setUser, loading, login, register, logout, deleteAccount };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
