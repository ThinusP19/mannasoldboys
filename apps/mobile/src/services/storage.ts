import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Keys for secure storage (tokens, sensitive data)
const SECURE_KEYS = {
  ACCESS_TOKEN: 'alumni_access_token',
  REFRESH_TOKEN: 'alumni_refresh_token',
  USER_ID: 'alumni_user_id',
} as const;

// Helper functions for web fallback (localStorage)
const webStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

const isWeb = Platform.OS === 'web';

// Keys for general storage (preferences, cache)
const STORAGE_KEYS = {
  THEME: 'alumni_theme',
  LANGUAGE: 'alumni_language',
  ONBOARDING_COMPLETE: 'alumni_onboarding_complete',
  PUSH_TOKEN: 'alumni_push_token',
  NOTIFICATIONS_ENABLED: 'alumni_notifications_enabled',
  LAST_SYNC: 'alumni_last_sync',
} as const;

/**
 * Secure Storage - For sensitive data like tokens
 * Uses expo-secure-store (Keychain on iOS, EncryptedSharedPreferences on Android)
 */
export const secureStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      if (isWeb) {
        return webStorage.getItem(SECURE_KEYS.ACCESS_TOKEN);
      }
      return await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    try {
      if (isWeb) {
        webStorage.setItem(SECURE_KEYS.ACCESS_TOKEN, token);
        return;
      }
      await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error('Error setting access token:', error);
      throw error;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      if (isWeb) {
        return webStorage.getItem(SECURE_KEYS.REFRESH_TOKEN);
      }
      return await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      if (isWeb) {
        webStorage.setItem(SECURE_KEYS.REFRESH_TOKEN, token);
        return;
      }
      await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Error setting refresh token:', error);
      throw error;
    }
  },

  async getUserId(): Promise<string | null> {
    try {
      if (isWeb) {
        return webStorage.getItem(SECURE_KEYS.USER_ID);
      }
      return await SecureStore.getItemAsync(SECURE_KEYS.USER_ID);
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  },

  async setUserId(userId: string): Promise<void> {
    try {
      if (isWeb) {
        webStorage.setItem(SECURE_KEYS.USER_ID, userId);
        return;
      }
      await SecureStore.setItemAsync(SECURE_KEYS.USER_ID, userId);
    } catch (error) {
      console.error('Error setting user ID:', error);
      throw error;
    }
  },

  async clearAuthData(): Promise<void> {
    try {
      if (isWeb) {
        webStorage.removeItem(SECURE_KEYS.ACCESS_TOKEN);
        webStorage.removeItem(SECURE_KEYS.REFRESH_TOKEN);
        webStorage.removeItem(SECURE_KEYS.USER_ID);
        return;
      }
      await Promise.all([
        SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(SECURE_KEYS.USER_ID),
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  },

  async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await this.setAccessToken(accessToken);
    if (refreshToken) {
      await this.setRefreshToken(refreshToken);
    }
  },
};

/**
 * General Storage - For non-sensitive data like preferences
 * Uses AsyncStorage
 */
export const generalStorage = {
  async getTheme(): Promise<'light' | 'dark' | 'system' | null> {
    try {
      const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      return theme as 'light' | 'dark' | 'system' | null;
    } catch (error) {
      console.error('Error getting theme:', error);
      return null;
    }
  },

  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Error setting theme:', error);
      throw error;
    }
  },

  async getLanguage(): Promise<'en' | 'af' | null> {
    try {
      const language = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
      return language as 'en' | 'af' | null;
    } catch (error) {
      console.error('Error getting language:', error);
      return null;
    }
  },

  async setLanguage(language: 'en' | 'af'): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    } catch (error) {
      console.error('Error setting language:', error);
      throw error;
    }
  },

  async isOnboardingComplete(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      return value === 'true';
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      return false;
    }
  },

  async setOnboardingComplete(complete: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, String(complete));
    } catch (error) {
      console.error('Error setting onboarding status:', error);
      throw error;
    }
  },

  async getPushToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  async setPushToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
    } catch (error) {
      console.error('Error setting push token:', error);
      throw error;
    }
  },

  async getNotificationsEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
      return value === 'true';
    } catch (error) {
      console.error('Error getting notifications enabled:', error);
      return false;
    }
  },

  async setNotificationsEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, String(enabled));
    } catch (error) {
      console.error('Error setting notifications enabled:', error);
      throw error;
    }
  },

  async getLastSync(): Promise<Date | null> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return value ? new Date(value) : null;
    } catch (error) {
      console.error('Error getting last sync:', error);
      return null;
    }
  },

  async setLastSync(date: Date): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, date.toISOString());
    } catch (error) {
      console.error('Error setting last sync:', error);
      throw error;
    }
  },

  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing general storage:', error);
      throw error;
    }
  },
};

// Export keys for external use if needed
export { SECURE_KEYS, STORAGE_KEYS };
