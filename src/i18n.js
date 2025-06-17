import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './translations/fr';
import en from './translations/en';
import es from './translations/es';
import it from './translations/it';
import pt from './translations/pt';
import de from './translations/de';

const resources = {
  fr,
  en,
  es,
  it,
  pt,
  de
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 