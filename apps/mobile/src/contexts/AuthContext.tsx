import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { authApi, removeAuthToken, setAuthToken, RegisterData } from '../services/api';
import { secureStorage } from '../services/storage';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  profile?: any;
  isMember?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to sanitize user data for storage (remove large fields like images)
const sanitizeUserForStorage = (userData: any): User | null => {
  if (!userData) return null;

  const sanitized: User = {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role,
    isMember: userData.isMember || userData.profile?.isMember || false,
  };

  // Optionally include profile without images
  if (userData.profile) {
    sanitized.profile = {
      ...userData.profile,
      thenPhoto: null,
      nowPhoto: null,
    };
  }

  return sanitized;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from secure storage
  const initializeAuth = useCallback(async () => {
    try {
      const token = await secureStorage.getAccessToken();

      if (token) {
        // Token exists, try to validate with backend
        try {
          const userData = await authApi.getCurrentUser();
          setUser(sanitizeUserForStorage(userData));
          setIsAuthenticated(true);
        } catch (error: any) {
          // Check if it's an auth error
          const errorMessage = error?.error || error?.details || error?.message || '';
          const isAuthError =
            errorMessage.includes('401') ||
            errorMessage.includes('403') ||
            errorMessage.includes('Unauthorized') ||
            errorMessage.includes('Invalid token') ||
            errorMessage.includes('Token expired');

          if (isAuthError) {
            // Clear invalid auth
            await secureStorage.clearAuthData();
            setIsAuthenticated(false);
            setUser(null);
          } else {
            // Network error - try to use cached user ID for basic auth state
            const userId = await secureStorage.getUserId();
            if (userId) {
              setIsAuthenticated(true);
              // User data will be refreshed when network is available
            }
          }
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth when app comes to foreground
  useEffect(() => {
    initializeAuth();

    let lastCheck = 0;
    const CHECK_THROTTLE = 60000; // 1 minute

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const now = Date.now();
        if (now - lastCheck < CHECK_THROTTLE) return;
        lastCheck = now;

        const token = await secureStorage.getAccessToken();
        if (token && isAuthenticated) {
          try {
            const userData = await authApi.getCurrentUser();
            setUser(sanitizeUserForStorage(userData));
          } catch (error: any) {
            const errorMessage = error?.error || error?.details || '';
            const isAuthError =
              errorMessage.includes('401') ||
              errorMessage.includes('403') ||
              errorMessage.includes('Unauthorized') ||
              errorMessage.includes('Invalid token');

            if (isAuthError) {
              await secureStorage.clearAuthData();
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [initializeAuth, isAuthenticated]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);

    const sanitizedUser = sanitizeUserForStorage(response.user);
    setUser(sanitizedUser);
    setIsAuthenticated(true);

    // Store user ID for offline reference
    if (response.user?.id) {
      await secureStorage.setUserId(response.user.id);
    }

    return response;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await authApi.register(data);

    if (!response || !response.user) {
      throw new Error('Registration failed: Invalid response from server');
    }

    const sanitizedUser = sanitizeUserForStorage(response.user);
    setUser(sanitizedUser);
    setIsAuthenticated(true);

    // Store user ID for offline reference
    if (response.user?.id) {
      await secureStorage.setUserId(response.user.id);
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(sanitizeUserForStorage(userData));
    } catch (error) {
      console.warn('Failed to refresh user, clearing auth');
      await secureStorage.clearAuthData();
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
