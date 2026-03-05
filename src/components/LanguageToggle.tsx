import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';

export const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const currentLang = i18n.language?.startsWith('af') ? 'af' : 'en';

  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'af' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="min-w-[80px]"
    >
      {currentLang === 'en' ? 'Afrikaans' : 'English'}
    </Button>
  );
};
