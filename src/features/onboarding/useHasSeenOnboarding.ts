import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OnboardingState = 'loading' | 'seen' | 'unseen';

export interface UseHasSeenOnboardingReturn {
  status: OnboardingState;
  completeOnboarding: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Storage adapter interface (matching AsyncStorage subset)
// ---------------------------------------------------------------------------

interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ONBOARDING_KEY = 'opencoaster:hasSeenOnboarding';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook that detects whether the user has completed onboarding.
 *
 * @param storage - Optional AsyncStorage-like instance (for testing).
 *                  Defaults to real AsyncStorage.
 */
export function useHasSeenOnboarding(
  storage: AsyncStorageLike = AsyncStorage,
): UseHasSeenOnboardingReturn {
  const [status, setStatus] = useState<OnboardingState>('loading');

  useEffect(() => {
    let cancelled = false;

    storage
      .getItem(ONBOARDING_KEY)
      .then((value) => {
        if (cancelled) {
          return;
        }
        if (value === 'true') {
          setStatus('seen');
        } else {
          setStatus('unseen');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('unseen');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [storage]);

  const completeOnboarding = useCallback(async () => {
    await storage.setItem(ONBOARDING_KEY, 'true');
    setStatus('seen');
  }, [storage]);

  return { status, completeOnboarding };
}
