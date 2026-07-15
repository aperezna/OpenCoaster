import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import type { Attraction } from '../models/Attraction';
import { ThemeParksWikiProvider } from '../providers/ThemeParksWikiProvider';
import { addSuppressed, getSuppressed, removeSuppressed } from '../cache/suppressionStore';
import {
  BACKGROUND_TASK_NAME,
  STORAGE_KEYS,
  type NotificationPreference,
  type NotificationPreferencesStorage,
} from '../../features/notifications/notificationTypes';

export interface ThresholdViolation {
  attractionId: string;
  attractionName: string;
  parkId: string;
  waitTime: number;
  thresholdMin: number;
}

interface BackgroundTaskDependencies {
  addSuppressed: (attractionId: string) => Promise<void>;
  getSuppressed: () => Promise<Set<string>>;
  loadPreferencesStorage: () => Promise<NotificationPreferencesStorage>;
  provider: {
    getParkAttractions: (parkId: string) => Promise<Attraction[]>;
  };
  removeSuppressed: (attractionId: string) => Promise<void>;
  scheduleNotification: (request: {
    content: {
      body: string;
      data: {
        attractionId: string;
        parkId: string;
      };
      title: string;
    };
    trigger: null;
  }) => Promise<string>;
}

export function flattenPreferences(
  storage: NotificationPreferencesStorage,
): NotificationPreference[] {
  const preferences: NotificationPreference[] = [];

  for (const [parkId, attractions] of Object.entries(storage)) {
    for (const [attractionId, preference] of Object.entries(attractions)) {
      preferences.push({
        parkId,
        attractionId,
        attractionName: preference.attractionName,
        thresholdMin: preference.thresholdMin,
      });
    }
  }

  return preferences;
}

export function checkThresholds(
  preferences: NotificationPreference[],
  attractions: Attraction[],
  suppressed: Set<string>,
): ThresholdViolation[] {
  const violations: ThresholdViolation[] = [];
  const preferenceByAttractionId = new Map(
    preferences.map((preference) => [preference.attractionId, preference] as const),
  );

  for (const attraction of attractions) {
    const preference = preferenceByAttractionId.get(attraction.id);

    if (!preference) {
      continue;
    }

    if (attraction.status !== 'operating') {
      continue;
    }

    if (suppressed.has(attraction.id)) {
      continue;
    }

    if (attraction.waitTime >= preference.thresholdMin) {
      continue;
    }

    violations.push({
      attractionId: attraction.id,
      attractionName: attraction.name,
      parkId: attraction.parkId,
      waitTime: attraction.waitTime,
      thresholdMin: preference.thresholdMin,
    });
  }

  return violations;
}

export function getSuppressionResets(
  preferences: NotificationPreference[],
  attractions: Attraction[],
  suppressed: Set<string>,
): string[] {
  const attractionById = new Map(
    attractions.map((attraction) => [attraction.id, attraction] as const),
  );

  return preferences
    .filter((preference) => suppressed.has(preference.attractionId))
    .filter((preference) => {
      const attraction = attractionById.get(preference.attractionId);
      return Boolean(attraction && attraction.waitTime > preference.thresholdMin);
    })
    .map((preference) => preference.attractionId);
}

function createBackgroundTaskDependencies(): BackgroundTaskDependencies {
  return {
    provider: new ThemeParksWikiProvider(),
    loadPreferencesStorage: async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES);

      if (!raw) {
        return {};
      }

      try {
        return JSON.parse(raw) as NotificationPreferencesStorage;
      } catch {
        return {};
      }
    },
    scheduleNotification: Notifications.scheduleNotificationAsync,
    getSuppressed,
    addSuppressed,
    removeSuppressed,
  };
}

export async function runBackgroundTask(
  dependencies: BackgroundTaskDependencies = createBackgroundTaskDependencies(),
): Promise<number> {
  const storage = await dependencies.loadPreferencesStorage();
  const preferences = flattenPreferences(storage);

  if (preferences.length === 0) {
    return BackgroundFetch.BackgroundFetchResult.NoData;
  }

  const suppressed = await dependencies.getSuppressed();
  const parkIds = [...new Set(preferences.map((preference) => preference.parkId))];
  const allAttractions: Attraction[] = [];

  for (const parkId of parkIds) {
    try {
      const attractions = await dependencies.provider.getParkAttractions(parkId);
      allAttractions.push(...attractions);
    } catch {
      // Skip transient park fetch failures and continue checking other parks.
    }
  }

  const violations = checkThresholds(preferences, allAttractions, suppressed);

  for (const violation of violations) {
    try {
      await dependencies.scheduleNotification({
        content: {
          title: violation.attractionName,
          body: `Wait time dropped to ${violation.waitTime} min (threshold: ${violation.thresholdMin} min)`,
          data: {
            attractionId: violation.attractionId,
            parkId: violation.parkId,
          },
        },
        trigger: null,
      });

      await dependencies.addSuppressed(violation.attractionId);
      suppressed.add(violation.attractionId);
    } catch {
      // Per-iteration error: skip this violation and continue with remaining ones
    }
  }

  const resets = getSuppressionResets(preferences, allAttractions, suppressed);

  for (const attractionId of resets) {
    try {
      await dependencies.removeSuppressed(attractionId);
      suppressed.delete(attractionId);
    } catch {
      // Per-iteration error: skip this reset and continue with remaining ones
    }
  }

  if (violations.length > 0 || resets.length > 0) {
    return BackgroundFetch.BackgroundFetchResult.NewData;
  }

  return BackgroundFetch.BackgroundFetchResult.NoData;
}

export function ensureBackgroundTaskDefined(): void {
  TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
    try {
      return await runBackgroundTask();
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}
