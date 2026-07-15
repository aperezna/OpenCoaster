# Proposal: Notifications + Busy Meter

## Intent

Users currently have no way to be alerted when a ride's wait time drops, or to gauge a park's overall crowd level at a glance. This change adds per-attraction wait threshold alerts via local push notifications and a real-time park busy meter computed from live attraction data.

## Scope

### In Scope

- Per-attraction wait threshold stored in AsyncStorage, set via long-press on attraction row
- Background fetch task (~15 min) that compares wait times and fires local notifications
- Fire-once lifecycle: suppress re-notification until wait exceeds threshold AND drops again
- ProfileScreen section to view/remove monitored attractions
- Busy meter badge in park detail header (Low 🟢 / Moderate 🟡 / Busy 🔥) with stale-data age indicator
- Auto-prompt notification permissions on first threshold set; guide to OS settings if denied
- i18n keys for all new strings (en + es)

### Out of Scope

- Zone/land explorer
- Server-side push notifications (local-only)
- Historical crowd data / predictive calendar
- User reviews

## Capabilities

### New Capabilities

- `notification-preferences`: Per-attraction wait threshold CRUD stored in AsyncStorage, accessed via useNotificationPreferences hook. UI: threshold modal + profile section.
- `background-notification-task`: expo-task-manager background fetch that checks wait times against stored thresholds and fires local notifications with fire+suppress lifecycle.
- `busy-meter`: Pure function calculating park busy level from attraction wait times; badge component with stale-data age indicator.

### Modified Capabilities

- `park-detail`: Add busy meter chip to header row; add long-press gesture on attraction rows to set notification threshold.
- `profile-screen`: Add "Monitored Attractions" section with list and remove capability.
- `i18n-infrastructure`: Add translation keys for 3 busy levels, notification-related strings, and permission guidance.

## Approach

**Busy Meter**: Pure `calculateBusyLevel(attractions)` function → avg of operating attractions' waitTimes mapped to Low/Moderate/Busy thresholds. Rendered as a small chip in ParkDetailScreen header. Staleness (>15 min) shows a "cached X min ago" indicator alongside. No new API calls.

**Notifications**: `useNotificationPreferences` hook stores `Record<parkId, Record<attractionId, thresholdMin>>` in AsyncStorage. Long-press on attraction row opens a bottom sheet with a slider. A background task registered once at app startup fires every ~15 min, loads stored preferences, fetches live data via ThemeParksWikiProvider, compares, and schedules expo-notifications local notifications. Fire-once per attraction until wait exceeds threshold and drops again.

## Affected Areas

| Area                                             | Impact   | Description                                     |
| ------------------------------------------------ | -------- | ----------------------------------------------- |
| `src/features/park-details/BusyMeter.tsx`        | New      | Busy level badge component                      |
| `src/features/park-details/busyMeter.ts`         | New      | Pure calculateBusyLevel function                |
| `src/features/notifications/*`                   | New      | Hook + modal + background task                  |
| `src/features/park-details/ParkDetailScreen.tsx` | Modified | Add busy meter + notification modal integration |
| `src/features/park-details/AttractionList.tsx`   | Modified | Add long-press for threshold                    |
| `src/features/profile/ProfileScreen.tsx`         | Modified | Add monitored attractions section               |
| `App.tsx`                                        | Modified | Register background task, permissions           |
| `app.json`                                       | Modified | Add expo-notifications plugin                   |
| `src/i18n/locales/*.json`                        | Modified | ~15 new keys                                    |

## Risks

| Risk                            | Likelihood | Mitigation                                                   |
| ------------------------------- | ---------- | ------------------------------------------------------------ |
| iOS background fetch unreliable | High       | Document as known limitation; Android is primary target      |
| Excessive notifications         | Low        | Fire-once lifecycle + suppress until threshold reset         |
| Permission denied               | Low        | Auto-guide to OS settings once; don't re-prompt aggressively |

## Rollback Plan

1. Remove expo packages: `npx expo uninstall expo-notifications expo-task-manager expo-background-fetch`
2. Remove expo-notifications plugin from app.json
3. Remove background task registration from App.tsx
4. Clear AsyncStorage key `opencoaster:notification-preferences`
5. Revert ParkDetailScreen, AttractionList, ProfileScreen changes

## Dependencies

- `expo-notifications`, `expo-task-manager`, `expo-background-fetch` (new packages)
- ThemeParksWikiProvider live endpoint (already used by app)
- AsyncStorage (already used by app)

## Success Criteria

- [ ] Busy meter shows correct level for known fixture data (Low < 15, Moderate 15-30, Busy > 30)
- [ ] Setting a threshold from ParkDetailScreen persists to AsyncStorage and shows in ProfileScreen
- [ ] Background task triggers local notification when wait drops below threshold
- [ ] No duplicate notifications for same attraction within same wait-drop window
- [ ] Stale indicator appears when attractions data > 15 min old
