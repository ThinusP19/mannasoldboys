import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Preloader } from "@/components/Preloader";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Directory from "./pages/Directory";
import AlumniProfile from "./pages/AlumniProfile";
import More from "./pages/More";
import Stories from "./pages/Stories";
import Memorial from "./pages/Memorial";
import Reunions from "./pages/Reunions";
import GiveBack from "./pages/GiveBack";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Landing from "./pages/Landing";
import Marketplace from "./pages/Marketplace";
import CreateService from "./pages/CreateService";
import Sponsors from "./pages/Sponsors";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      retryOnMount: false,
      // Don't throw errors - handle them gracefully
      throwOnError: false,
    },
    mutations: {
      // Don't throw errors in mutations either
      throwOnError: false,
    },
  },
});

// Expose queryClient globally for clearing caches on logout (notification privacy)
(window as any).__queryClient = queryClient;

// Safari-safe localStorage helpers
const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    console.warn('localStorage not available');
  }
};

const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    console.warn('localStorage not available');
  }
};

// Safari-safe sessionStorage helpers
const safeSessionGetItem = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSessionRemoveItem = (key: string): void => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    console.warn('sessionStorage not available');
  }
};

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    // Show a simple loading state instead of blank screen
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  // Protected routes are for VISITORS ONLY - don't check admin at all
  // If not authenticated, redirect to visitor login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated as regular user (visitor), show the protected content
  // Admin users should use /admin - we don't care about them here
  return children;
};

const AdminProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const [isVerifying, setIsVerifying] = React.useState(true);
  const [isValidAdmin, setIsValidAdmin] = React.useState(false);

  React.useEffect(() => {
    const verifyAdminSession = async () => {
      // Check if we have admin credentials in localStorage first
      const isAdminAuthenticated = safeGetItem("isAdminAuthenticated") === "true";
      const adminToken = safeGetItem("adminAuthToken");

      if (!isAdminAuthenticated || !adminToken) {
        setIsValidAdmin(false);
        setIsVerifying(false);
        return;
      }

      // Check if we just logged in - skip verification (token was just issued)
      const justLoggedIn = safeSessionGetItem("adminJustLoggedIn");
      if (justLoggedIn === "true") {
        safeSessionRemoveItem("adminJustLoggedIn");
        setIsValidAdmin(true);
        setIsVerifying(false);
        return;
      }

      // Verify the admin session with the backend
      try {
        const { adminApi } = await import("@/lib/api");
        const response = await adminApi.verifySession();
        if (response.valid && response.user?.role === "admin") {
          // Update stored user info in case it changed
          safeSetItem("adminUser", JSON.stringify(response.user));
          setIsValidAdmin(true);
        } else {
          // Session invalid - clear localStorage
          safeRemoveItem("isAdminAuthenticated");
          safeRemoveItem("adminAuthToken");
          safeRemoveItem("adminUser");
          setIsValidAdmin(false);
        }
      } catch (error) {
        // Only clear on definitive auth failures, not network errors
        // For network errors, trust the existing token
        console.error("Admin verification error:", error);
        // Still allow access if we have a token - let individual API calls handle auth
        setIsValidAdmin(true);
      }

      setIsVerifying(false);
    };

    verifyAdminSession();
  }, []);

  // Show loading while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If not a valid admin, show admin login page
  if (!isValidAdmin) {
    return <AdminLogin />;
  }

  // If authenticated as admin, show the admin dashboard
  return children;
};

const RootRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    // Show a simple loading state instead of blank screen
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  // Root route is for VISITORS ONLY - don't check admin at all
  // If not authenticated, show visitor login/register page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated as regular user (visitor), redirect to profile page
  // Admin users should use /admin - we don't care about them here
  return <Navigate to="/profile" replace />;
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <TooltipProvider delayDuration={300}>
              <SEO />
              <Preloader />
              <Toaster />
              <Sonner />
              <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/welcome" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/my-year" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/directory" element={<ProtectedRoute><Directory /></ProtectedRoute>} />
              <Route path="/alumni/:id" element={<ProtectedRoute><AlumniProfile /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><AlumniProfile /></ProtectedRoute>} />
              <Route path="/stories" element={<ProtectedRoute><Stories /></ProtectedRoute>} />
              <Route path="/memorial" element={<ProtectedRoute><Memorial /></ProtectedRoute>} />
              <Route path="/reunions" element={<ProtectedRoute><Reunions /></ProtectedRoute>} />
              <Route path="/give-back" element={<ProtectedRoute><GiveBack /></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
              <Route path="/marketplace/new" element={<ProtectedRoute><CreateService /></ProtectedRoute>} />
              <Route path="/sponsors" element={<ProtectedRoute><Sponsors /></ProtectedRoute>} />
              <Route path="/more" element={<ProtectedRoute><More /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminProtectedRoute><Admin /></AdminProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
