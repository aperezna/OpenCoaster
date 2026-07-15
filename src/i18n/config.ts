import i18next from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export type SupportedLanguage = 'en' | 'es';

const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'es'];
export const LANGUAGE_STORAGE_KEY = '@opencoaster/language';

let initPromise: Promise<typeof i18next> | null = null;

export function isSupportedLanguage(language: string): language is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
}

export function getCurrentLanguage(): SupportedLanguage {
  return isSupportedLanguage(i18next.language) ? i18next.language : DEFAULT_LANGUAGE;
}

export async function getPersistedLanguage(): Promise<SupportedLanguage | null> {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (storedLanguage && isSupportedLanguage(storedLanguage)) {
      return storedLanguage;
    }
  } catch {
    // Ignore storage errors — bootstrap falls back to English.
  }

  return null;
}

/**
 * Initialize i18next with en/es resources.
 * Default language: en. Missing keys fall back to en.
 * Safe to call multiple times — returns existing instance if already initialized.
 */
export async function initI18n(): Promise<typeof i18next> {
  if (i18next.isInitialized) {
    return i18next;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const initialLanguage = (await getPersistedLanguage()) ?? DEFAULT_LANGUAGE;

    await i18next.use(initReactI18next).init({
      resources: RESOURCES,
      lng: initialLanguage,
      fallbackLng: DEFAULT_LANGUAGE,
      interpolation: {
        escapeValue: false, // React already escapes
      },
      returnObjects: false,
    });

    return i18next;
  })();

  const currentInitPromise = initPromise;

  try {
    return await currentInitPromise;
  } catch (error) {
    initPromise = null;
    throw error;
  }
}
