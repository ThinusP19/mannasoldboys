import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type Language = 'en' | 'af';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n, t: i18nT } = useTranslation();
  
  const language = (i18n.language as Language) || 'en';
  
  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    return i18nT(key, params);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

