import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import {
  getCurrentLanguage,
  getPersistedLanguage,
  isSupportedLanguage,
  LANGUAGE_STORAGE_KEY,
} from './config';

type SupportedLanguage = 'en' | 'es';

// ---------------------------------------------------------------------------
// useLanguage hook
// ---------------------------------------------------------------------------

/**
 * Hook that provides the current language, a setter that persists to
 * AsyncStorage, and a ready flag.
 *
 * Only 'en' and 'es' are valid values; unknown values are ignored.
 */
export function useLanguage() {
  const [language, setLanguageState] = useState<SupportedLanguage>(getCurrentLanguage);
  const [isReady, setIsReady] = useState(false);

  // Load persisted language on mount
  useEffect(() => {
    let cancelled = false;

    async function loadLanguage() {
      try {
        const storedLanguage = await getPersistedLanguage();

        if (cancelled) {
          return;
        }

        if (storedLanguage && storedLanguage !== i18next.language) {
          await i18next.changeLanguage(storedLanguage);
        }

        setLanguageState(storedLanguage ?? getCurrentLanguage());
      } catch {
        // Ignore storage errors — default to 'en'
        if (!cancelled) {
          setLanguageState(getCurrentLanguage());
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    loadLanguage();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist and change language
  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    if (!isValidLanguage(lang)) {
      return;
    }

    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    await i18next.changeLanguage(lang);
    setLanguageState(lang);
  }, []);

  return { language, setLanguage, isReady };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidLanguage(lang: string): lang is SupportedLanguage {
  return isSupportedLanguage(lang);
}
