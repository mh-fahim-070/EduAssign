import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string, expectedRole?: UserRole) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('jwt_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string, expectedRole?: UserRole) => {
    setError(null);
    try {
      const res = await api.login(email, pass, expectedRole);
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('jwt_token', res.data.token);
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (data: { name: string; email: string; password: string; role: UserRole }) => {
    setError(null);
    try {
      const res = await api.register(data);
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('jwt_token', res.data.token);
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const forgotPassword = async (email: string): Promise<string> => {
    setError(null);
    try {
      const res = await api.forgotPassword(email);
      return res.message || 'Reset link sent successfully';
    } catch (err: any) {
      setError(err.message || 'Password reset request failed');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('auth_user');
  };

  const quickSwitchRole = async (role: UserRole) => {
    let email = 'admin@school.edu';
    let pass = 'Admin123!';

    if (role === 'Teacher') {
      email = 'john.doe@school.edu';
      pass = 'Teacher123!';
    } else if (role === 'Student') {
      email = 'alex.jones@student.edu';
      pass = 'Student123!';
    }

    await login(email, pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        forgotPassword,
        logout,
        quickSwitchRole,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
