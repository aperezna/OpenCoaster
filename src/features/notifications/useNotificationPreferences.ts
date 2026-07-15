import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
  createSharedJsonStorageStore,
  useSharedJsonStorageState,
} from '../../data/cache/sharedJsonStorageStore';
import { STORAGE_KEYS } from './notificationTypes';
import type { NotificationPreference, NotificationPreferencesStorage } from './notificationTypes';

const PREFS_KEY = STORAGE_KEYS.NOTIFICATION_PREFERENCES;
const PROMPTED_PERMISSION_KEY = STORAGE_KEYS.HAS_PROMPTED_PERMISSION;
const getNotificationPreferencesStore =
  createSharedJsonStorageStore<NotificationPreferencesStorage>(PREFS_KEY, {});
const notificationPreferencesStore = getNotificationPreferencesStore(AsyncStorage);

export type NotificationPermissionStatus = 'granted' | 'denied';

export interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferencesStorage;
  isLoading: boolean;
  setThreshold: (
    parkId: string,
    attractionId: string,
    attractionName: string,
    thresholdMin: number,
  ) => Promise<NotificationPermissionStatus>;
  removeThreshold: (parkId: string, attractionId: string) => Promise<void>;
  getMonitored: () => NotificationPreference[];
}

async function ensureNotificationPermission(): Promise<NotificationPermissionStatus> {
  try {
    const currentPermissions = await Notifications.getPermissionsAsync();
    if (currentPermissions.status === 'granted') {
      return 'granted';
    }

    const hasPrompted = await AsyncStorage.getItem(PROMPTED_PERMISSION_KEY);
    if (!hasPrompted) {
      const requestedPermissions = await Notifications.requestPermissionsAsync();
      await AsyncStorage.setItem(PROMPTED_PERMISSION_KEY, 'true');

      return requestedPermissions.status === 'granted' ? 'granted' : 'denied';
    }
  } catch {
    return 'denied';
  }

  return 'denied';
}

/**
 * Hook for managing per-attraction notification threshold preferences.
 * Persists to AsyncStorage under key `opencoaster:notification-preferences`.
 */
export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const store = notificationPreferencesStore;
  const { value: preferences, isLoading } = useSharedJsonStorageState(store);

  const setThreshold = useCallback(
    async (parkId: string, attractionId: string, attractionName: string, thresholdMin: number) => {
      await store.updateValue((current) => ({
        ...current,
        [parkId]: {
          ...(current[parkId] ?? {}),
          [attractionId]: {
            attractionName,
            thresholdMin,
          },
        },
      }));

      return ensureNotificationPermission();
    },
    [store],
  );

  const removeThreshold = useCallback(
    async (parkId: string, attractionId: string) => {
      await store.updateValue((current) => {
        const parkPreferences = current[parkId];
        if (!parkPreferences || !parkPreferences[attractionId]) {
          return current;
        }

        const nextParkPreferences = { ...parkPreferences };
        delete nextParkPreferences[attractionId];

        if (Object.keys(nextParkPreferences).length === 0) {
          const remaining = { ...current };
          delete remaining[parkId];
          return remaining;
        }

        return {
          ...current,
          [parkId]: nextParkPreferences,
        };
      });
    },
    [store],
  );

  const getMonitored = useCallback((): NotificationPreference[] => {
    const result: NotificationPreference[] = [];
    for (const [parkId, attractions] of Object.entries(preferences)) {
      for (const [attractionId, prefs] of Object.entries(attractions)) {
        result.push({
          parkId,
          attractionId,
          attractionName: prefs.attractionName,
          thresholdMin: prefs.thresholdMin,
        });
      }
    }
    return result;
  }, [preferences]);

  return {
    preferences,
    isLoading,
    setThreshold,
    removeThreshold,
    getMonitored,
  };
}
