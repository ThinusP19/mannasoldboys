import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { authApi, removeAuthToken, setAuthToken } from "@/lib/api";
import { QueryClient } from "@tanstack/react-query";
import { initializePushNotifications, unsubscribeFromPush } from "@/lib/push-notifications";

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  profile?: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Safari-safe localStorage helper (Safari private mode blocks localStorage)
const safeGetItem = (key: string): string | null => {
  try {
    return safeGetItem(key);
  } catch (error) {
    console.warn('localStorage not available (Safari private mode?):', error);
    return null;
  }
};

const safeRemoveItem = (key: string): void => {
  try {
    safeRemoveItem(key);
  } catch (error) {
    console.warn('localStorage not available:', error);
  }
};

// Helper function to sanitize user data for localStorage (remove large fields like images)
const sanitizeUserForStorage = (userData: any): User => {
  if (!userData) return null as any;
  
  // Extract only essential user fields
  const sanitized: User = {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role, // Preserve role for route protection
  };
  
  // Optionally include profile without images (if needed for quick access)
  if (userData.profile) {
    sanitized.profile = {
      ...userData.profile,
      thenPhoto: null, // Remove large base64 images
      nowPhoto: null,  // Remove large base64 images
    };
  }
  
  return sanitized;
};

// Helper function to safely set localStorage with quota error handling
const safeSetItem = (key: string, value: string) => {
  try {
    safeSetItem(key, value);
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      console.warn("localStorage quota exceeded, clearing old data");
      // Clear all localStorage except authToken
      const token = safeGetItem("authToken");
      try {
        localStorage.clear();
        if (token) {
          safeSetItem("authToken", token);
        }
        // Try again after clearing
        safeSetItem(key, value);
      } catch {
        console.warn('localStorage not available');
      }
    } else {
      console.warn('localStorage not available:', error);
    }
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return safeGetItem("isAuthenticated") === "true";
  });
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = safeGetItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Track if we just logged in - skip validation to avoid Safari issues
  const justLoggedInRef = useRef(false);

  // Check if user is authenticated on mount - SIMPLIFIED VERSION
  useEffect(() => {
    // Skip validation if we just logged in (prevents Safari issues)
    if (justLoggedInRef.current) {
      justLoggedInRef.current = false;
      setLoading(false);
      return;
    }

    // IMMEDIATELY check localStorage first (no waiting)
    const token = safeGetItem("authToken");
    const storedUser = safeGetItem("user");
    const storedAuth = safeGetItem("isAuthenticated") === "true";

    // Set initial state from localStorage immediately
    if (token && storedUser && storedAuth) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch {
        // Invalid stored data
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }

    // Set loading to false IMMEDIATELY so app can render
    setLoading(false);

    // Then try to validate with backend in background (non-blocking)
    if (token) {
      // Fire and forget - don't wait for it
      Promise.race([
        authApi.getCurrentUser(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 1000))
      ]).then((userData) => {
        // Update if successful
        setUser(userData);
        setIsAuthenticated(true);
        const sanitized = sanitizeUserForStorage(userData);
        safeSetItem("isAuthenticated", "true");
        safeSetItem("user", JSON.stringify(sanitized));

        // Initialize push notifications for existing session
        initializePushNotifications().catch((err) =>
          console.warn("Failed to initialize push notifications:", err)
        );
      }).catch((error: any) => {
        // Only clear if it's a DEFINITE auth error (server explicitly said unauthorized)
        // Do NOT logout on connection errors, timeouts, CORS errors, etc.
        const errorMessage = String(error?.error || error?.details || error?.message || "").toLowerCase();
        const statusCode = error?.status || error?.statusCode;

        // Only logout if server explicitly returned 401/403
        const isDefiniteAuthError = statusCode === 401 || statusCode === 403 ||
                                    errorMessage === "unauthorized" ||
                                    errorMessage === "invalid token" ||
                                    errorMessage === "token expired";

        if (isDefiniteAuthError) {
          console.log("Auth error detected, logging out:", errorMessage);
          setIsAuthenticated(false);
          setUser(null);
          safeRemoveItem("authToken");
          safeRemoveItem("isAuthenticated");
          safeRemoveItem("user");
        } else {
          // Keep user logged in - it's probably a connection issue
          console.log("Non-auth error, keeping session:", errorMessage);
        }
      });
    }
  }, []);

  // Listen for storage changes from other tabs (multi-tab login detection)
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      // Only handle authToken changes from other tabs
      if (e.key === "authToken" && e.newValue !== e.oldValue) {
        console.log("Auth token changed in another tab, refreshing user...");
        
        // If token was removed (logout in another tab)
        if (!e.newValue) {
          setIsAuthenticated(false);
          setUser(null);
          safeRemoveItem("isAuthenticated");
          safeRemoveItem("user");
          return;
        }

        // If token was added/changed (login in another tab)
        // Check if it's a different user
        try {
          const newUserData = await authApi.getCurrentUser();
          
          // Check if this is a different user
          if (user && newUserData.id !== user.id) {
            console.warn("Different user logged in on another tab. Updating to new user.");
            // Show a brief notification (optional - you can add a toast here)
            setUser(newUserData);
            setIsAuthenticated(true);
            const sanitized = sanitizeUserForStorage(newUserData);
            safeSetItem("isAuthenticated", "true");
            safeSetItem("user", JSON.stringify(sanitized));
          } else {
            // Same user or no previous user - just refresh
            setUser(newUserData);
            setIsAuthenticated(true);
            const sanitized = sanitizeUserForStorage(newUserData);
            safeSetItem("isAuthenticated", "true");
            safeSetItem("user", JSON.stringify(sanitized));
          }
        } catch (error: any) {
          console.error("Failed to refresh user after storage change:", error);
          // If token is invalid, clear auth
          const errorMessage = error?.error || error?.details || "";
          const isAuthError = errorMessage.includes("401") || 
                             errorMessage.includes("403") || 
                             errorMessage.includes("Unauthorized") ||
                             errorMessage.includes("Invalid token");
          
          if (isAuthError) {
            setIsAuthenticated(false);
            setUser(null);
            safeRemoveItem("isAuthenticated");
            safeRemoveItem("user");
          }
        }
      }

      // Also handle user data changes
      if (e.key === "user" && e.newValue !== e.oldValue) {
        if (e.newValue) {
          try {
            const newUser = JSON.parse(e.newValue);
            // Only update if it's actually different
            if (user && newUser.id !== user.id) {
              console.log("User data changed in another tab, updating...");
              setUser(newUser);
            }
          } catch (error) {
            console.error("Failed to parse user data from storage event:", error);
          }
        } else {
          // User was removed
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    // Listen for storage events (changes from other tabs)
    window.addEventListener("storage", handleStorageChange);

    // Also check auth when window regains focus (user switches back to this tab)
    // Throttle to prevent too many requests
    let lastFocusCheck = 0;
    const FOCUS_CHECK_THROTTLE = 60000; // Only check once per minute
    
    const handleFocus = async () => {
      // Skip focus check if we just logged in (Safari fix)
      if (justLoggedInRef.current) {
        return;
      }

      const now = Date.now();
      if (now - lastFocusCheck < FOCUS_CHECK_THROTTLE) {
        return; // Skip if checked recently
      }
      lastFocusCheck = now;

      const token = safeGetItem("authToken");
      if (token && user) {
        // Skip API validation - just trust the token exists
        // This prevents Safari issues where API calls might fail
        console.log("Focus check: token exists, keeping session");
      } else if (!token && isAuthenticated && user) {
        // Token is missing but we have user data - Safari might have localStorage issues
        // Don't logout, just log a warning
        console.warn("Focus check: token missing but user exists - Safari localStorage issue?");
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user, isAuthenticated]);

  const login = async (email: string, password: string) => {
    // Always use backend - no demo mode fallback
    const response = await authApi.login(email, password);

    // Mark that we just logged in - skip validation on next mount (Safari fix)
    justLoggedInRef.current = true;

    setUser(response.user);
    setIsAuthenticated(true);
    safeSetItem("isAuthenticated", "true");
    // Store only essential fields (without large images) to avoid quota exceeded
    const sanitized = sanitizeUserForStorage(response.user);
    safeSetItem("user", JSON.stringify(sanitized));

    // Clear admin authentication data if this is a regular user login
    // This prevents old admin data from causing redirects
    if (response.user.role !== "admin") {
      safeRemoveItem("adminAuthToken");
      safeRemoveItem("adminUser");
      safeRemoveItem("isAdminAuthenticated");
    }

    // Initialize push notifications after login (don't await - Safari may block this)
    initializePushNotifications().catch((err) =>
      console.warn("Failed to initialize push notifications:", err)
    );

    // Return response so caller can check role
    return response;
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      // Always use backend - no demo mode fallback
      const response = await authApi.register(email, password, name);

      if (!response || !response.user) {
        throw new Error("Registration failed: Invalid response from server");
      }

      // Mark that we just logged in - skip validation on next mount (Safari fix)
      justLoggedInRef.current = true;

      setUser(response.user);
      setIsAuthenticated(true);
      safeSetItem("isAuthenticated", "true");
      // Store only essential fields (without large images) to avoid quota exceeded
      const sanitized = sanitizeUserForStorage(response.user);
      safeSetItem("user", JSON.stringify(sanitized));

      // Clear admin authentication data if this is a regular user registration
      // This prevents old admin data from causing redirects
      if (response.user.role !== "admin") {
        safeRemoveItem("adminAuthToken");
        safeRemoveItem("adminUser");
        safeRemoveItem("isAdminAuthenticated");
      }

      // Token is already set by authApi.register

      // Initialize push notifications after registration (don't block - Safari may have issues)
      initializePushNotifications().catch((err) =>
        console.warn("Failed to initialize push notifications:", err)
      );
    } catch (error: any) {
      console.error("Registration error in AuthContext:", error);
      throw error;
    }
  };

  const logout = () => {
    // Unsubscribe from push notifications before logout
    unsubscribeFromPush().catch((err) =>
      console.warn("Failed to unsubscribe from push:", err)
    );

    authApi.logout();
    setIsAuthenticated(false);
    setUser(null);
    safeSetItem("isAuthenticated", "false");
    safeRemoveItem("user");
    safeRemoveItem("authToken");

    // Clear notification cache to prevent showing old user's notifications
    // This is critical for user privacy - ensures new user doesn't see old user's data
    const queryClient = (window as any).__queryClient;
    if (queryClient) {
      queryClient.removeQueries({ queryKey: ["notifications"] });
    }
  };

  const refreshUser = async () => {
    // Always use backend
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
      // Store only essential fields (without large images) to avoid quota exceeded
      const sanitized = sanitizeUserForStorage(userData);
      safeSetItem("user", JSON.stringify(sanitized));
    } catch (error) {
      // If refresh fails, token might be invalid - clear auth
      console.warn("Failed to refresh user, clearing auth");
      setIsAuthenticated(false);
      setUser(null);
      safeRemoveItem("authToken");
      safeRemoveItem("isAuthenticated");
      safeRemoveItem("user");
    }
  };

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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

