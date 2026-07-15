import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import { BACKGROUND_TASK_NAME } from '../../features/notifications/notificationTypes';
import { ensureBackgroundTaskDefined } from './backgroundTask';

/**
 * Initialize notification system at app startup:
 * 1. Create Android notification channel (required before showing notifications on Android)
 * 2. Register background fetch task for checking wait thresholds
 *
 * This must be called once at app init, outside React context.
 */
export async function initNotifications(): Promise<void> {
  ensureBackgroundTaskDefined();

  // -- Android channel setup ------------------------------------------------
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Wait Time Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // -- Background task registration -----------------------------------------
  // Target ~15 minute interval. On iOS this is advisory; on Android it's
  // more reliable but still subject to system Doze mode.
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 15 * 60, // 15 minutes in seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    // Registration may fail in dev or on simulators without background fetch support
    // This is non-fatal — the app still works; just background alerts won't fire.
  }
}
