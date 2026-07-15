jest.mock('expo-task-manager');
jest.mock('expo-background-fetch');
jest.mock('expo-notifications');
jest.mock('../../providers/ThemeParksWikiProvider', () => ({
  ThemeParksWikiProvider: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import type { Attraction } from '../../models/Attraction';
import { ThemeParksWikiProvider } from '../../providers/ThemeParksWikiProvider';
import {
  BACKGROUND_TASK_NAME,
  STORAGE_KEYS,
  type NotificationPreference,
} from '../../../features/notifications/notificationTypes';
import { checkThresholds, ensureBackgroundTaskDefined } from '../backgroundTask';

const mockGetParkAttractions = jest.fn<Promise<Attraction[]>, [string]>();
const MockThemeParksWikiProvider = ThemeParksWikiProvider as unknown as jest.Mock;

const operatingAttraction = (overrides: Partial<Attraction> = {}): Attraction => ({
  id: 'attr-1',
  name: 'Test Coaster',
  parkId: 'park-1',
  waitTime: 20,
  status: 'operating',
  type: 'roller_coaster',
  ...overrides,
});

const preference = (overrides: Partial<NotificationPreference> = {}): NotificationPreference => ({
  parkId: 'park-1',
  attractionId: 'attr-1',
  attractionName: 'Test Coaster',
  thresholdMin: 30,
  ...overrides,
});

async function writePreferences(preferences: NotificationPreference[]): Promise<void> {
  const storage = preferences.reduce<
    Record<string, Record<string, { attractionName: string; thresholdMin: number }>>
  >((acc, item) => {
    if (!acc[item.parkId]) {
      acc[item.parkId] = {};
    }

    acc[item.parkId][item.attractionId] = {
      attractionName: item.attractionName,
      thresholdMin: item.thresholdMin,
    };

    return acc;
  }, {});

  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES, JSON.stringify(storage));
}

function getDefinedTask(): () => Promise<number> {
  const calls = (TaskManager.defineTask as jest.Mock).mock.calls;
  return calls[calls.length - 1][1] as () => Promise<number>;
}

describe('backgroundTask', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    MockThemeParksWikiProvider.mockImplementation(() => ({
      getParkAttractions: mockGetParkAttractions,
    }));
  });

  it('fires when an operating attraction drops below the configured threshold', () => {
    const result = checkThresholds(
      [preference()],
      [operatingAttraction({ waitTime: 18 })],
      new Set(),
    );

    expect(result).toEqual([
      {
        attractionId: 'attr-1',
        attractionName: 'Test Coaster',
        parkId: 'park-1',
        thresholdMin: 30,
        waitTime: 18,
      },
    ]);
  });

  it('suppresses attractions that already fired within the current wait-drop window', () => {
    const result = checkThresholds(
      [preference()],
      [operatingAttraction({ waitTime: 18 })],
      new Set(['attr-1']),
    );

    expect(result).toEqual([]);
  });

  it('defines the task and schedules a notification when a wait drops below threshold', async () => {
    await writePreferences([preference()]);
    mockGetParkAttractions.mockResolvedValue([operatingAttraction({ waitTime: 20 })]);

    ensureBackgroundTaskDefined();
    const task = getDefinedTask();

    await expect(task()).resolves.toBe(BackgroundFetch.BackgroundFetchResult.NewData);
    expect(MockThemeParksWikiProvider).toHaveBeenCalledTimes(1);
    expect(mockGetParkAttractions).toHaveBeenCalledWith('park-1');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Test Coaster',
          body: 'Wait time dropped to 20 min (threshold: 30 min)',
          data: {
            attractionId: 'attr-1',
            parkId: 'park-1',
          },
        }),
        trigger: null,
      }),
    );

    await expect(AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SUPPRESSED)).resolves.toBe(
      JSON.stringify(['attr-1']),
    );
  });

  it('does not schedule another notification while the attraction remains suppressed', async () => {
    await writePreferences([preference()]);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SUPPRESSED, JSON.stringify(['attr-1']));
    mockGetParkAttractions.mockResolvedValue([operatingAttraction({ waitTime: 19 })]);

    ensureBackgroundTaskDefined();
    const task = getDefinedTask();

    await expect(task()).resolves.toBe(BackgroundFetch.BackgroundFetchResult.NoData);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    await expect(AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SUPPRESSED)).resolves.toBe(
      JSON.stringify(['attr-1']),
    );
  });

  it('re-notifies only after the wait rises above the threshold and drops below it again', async () => {
    await writePreferences([preference()]);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SUPPRESSED, JSON.stringify(['attr-1']));

    ensureBackgroundTaskDefined();
    const task = getDefinedTask();

    mockGetParkAttractions.mockResolvedValueOnce([operatingAttraction({ waitTime: 40 })]);
    await expect(task()).resolves.toBe(BackgroundFetch.BackgroundFetchResult.NewData);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    await expect(AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SUPPRESSED)).resolves.toBe(
      JSON.stringify([]),
    );

    mockGetParkAttractions.mockResolvedValueOnce([operatingAttraction({ waitTime: 15 })]);
    await expect(task()).resolves.toBe(BackgroundFetch.BackgroundFetchResult.NewData);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    await expect(AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SUPPRESSED)).resolves.toBe(
      JSON.stringify(['attr-1']),
    );
  });
});
