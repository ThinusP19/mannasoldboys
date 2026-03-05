/**
 * Push Notifications Hook
 * Handles permission requests, token registration, and notification listeners
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { pushApi } from '../services';
import { generalStorage } from '../services/storage';

// Configure notification handler (only on native platforms)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
  isEnabled: boolean;
  isLoading: boolean;
}

export interface UsePushNotificationsReturn extends PushNotificationState {
  requestPermissions: () => Promise<boolean>;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
  registerForPushNotifications: () => Promise<string | null>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Get the push notification token
  const getPushToken = async (): Promise<string | null> => {
    if (!Device.isDevice) {
      if (__DEV__) console.log('Push notifications require a physical device');
      return null;
    }

    try {
      // For Expo Go, use getExpoPushTokenAsync
      // For production builds, you'd use getDevicePushTokenAsync
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      const tokenResult = await Notifications.getExpoPushTokenAsync({
        projectId: projectId || undefined,
      });

      return tokenResult.data;
    } catch (err: any) {
      if (__DEV__) console.error('Error getting push token:', err);
      setError(err.message || 'Failed to get push token');
      return null;
    }
  };

  // Request notification permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) {
      Alert.alert(
        'Physical Device Required',
        'Push notifications only work on physical devices, not simulators.'
      );
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus === 'granted') {
        return true;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (err: any) {
      if (__DEV__) console.error('Error requesting permissions:', err);
      setError(err.message || 'Failed to request permissions');
      return false;
    }
  }, []);

  // Register for push notifications with the backend
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setIsLoading(false);
        return null;
      }

      const token = await getPushToken();
      if (!token) {
        setIsLoading(false);
        return null;
      }

      // Register token with backend
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      await pushApi.registerToken(token, platform);

      setExpoPushToken(token);
      setIsEnabled(true);
      await generalStorage.setNotificationsEnabled(true);

      setIsLoading(false);
      return token;
    } catch (err: any) {
      if (__DEV__) console.error('Error registering for push notifications:', err);
      setError(err.message || 'Failed to register for push notifications');
      setIsLoading(false);
      return null;
    }
  }, [requestPermissions]);

  // Enable push notifications
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    const token = await registerForPushNotifications();
    return token !== null;
  }, [registerForPushNotifications]);

  // Disable push notifications
  const disableNotifications = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      await pushApi.unregisterToken();
      setExpoPushToken(null);
      setIsEnabled(false);
      await generalStorage.setNotificationsEnabled(false);
    } catch (err: any) {
      if (__DEV__) console.error('Error disabling notifications:', err);
      setError(err.message || 'Failed to disable notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check initial notification status on mount
  useEffect(() => {
    const checkInitialStatus = async () => {
      // Skip on web
      if (Platform.OS === 'web') {
        setIsLoading(false);
        return;
      }

      try {
        const savedEnabled = await generalStorage.getNotificationsEnabled();
        setIsEnabled(savedEnabled);

        if (savedEnabled && Device.isDevice) {
          const { status } = await Notifications.getPermissionsAsync();
          if (status === 'granted') {
            const token = await getPushToken();
            if (token) {
              setExpoPushToken(token);
            }
          }
        }
      } catch (err) {
        if (__DEV__) console.error('Error checking notification status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialStatus();
  }, []);

  // Set up notification listeners (only on native)
  useEffect(() => {
    // Skip on web
    if (Platform.OS === 'web') {
      return;
    }

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const notification = response.notification;
        setNotification(notification);

        // Handle notification tap - you can navigate based on notification data here
        const data = notification.request.content.data;
        if (__DEV__) console.log('Notification tapped:', data);
      }
    );

    return () => {
      // Only remove subscriptions on native platforms
      if (Platform.OS !== 'web') {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    error,
    isEnabled,
    isLoading,
    requestPermissions,
    enableNotifications,
    disableNotifications,
    registerForPushNotifications,
  };
}

export default usePushNotifications;
