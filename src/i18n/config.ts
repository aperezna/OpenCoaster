import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

// ---------------------------------------------------------------------------
// i18next initialization
// ---------------------------------------------------------------------------

const RESOURCES = {
  en: { translation: en },
  es: { translation: es },
} as const;

/**
 * Initialize i18next with en/es resources.
 * Default language: en. Missing keys fall back to en.
 * Safe to call multiple times — returns existing instance if already initialized.
 */
export async function initI18n(): Promise<typeof i18next> {
  if (i18next.isInitialized) {
    return i18next;
  }

  await i18next.use(initReactI18next).init({
    resources: RESOURCES,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    returnObjects: false,
  });

  return i18next;
}
