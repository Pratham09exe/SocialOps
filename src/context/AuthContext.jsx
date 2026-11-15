import React, { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../api/authApi';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('socialops_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [authLoading, setAuthLoading] = useState(true);

  // Validate session against GET /api/v1/auth/me on mount if token exists
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('socialops_token');
      if (token) {
        try {
          const profile = await authApi.getMe();
          const verifiedUser = {
            id: profile.account_id,
            name: profile.full_name,
            email: profile.email,
            role: profile.role.toLowerCase(),
            roleTitle: profile.role_title,
            clientId: profile.client_id,
            token: token,
            avatar: profile.avatar || (
              profile.role.toLowerCase() === 'admin' 
                ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                : profile.role.toLowerCase() === 'employee'
                ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
            )
          };
          setUser(verifiedUser);
          localStorage.setItem('socialops_user', JSON.stringify(verifiedUser));
        } catch (err) {
          // Token is invalid or expired
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            setUser(null);
            localStorage.removeItem('socialops_user');
            localStorage.removeItem('socialops_token');
          }
        }
      }
      setAuthLoading(false);
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    // 1. Strict frontend Gmail validation & normalization
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Email address is required.');
    }
    if (!cleanEmail.endsWith('@gmail.com')) {
      throw new Error('Only @gmail.com email addresses are permitted. Please enter a valid Gmail address.');
    }

    try {
      // 2. Authenticate against FastAPI backend with JWT
      const data = await authApi.login(cleanEmail, password);
      const token = data.access_token;
      const profile = data.user;

      const authenticatedUser = {
        id: profile.account_id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role.toLowerCase(),
        roleTitle: profile.role_title,
        clientId: profile.client_id,
        token: token,
        avatar: profile.avatar || (
          profile.role.toLowerCase() === 'admin' 
            ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
            : profile.role.toLowerCase() === 'employee'
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
        )
      };

      localStorage.setItem('socialops_token', token);
      localStorage.setItem('socialops_user', JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
      return { success: true, user: authenticatedUser };
    } catch (error) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || 'Authentication failed. Please verify your Gmail credentials.');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    }
    setUser(null);
    localStorage.removeItem('socialops_user');
    localStorage.removeItem('socialops_token');
  };

  // Active role mapping from session
  const activeRole = user?.role || '';

  return (
    <AuthContext.Provider value={{
      user,
      activeRole,
      login,
      logout,
      isAuthenticated: !!user,
      authLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
