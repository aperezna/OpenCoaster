import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useNotificationPreferences } from '../useNotificationPreferences';
import { STORAGE_KEYS } from '../notificationTypes';

const PREFS_KEY = STORAGE_KEYS.NOTIFICATION_PREFERENCES;
const PROMPTED_KEY = STORAGE_KEYS.HAS_PROMPTED_PERMISSION;

jest.mock('expo-notifications');

describe('useNotificationPreferences', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with empty preferences when nothing is stored', async () => {
    const { result } = renderHook(() => useNotificationPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.preferences).toEqual({});
    expect(result.current.getMonitored()).toEqual([]);
  });

  it('should persist a threshold via setThreshold and include it in getMonitored', async () => {
    const { result } = renderHook(() => useNotificationPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.setThreshold('park-1', 'attr-1', 'Space Mountain', 30);
    });

    expect(result.current.getMonitored()).toEqual([
      {
        parkId: 'park-1',
        attractionId: 'attr-1',
        attractionName: 'Space Mountain',
        thresholdMin: 30,
      },
    ]);

    // Also verify it persisted to AsyncStorage
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed['park-1']['attr-1'].thresholdMin).toBe(30);
  });

  it('should remove a threshold via removeThreshold', async () => {
    const { result } = renderHook(() => useNotificationPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.setThreshold('park-1', 'attr-1', 'Space Mountain', 30);
    });

    expect(result.current.getMonitored()).toHaveLength(1);

    await act(async () => {
      await result.current.removeThreshold('park-1', 'attr-1');
    });

    expect(result.current.getMonitored()).toEqual([]);
  });

  it('should support multiple thresholds across different parks', async () => {
    const { result } = renderHook(() => useNotificationPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.setThreshold('park-1', 'attr-1', 'Space Mountain', 30);
      await result.current.setThreshold('park-1', 'attr-2', 'Big Thunder', 20);
      await result.current.setThreshold('park-2', 'attr-3', 'Test Track', 45);
    });

    const monitored = result.current.getMonitored();
    expect(monitored).toHaveLength(3);
    expect(monitored.find((m) => m.attractionId === 'attr-2')?.thresholdMin).toBe(20);
  });

  it('should return empty after removing non-existent threshold', async () => {
    const { result } = renderHook(() => useNotificationPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Remove something that doesn't exist — should not throw
    await act(async () => {
      await expect(
        result.current.removeThreshold('park-1', 'non-existent'),
      ).resolves.toBeUndefined();
    });
  });

  it('should request notification permissions on the first threshold set and store the prompt flag', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'undetermined' });
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'granted' });

    const { result } = renderHook(() => useNotificationPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let permissionStatus: Awaited<ReturnType<typeof result.current.setThreshold>> | undefined;

    await act(async () => {
      permissionStatus = await result.current.setThreshold(
        'park-1',
        'attr-1',
        'Space Mountain',
        30,
      );
    });

    expect(permissionStatus).toBe('granted');
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem(PROMPTED_KEY)).toBe('true');
  });

  it('should not re-prompt after permission denial and should return denied for settings guidance', async () => {
    await AsyncStorage.setItem(PROMPTED_KEY, 'true');
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'denied' });

    const { result } = renderHook(() => useNotificationPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let permissionStatus: Awaited<ReturnType<typeof result.current.setThreshold>> | undefined;

    await act(async () => {
      permissionStatus = await result.current.setThreshold(
        'park-1',
        'attr-1',
        'Space Mountain',
        30,
      );
    });

    expect(permissionStatus).toBe('denied');
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('should sync threshold changes across mounted consumers without remounting', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' });

    const { result: first } = renderHook(() => useNotificationPreferences());
    const { result: second } = renderHook(() => useNotificationPreferences());

    await waitFor(() => {
      expect(first.current.isLoading).toBe(false);
      expect(second.current.isLoading).toBe(false);
    });

    await act(async () => {
      await first.current.setThreshold('park-1', 'attr-1', 'Space Mountain', 30);
    });

    await waitFor(() => {
      expect(second.current.getMonitored()).toEqual([
        {
          parkId: 'park-1',
          attractionId: 'attr-1',
          attractionName: 'Space Mountain',
          thresholdMin: 30,
        },
      ]);
    });
  });
});
