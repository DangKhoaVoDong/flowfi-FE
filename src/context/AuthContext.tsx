import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService } from '../services/authService';
import { AUTH_LOGOUT_EVENT } from '../services/apiClient';
import type { UserDto, LoginRequest, RegisterRequest } from '../types/api';

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check authentication status on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check if there's a valid token structure
      // If token looks invalid (empty or malformed), clear it
      const accessToken = localStorage.getItem('flowfi_access_token');
      const refreshToken = localStorage.getItem('flowfi_refresh_token');
      
      if (!accessToken || !refreshToken) {
        // No tokens at all - definitely not logged in
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }
      
      // Token exists - user is logged in, don't make API call yet
      // Will fetch user data lazily when needed
      setState({
        user: null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    };

    initAuth();
  }, []);

  // Listen for logout events from apiClient (when token refresh fails)
  useEffect(() => {
    const handleLogoutEvent = () => {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogoutEvent);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogoutEvent);
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await authService.login(credentials);
      // Set state and return success signal for navigation
      setState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = 
        error instanceof Error && 'response' in error
          ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Đăng nhập thất bại')
          : 'Đăng nhập thất bại';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authService.register(data);
      // Set state and return success signal for navigation
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = 
        error instanceof Error && 'response' in error
          ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Đăng ký thất bại')
          : 'Đăng ký thất bại';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      setState((prev) => ({ ...prev, user: response.data }));
    } catch (error: unknown) {
      // Only logout on 401 (token expired), not on server errors
      const isUnauthorized = 
        error instanceof Error && 'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 401;
      
      if (isUnauthorized) {
        await logout();
      }
    }
  }, [logout]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
