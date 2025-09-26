import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; message: string; email?: string }>;
  verifyEmail: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get API URL from environment
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      // Web environment
      return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
    }
    // Mobile environment
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
  };

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${getApiUrl()}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`Making API call to: ${url}`);
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const userData = await apiCall('/api/user');
      setUser(userData);
    } catch (error) {
      console.log('No active session found');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiCall('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.user) {
        setUser(response.user);
        return { success: true, message: 'Login successful', user: response.user };
      }
      
      return { success: false, message: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const response = await apiCall('/api/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      return { 
        success: true, 
        message: response.message || 'Registration successful', 
        email: response.email || email 
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      const response = await apiCall('/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });

      if (response.user) {
        setUser(response.user);
      }

      return { 
        success: true, 
        message: response.message || 'Email verified successfully' 
      };
    } catch (error: any) {
      console.error('Email verification error:', error);
      return { 
        success: false, 
        message: error.message || 'Email verification failed. Please try again.' 
      };
    }
  };

  const resendVerification = async (email: string) => {
    try {
      const response = await apiCall('/api/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      return { 
        success: true, 
        message: response.message || 'Verification code sent' 
      };
    } catch (error: any) {
      console.error('Resend verification error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to resend verification code' 
      };
    }
  };

  const logout = async () => {
    try {
      await apiCall('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    isLoading,
    login,
    register,
    verifyEmail,
    resendVerification,
    logout,
    checkAuth,
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
