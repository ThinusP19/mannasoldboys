import 'intl-pluralrules'; // Polyfill for Intl.PluralRules (required for React Native/Hermes)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import af from './locales/af.json';

const LANGUAGE_KEY = 'language';

// Language detector that uses AsyncStorage
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // First check AsyncStorage for saved preference
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }

      // Fall back to device locale
      const deviceLocale = Localization.locale;
      const languageCode = deviceLocale.startsWith('af') ? 'af' : 'en';
      callback(languageCode);
    } catch (error) {
      // Default to English on error
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // Support old plural format (_plural suffix)
    resources: {
      en: { translation: en },
      af: { translation: af },
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // React Native already handles escaping
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

export default i18n;

// Helper function to change language and persist it
export const changeLanguage = async (lng: string) => {
  await i18n.changeLanguage(lng);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

// Helper function to get current language
export const getCurrentLanguage = () => i18n.language;
