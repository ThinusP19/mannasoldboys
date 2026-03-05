import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { TamaguiProvider, Theme, View, Text } from 'tamagui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAdminToken, adminApi, checkAndClearJustLoggedIn } from '../src/services/adminApi';
import 'react-native-reanimated';

// Initialize i18n
import '../src/i18n/config';

import { tamaguiConfig } from '../src/theme';
import { AuthProvider, useAuth } from '../src/contexts';
import { usePushNotifications } from '../src/hooks';
import { SplashScreen as CustomSplashScreen } from '../src/components/SplashScreen';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
// Only call this on native platforms
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function AuthRouter() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { isEnabled, registerForPushNotifications } = usePushNotifications();
  const hasInitialized = useRef(false);

  // Mark that app has initialized (used for tracking)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    // Don't auto-clear admin auth - let the session verification handle expired tokens
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';

    // If user navigates to admin group, verify they have valid admin auth
    // If not, redirect to user login (admins must explicitly go to admin login)
    if (inAdminGroup) {
      const checkAdminAuth = async () => {
        console.log('[Layout] checkAdminAuth starting...');
        try {
          // Check in-memory flag FIRST (before any async operations)
          if (checkAndClearJustLoggedIn()) {
            console.log('[Layout] Admin just logged in, skipping ALL verification');
            return;
          }

          const isAdminAuth = await AsyncStorage.getItem('isAdminAuthenticated');
          console.log('[Layout] isAdminAuthenticated:', isAdminAuth);

          // If no valid admin auth flag, redirect to user login
          if (isAdminAuth !== 'true') {
            console.log('[Layout] No admin auth flag, redirecting to login');
            router.replace('/(auth)/login');
            return;
          }

          // Verify admin session is still valid with the server
          console.log('[Layout] Verifying admin session with server...');
          // Add small delay to ensure token storage is complete (race condition fix)
          await new Promise(resolve => setTimeout(resolve, 100));

          // Retry verification up to 3 times to handle transient network issues
          let lastError: any = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              console.log('[Layout] Verification attempt', attempt + 1);
              await adminApi.verifySession();
              // Verification succeeded, admin is authenticated
              return;
            } catch (verifyError: any) {
              lastError = verifyError;
              // If it's a clear auth error (401/403), don't retry
              if (verifyError?.status === 401 || verifyError?.status === 403) {
                break;
              }
              // Wait before retry for network errors
              if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          }

          // All retries failed - check if it's a real auth issue or network issue
          console.error('Admin verification failed:', lastError);

          // Only clear auth for definitive auth failures, not network errors
          if (lastError?.status === 401 || lastError?.status === 403) {
            console.log('[Layout] Auth error, clearing and redirecting');
            await clearAdminToken();
            await AsyncStorage.multiRemove(['adminUser', 'isAdminAuthenticated']);
            router.replace('/(auth)/login');
          } else {
            console.log('[Layout] Network error, staying on page');
          }
          // For network errors, stay on the page - user can manually retry or go back
        } catch (error) {
          console.error('[Layout] Error checking admin auth:', error);
          router.replace('/(auth)/login');
        }
      };
      checkAdminAuth();
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, loading, segments]);

  // Register for push notifications when user is authenticated and notifications are enabled
  useEffect(() => {
    if (isAuthenticated && isEnabled) {
      registerForPushNotifications();
    }
  }, [isAuthenticated, isEnabled]);

  // Show custom splash screen while auth is loading (native only)
  if (loading && Platform.OS !== 'web') {
    return <CustomSplashScreen />;
  }

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(Platform.OS === 'web'); // Web is ready immediately

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      // Don't throw on web, just continue
      if (Platform.OS !== 'web') {
        throw error;
      }
    }
  }, [error]);

  useEffect(() => {
    if (loaded || Platform.OS === 'web') {
      if (Platform.OS !== 'web') {
        SplashScreen.hideAsync();
      }
      setIsReady(true);
    }
  }, [loaded]);

  // Show custom splash screen while fonts are loading (native only)
  if (!loaded && Platform.OS !== 'web') {
    return <CustomSplashScreen />;
  }

  // Determine theme - default to 'light' if colorScheme is null
  const themeName = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={themeName}>
        <Theme name={themeName}>
          <AuthProvider>
            <AuthRouter />
          </AuthProvider>
        </Theme>
      </TamaguiProvider>
    </QueryClientProvider>
  );
}
