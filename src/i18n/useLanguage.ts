import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SupportedLanguage = 'en' | 'es';

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'es'];
const STORAGE_KEY = '@opencoaster/language';

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
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isReady, setIsReady] = useState(false);

  // Load persisted language on mount
  useEffect(() => {
    let cancelled = false;

    async function loadLanguage() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && stored && isValidLanguage(stored)) {
          await i18next.changeLanguage(stored);
          setLanguageState(stored);
        }
      } catch {
        // Ignore storage errors — default to 'en'
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

    await AsyncStorage.setItem(STORAGE_KEY, lang);
    await i18next.changeLanguage(lang);
    setLanguageState(lang);
  }, []);

  return { language, setLanguage, isReady };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}
