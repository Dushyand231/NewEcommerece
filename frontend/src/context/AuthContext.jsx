import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));

  const persist = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken) localStorage.setItem('token', newToken);
    else localStorage.removeItem('token');
    if (newUser) localStorage.setItem('user', JSON.stringify(newUser));
    else localStorage.removeItem('user');
  };

  useEffect(() => {
    let active = true;
    async function loadMe() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        if (active) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (e) {
        if (active) persist(null, null);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadMe();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.token, data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    persist(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => persist(null, null), []);

  const updateUser = useCallback(
    (partial) => {
      setUser((u) => {
        const next = { ...u, ...partial };
        localStorage.setItem('user', JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
