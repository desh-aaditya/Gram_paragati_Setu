import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import taTranslations from './locales/ta.json';
import knTranslations from './locales/kn.json';
import mrTranslations from './locales/mr.json';
import bhoTranslations from './locales/bho.json';
import haryanviTranslations from './locales/haryanvi.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations },
      ta: { translation: taTranslations },
      kn: { translation: knTranslations },
      mr: { translation: mrTranslations },
      bho: { translation: bhoTranslations },
      haryanvi: { translation: haryanviTranslations },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'ta', 'kn', 'mr', 'bho', 'haryanvi'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
