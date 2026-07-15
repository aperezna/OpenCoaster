/**
 * Type definitions for the notification system.
 */

/**
 * A single notification preference mapping an attraction to a wait-time threshold.
 */
export interface NotificationPreference {
  parkId: string;
  attractionId: string;
  attractionName: string;
  thresholdMin: number;
}

/**
 * Internal storage shape: Record<parkId, Record<attractionId, Omit<NotificationPreference, 'parkId' | 'attractionId'>>>
 */
export type NotificationPreferencesStorage = Record<
  string,
  Record<
    string,
    {
      attractionName: string;
      thresholdMin: number;
    }
  >
>;

/**
 * Result from the busy meter calculation.
 */
export type BusyLevel = 'low' | 'moderate' | 'busy';

export interface BusyMeterResult {
  level: BusyLevel;
  averageWait: number;
  staleAge?: number;
}

/** AsyncStorage keys */
export const STORAGE_KEYS = {
  NOTIFICATION_PREFERENCES: 'opencoaster:notification-preferences',
  NOTIFICATION_SUPPRESSED: 'opencoaster:notification-suppressed',
  HAS_PROMPTED_PERMISSION: 'opencoaster:has-prompted-permission',
  HAS_SEEN_ONBOARDING: 'opencoaster:hasSeenOnboarding',
} as const;

/** Background task name */
export const BACKGROUND_TASK_NAME = 'CHECK_WAIT_THRESHOLDS';
