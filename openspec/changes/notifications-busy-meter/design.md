# Design: Notifications + Busy Meter

## Technical Approach

Feature-first modules for busy meter (`src/features/park-details/busyMeter.ts` + `BusyMeter.tsx`) and notification UI (`src/features/notifications/`), plus a domain-level background task layer (`src/data/notifications/`) that instantiates `ThemeParksWikiProvider` directly — avoiding React context in background execution. All persistence uses AsyncStorage with typed keys. Three new expo packages required.

## Architecture Decisions

| Decision                        | Options                                                    | Tradeoff                                                                                                | Choice                                                                                                                             |
| ------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Notification module location    | `src/features/notifications/` vs `src/data/notifications/` | Feature UI (hook, modal) belongs with features; background task needs no React at all                   | **Split**: features + domain: `src/features/notifications/` (hook, modal) + `src/data/notifications/` (storage, task, suppression) |
| Background task provider access | Inject via context / import directly                       | Context unavailable outside React tree; ThemeParksWikiProvider is a plain class with no dependencies    | **Direct import**: background task creates `new ThemeParksWikiProvider()` — no DI framework needed                                 |
| Suppression tracking            | Track last-notified wait time vs boolean Set               | Boolean Set is simpler: just `Set<attractionId>` of suppressed attractions. Reset when wait > threshold | **`Set<attractionId>`** stored in AsyncStorage key `opencoaster:notification-suppressed`                                           |
| Permission flow                 | Prompt at app start vs on first threshold set              | Prompting at start is aggressive for users who don't want notifications                                 | **On first set**: `setThreshold` calls `requestPermissionsAsync()` once; if denied, surface OS-settings guidance text              |
| Channel setup                   | Android-only during init vs deferred                       | Android requires channel before showing notification                                                    | **`initNotifications()`** in App.tsx before app renders: `setNotificationChannelAsync` + register background task                  |

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        INIT (App.tsx)                           │
│  initNotifications(): setNotificationChannelAsync('default'),   │
│  BackgroundFetch.registerTaskAsync('CHECK_WAIT_THRESHOLDS', 900)│
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────────┐
│                  ParkDetailScreen                               │
│  ┌───────────┐   ┌──────────────────┐   ┌────────────────────┐ │
│  │ BusyMeter │◄──│ calculateBusyLevel│   │ ThresholdModal     │ │
│  │ (chip)    │   │ (pure function)   │   │ (slider 5-120 min) │ │
│  └───────────┘   └──────────────────┘   └────────┬───────────┘ │
│                                                   │             │
│  AttractionList (long-press) ◄────────────────────┘             │
└──────────────────────────────────────┬──────────────────────────┘
                                       │ setThreshold()
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  useNotificationPreferences (src/features/notifications/)       │
│  → AsyncStorage key: opencoaster:notification-preferences       │
└──────────────────────────────────────┬───────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────────┐
│ ProfileScreen                │    │ Background Task (~15 min)        │
│ "Monitored Attractions"      │    │ new ThemeParksWikiProvider()     │
│ section using same hook      │    │ → load preferences              │
│ (removeThreshold)            │    │ → fetchAttractions(parkId)      │
└──────────────────────────────┘    │ → compare wait < threshold      │
                                    │ → scheduleImmediateAsync()      │
                                    │ → update suppression Set         │
                                    └──────────────────────────────────┘
```

## File Changes

| File                                                       | Action | Description                                                                                                                |
| ---------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| `src/features/park-details/busyMeter.ts`                   | Create | `calculateBusyLevel(attractions, fetchedAt)` pure function — filter OPERATING, avg waitTime, map to level, return staleAge |
| `src/features/park-details/BusyMeter.tsx`                  | Create | Small colored chip showing level + optional stale indicator                                                                |
| `src/features/notifications/useNotificationPreferences.ts` | Create | Hook: load/set/remove/getMonitored, persists to AsyncStorage key                                                           |
| `src/features/notifications/ThresholdModal.tsx`            | Create | Bottom slider modal for setting threshold                                                                                  |
| `src/data/notifications/backgroundTask.ts`                 | Create | `CHECK_WAIT_THRESHOLDS` task definition, provider fetch, comparison, fire/suppress lifecycle                               |
| `src/data/notifications/initNotifications.ts`              | Create | Channel setup + task registration, called from App.tsx                                                                     |
| `src/data/notifications/suppressionStore.ts`               | Create | AsyncStorage read/write for `opencoaster:notification-suppressed` Set                                                      |
| `src/features/park-details/ParkDetailScreen.tsx`           | Modify | Insert BusyMeter in header area (between title row and cards row); integrate ThresholdModal                                |
| `src/features/park-details/AttractionList.tsx`             | Modify | Add `onLongPress` prop, bell indicator for monitored attractions                                                           |
| `src/features/profile/ProfileScreen.tsx`                   | Modify | Add "Monitored Attractions" section below itineraries                                                                      |
| `App.tsx`                                                  | Modify | Import and call `initNotifications()` after i18n init                                                                      |
| `app.json`                                                 | Modify | Add `expo-notifications` plugin block for Android                                                                          |
| `src/i18n/locales/en.json`                                 | Modify | Add ~15 keys for busy levels (low/moderate/busy), stale indicator, threshold modal, permission guidance, monitored section |
| `src/i18n/locales/es.json`                                 | Modify | Spanish translations for same keys                                                                                         |
| `package.json`                                             | Modify | Add `expo-notifications`, `expo-task-manager`, `expo-background-fetch`                                                     |

## Interfaces / Contracts

```typescript
// src/features/park-details/busyMeter.ts
type BusyLevel = 'low' | 'moderate' | 'busy';
type BusyMeterResult = {
  level: BusyLevel;
  averageWait: number;
  staleAge?: number; // minutes since fetch, only if > 15
};
function calculateBusyLevel(attractions: Attraction[], fetchedAt: Date): BusyMeterResult;

// src/features/notifications/useNotificationPreferences.ts
type NotificationPreferences = Record<string, Record<string, {
  attractionName: string;
  thresholdMin: number;
}>>;
interface NotificationPreferenceAPI {
  preferences: NotificationPreferences;
  setThreshold(parkId: string, attractionId: string, name: string, min: number): Promise<void>;
  removeThreshold(parkId: string, attractionId: string): Promise<void>;
  getMonitored(): Array<{ parkId: string; attractionId: string; attractionName: string; thresholdMin: number }>;
}

// src/data/notifications/suppressionStore.ts
function getSuppressed(): Promise<Set<string>>;
function addSuppressed(attractionId: string): Promise<void>;
function removeAllSuppressed(): Promise<void>; // called when wait > threshold resets

// src/data/notifications/backgroundTask.ts
const TASK_NAME = 'CHECK_WAIT_THRESHOLDS';
defineTask(TASK_NAME, async () => { ... });

// src/data/notifications/initNotifications.ts
export async function initNotifications(): Promise<void>;
```

## Testing Strategy

| Layer       | What to Test                                                                         | Approach                                   |
| ----------- | ------------------------------------------------------------------------------------ | ------------------------------------------ |
| Unit        | `calculateBusyLevel` — all 3 levels, empty attractions, no operating, stale age calc | Pure function, no mocks needed             |
| Unit        | `suppressionStore` — add/check/clear, empty state, persistence round-trip            | Mock AsyncStorage                          |
| Integration | `useNotificationPreferences` — set/remove/getMonitored, empty init                   | TL-RN render hook with mocked AsyncStorage |
| Integration | BusyMeter rendering for each level + stale indicator                                 | TL-RN snapshot with fixture props          |
| Integration | AttractionList long-press fires onLongPress callback                                 | TL-RN fireEvent with gesture               |
| Integration | ProfileScreen monitored section renders/dismisses entries                            | TL-RN with mocked hook                     |
| E2E         | Full flow: long-press → set threshold → verify in ProfileScreen                      | Maestro                                    |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No data migration. New packages installed, new AsyncStorage keys created on first use. Feature is additive — existing screens continue working without the new capabilities.

## Open Questions

- [ ] Should the background task refresh query cache via TanStack Query, or read fresh from the API independently? (Independent fetch avoids coupling to React query internals.)
