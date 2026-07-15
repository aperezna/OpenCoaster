import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../features/notifications/notificationTypes';

/**
 * Fire-once suppression tracking for notification alerts.
 *
 * After a notification fires for an attraction, its id is stored here.
 * Re-notification is suppressed until the wait exceeds the threshold AND
 * drops below it again — at which point the attraction is removed from this set
 * via {@link removeSuppressed}.
 */

const STORAGE_KEY = STORAGE_KEYS.NOTIFICATION_SUPPRESSED;

/**
 * Read the current set of suppressed attraction ids.
 * Returns an empty Set if no suppression state exists.
 */
export async function getSuppressed(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed: string[] = JSON.parse(raw);
    return new Set(parsed);
  } catch {
    return new Set<string>();
  }
}

/**
 * Add an attraction id to the suppressed set so it won't re-notify.
 */
export async function addSuppressed(attractionId: string): Promise<void> {
  const suppressed = await getSuppressed();
  suppressed.add(attractionId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...suppressed]));
}

/**
 * Remove an attraction id from the suppressed set (e.g., wait went above threshold again).
 */
export async function removeSuppressed(attractionId: string): Promise<void> {
  const suppressed = await getSuppressed();
  suppressed.delete(attractionId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...suppressed]));
}

/**
 * Clear all suppressed attraction ids.
 */
export async function removeAllSuppressed(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
