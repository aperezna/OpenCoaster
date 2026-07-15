# Tasks: Notifications + Busy Meter

## Review Workload Forecast

| Field                   | Value          |
| ----------------------- | -------------- |
| Estimated changed lines | ~650–750       |
| 400-line budget risk    | High           |
| Chained PRs recommended | No             |
| Suggested split         | Single PR      |
| Delivery strategy       | single-pr      |
| Chain strategy          | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                     | Likely PR | Focused test command                   | Runtime harness | Rollback boundary |
| ---- | ---------------------------------------- | --------- | -------------------------------------- | --------------- | ----------------- |
| 1    | Full change (busy meter + notifications) | Single PR | `npx jest --testPathPattern="busyMeter | BusyMeter       | notification"`    | `npx expo start` + verify busy meter renders, long-press opens modal | Revert all files, `npx expo uninstall` 3 packages, clear AsyncStorage key |

## Phase 1: Foundation

- [x] 1.1 Install expo-notifications, expo-task-manager, expo-background-fetch in package.json
- [x] 1.2 Add expo-notifications plugin to app.json
- [x] 1.3 Create suppressionStore.ts (getSuppressed/addSuppressed/removeAll via AsyncStorage)
- [x] 1.4 Create initNotifications.ts (channel setup + BackgroundFetch.registerTaskAsync)
- [x] 1.5 Modify App.tsx to call initNotifications() after i18n init
- [x] 1.6 Create notificationTypes.ts with shared type definitions

## Phase 2: Busy Meter (TDD)

- [x] 2.1 Write tests for calculateBusyLevel (low/moderate/busy, empty, no operating, stale calc)
- [x] 2.2 Create calculateBusyLevel.ts with BusyLevel type + calculateBusyLevel() pure function
- [x] 2.3 Write tests for BusyMeter rendering (3 levels + stale indicator)
- [x] 2.4 Create BusyMeter.tsx badge component with colored chip + stale-age text
- [x] 2.5 Modify ParkDetailScreen.tsx to render BusyMeter in header area

## Phase 3: Notification Preferences (TDD)

- [x] 3.1 Write tests for useNotificationPreferences (set/remove/getMonitored/empty init)
- [x] 3.2 Create useNotificationPreferences.ts hook with AsyncStorage persistence
- [x] 3.3 Write tests for ThresholdModal (slider range 5–120, confirm fires onSetThreshold)
- [x] 3.4 Create ThresholdModal.tsx with slider + confirm button
- [x] 3.5 Write tests for AttractionList long-press callback + bell indicator
- [x] 3.6 Modify AttractionList.tsx: add onLongPress prop, bell icon for monitored
- [x] 3.7 Integrate ThresholdModal into ParkDetailScreen via long-press

## Phase 4: Background Task

- [x] 4.1 Write tests for backgroundTask logic (compare thresholds, fire, suppress, re-notify)
- [x] 4.2 Create backgroundTask.ts: defineTask, fetch via new ThemeParksWikiProvider(), compare, fire notification, update suppression

## Phase 5: Profile Screen + i18n

- [x] 5.1 Write tests for ProfileScreen monitored section (render entries, remove, empty state)
- [x] 5.2 Modify ProfileScreen.tsx: add "Monitored Attractions" section with remove
- [x] 5.3 Add busy meter i18n keys (low/moderate/busy/stale) to en.json + es.json
- [x] 5.4 Add notification i18n keys (threshold modal, permission guidance, monitored) to en.json + es.json

## Phase 6: Integration & Polish

- [x] 6.1 Add permission flow: requestPermissionsAsync on first setThreshold + OS-settings guidance if denied
- [x] 6.2 Wire full flow: long-press → ThresholdModal → persist → ProfileScreen reflects
- [ ] 6.3 Add Maestro E2E flow: long-press attraction → set threshold → verify in ProfileScreen
