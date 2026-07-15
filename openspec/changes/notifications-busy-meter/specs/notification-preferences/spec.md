# Notification Preferences Specification

## Purpose

Provide per-attraction wait-time notification thresholds, persisted via AsyncStorage, checked by a background fetch task that fires local notifications when wait times drop below configured thresholds.

## Requirements

### Requirement: NotificationPreferences Model

The system MUST store preferences as a `Record<parkId, Record<attractionId, { attractionName: string; thresholdMin: number }>>` under AsyncStorage key `opencoaster:notification-preferences`. Each entry MUST include the attraction name for display without requiring a separate fetch.

#### Scenario: Valid preference structure

- GIVEN a preference is saved for attraction A in park 1
- WHEN retrieved from AsyncStorage
- THEN the entry contains a valid parkId, attractionId, attractionName, and thresholdMin

### Requirement: useNotificationPreferences Hook

The system MUST export a `useNotificationPreferences()` hook returning `{ preferences, setThreshold, removeThreshold, getMonitored }`. `setThreshold(parkId, attractionId, name, min)` MUST persist to AsyncStorage. `removeThreshold(parkId, attractionId)` MUST delete. `getMonitored()` MUST return all attractions with active thresholds across all parks.

#### Scenario: Set threshold persists

- GIVEN no threshold exists for attraction A
- WHEN `setThreshold('park1', 'attrA', 'Splash Mountain', 30)` is called
- THEN AsyncStorage contains the preference
- AND `getMonitored()` includes this entry

#### Scenario: Remove threshold

- GIVEN attraction A has an active 30 min threshold
- WHEN `removeThreshold('park1', 'attrA')` is called
- THEN the preference is removed from AsyncStorage
- AND `getMonitored()` excludes this entry

#### Scenario: Empty state

- GIVEN AsyncStorage has no `opencoaster:notification-preferences` key
- WHEN the hook initializes
- THEN preferences is an empty record

### Requirement: Background Task Lifecycle

The app MUST register a background task named `CHECK_WAIT_THRESHOLDS` via expo-task-manager at startup. The task MUST execute via expo-background-fetch targeting ~15 min intervals. It MUST load stored preferences, fetch current attraction data, and fire local notifications for operating attractions whose wait time is below threshold.

#### Scenario: Background task fires notification

- GIVEN attraction A has a threshold of 30 min and current wait is 20 min
- WHEN the background task executes
- THEN a local notification is scheduled for attraction A

### Requirement: Fire + Suppress Lifecycle

The system MUST notify at most once per attraction per "wait-drop window". After firing, it MUST suppress re-notification until the wait exceeds the threshold AND drops below it again. Suppression state MUST be stored under `opencoaster:notification-suppressed`.

#### Scenario: Suppresses duplicate notifications

- GIVEN a notification fired for attraction A at wait 20 min (threshold 30)
- AND the next check still shows wait 18 min
- WHEN the background task runs
- THEN no new notification fires for attraction A

#### Scenario: Re-notifies after reset

- GIVEN a notification fired for attraction A at wait 20 min
- AND the next check shows wait 40 min (above threshold)
- AND the following check shows wait 15 min (dropped below)
- WHEN the background task runs
- THEN a new notification fires for attraction A

### Requirement: Permission Handling

On the first threshold set, the system MUST prompt for notification permissions via expo-notifications. If denied, the system MUST NOT re-prompt. The system SHOULD show a UI message guiding to OS notification settings when permissions are denied but the user attempts to set a threshold.

#### Scenario: Auto-prompt on first set

- GIVEN no threshold has ever been set
- WHEN the user sets their first threshold
- THEN the system prompts for notification permissions

#### Scenario: Denied shows settings guidance

- GIVEN notification permissions were previously denied
- WHEN the user sets a threshold
- THEN a message guides the user to OS notification settings
- AND no permission prompt is shown

### Requirement: ProfileScreen Monitored Attractions

The ProfileScreen MUST display a "Monitored Attractions" section listing attractions with active thresholds, grouped by park. Each entry MUST show attraction name, park name, and threshold. Each entry MUST have a remove button calling `removeThreshold`. An empty state MUST display "No monitored attractions" when none exist.

#### Scenario: Shows monitored list

- GIVEN the user has thresholds for attraction A in park 1 and attraction B in park 2
- WHEN ProfileScreen renders
- THEN the "Monitored Attractions" section shows both entries

#### Scenario: Remove from monitored list

- GIVEN a monitored entry is visible
- WHEN the user taps remove
- THEN the entry disappears from the list

#### Scenario: Empty state

- GIVEN the user has no thresholds
- WHEN ProfileScreen renders
- THEN "No monitored attractions" text is shown
