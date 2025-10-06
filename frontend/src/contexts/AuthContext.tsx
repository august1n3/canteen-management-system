import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    studentId: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          if (response.data.success) {
            setUser(response.data.data.user);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          localStorage.removeItem('token');
          console.error('Failed to verify token:', error);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

   const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      if (response.data.success) {
        const { user, token } = response.data.data;

        localStorage.setItem('token', token);
        setUser(user);
      } else {
        throw new Error(response.data.error?.message || 'Login failed');
      }
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error?.message || 'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {

      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    name: string;
    studentId: string;
  }): Promise<void> => {
    setLoading(true);
    try {
      const response = await authApi.registerStudent(userData);
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Registration failed');
      }
      // Auto-login after successful registration
      await login(userData.email, userData.password);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error?.message || 'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await authApi.getCurrentUser();
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // Don't logout on refresh failure - might be temporary network issue
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// TODO: Add token refresh mechanism
// TODO: Implement persistent login with secure token storage
// TODO: Add password reset functionality
// TODO: Implement multi-factor authentication
// TODO: Add session timeout handling