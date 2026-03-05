import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../locales/en.json';
import afTranslations from '../locales/af.json';

const LANGUAGE_KEY = 'i18nextLng';
const ADMIN_LANGUAGE_KEY = 'i18nextLng_admin';

// Check if we're in admin context
export const isAdminContext = (): boolean => {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
};

// Get admin language preference
export const getAdminLanguage = (): string => {
  try {
    const saved = localStorage.getItem(ADMIN_LANGUAGE_KEY);
    if (saved && (saved === 'en' || saved === 'af')) {
      return saved;
    }
  } catch (e) {
    // localStorage not available
  }
  return 'af';
};

// Set admin language preference
export const setAdminLanguage = (lng: string): void => {
  try {
    localStorage.setItem(ADMIN_LANGUAGE_KEY, lng);
    i18n.changeLanguage(lng);
  } catch (e) {
    // localStorage not available
  }
};

// Get user language preference
export const getUserLanguage = (): string => {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved && (saved === 'en' || saved === 'af')) {
      return saved;
    }
  } catch (e) {
    // localStorage not available
  }
  return 'af';
};

// Get saved language based on context
const getSavedLanguage = (): string => {
  if (isAdminContext()) {
    return getAdminLanguage();
  }
  return getUserLanguage();
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      af: {
        translation: afTranslations,
      },
    },
    lng: getSavedLanguage(),
    fallbackLng: 'af',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Save language when changed (based on context)
i18n.on('languageChanged', (lng) => {
  try {
    if (isAdminContext()) {
      localStorage.setItem(ADMIN_LANGUAGE_KEY, lng);
    } else {
      localStorage.setItem(LANGUAGE_KEY, lng);
    }
  } catch (e) {
    // localStorage not available
  }
});

export default i18n;
