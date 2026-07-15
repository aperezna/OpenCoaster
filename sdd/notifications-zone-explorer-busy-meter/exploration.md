## Exploration: Notifications + Zone Explorer + Busy Meter

### Current State

OpenCoaster is an Expo 52 + React Native 0.76 app using:

- **TanStack Query v5** with persistence via AsyncStorage persister
- **ThemeParksWikiProvider** fetching live data from `api.themeparks.wiki/v1`
- **Feature-first architecture** under `src/features/` with shared data layer under `src/data/`
- **i18n** via i18next with English + Spanish JSON locale files
- **AsyncStorage** already in use for favorites and itineraries persistence

The `ParkDetailScreen` shows: photo header → park info → weather + hours cards → flat attraction list. Attractions flow as `Attraction[]` from `useParkDetail` → `provider.getParkAttractions()`.

### Feature-by-Feature Analysis

---

### Feature 1: Push Notifications via Background Fetch

**Goal**: Check wait times every ~15 min while app is backgrounded. Fire local notification when a user-set threshold is breached.

#### Dependencies Needed

| Package                 | Status            | Notes                                                       |
| ----------------------- | ----------------- | ----------------------------------------------------------- |
| `expo-notifications`    | **NOT installed** | Need `expo install expo-notifications` + plugin in app.json |
| `expo-task-manager`     | **NOT installed** | Needed for background task registration                     |
| `expo-background-fetch` | **NOT installed** | Needed for periodic background fetch                        |

#### Files to Create

- `src/features/notifications/useNotificationPreferences.ts` — hook for per-attraction threshold settings stored in AsyncStorage
- `src/features/notifications/NotificationSettingsModal.tsx` — UI to set threshold per attraction (triggered from AttractionList)
- `src/features/notifications/backgroundNotificationTask.ts` — background fetch task definition:
  - Register background task with `expo-task-manager`
  - Fetch selected parks' attractions via the same `ThemeParksWikiProvider`
  - Compare current waitTimes against stored thresholds
  - Schedule `expo-notifications` local notification if threshold breached

#### Files to Modify

- `App.tsx` — register background task on app start, request notification permissions
- `app.json` — add `expo-notifications` plugin, background modes config for iOS
- `src/data/models/Attraction.ts` — no changes needed (waitTime + status already available)
- `src/features/park-details/AttractionList.tsx` — add "Notify me" button per attraction (opens modal) → ~+30 lines
- `src/features/park-details/ParkDetailScreen.tsx` — integrate notification preferences modal → ~+15 lines
- `src/i18n/locales/en.json` and `es.json` — add notification-related keys (~10 keys)

#### Integration Points

- Notification preferences stored in AsyncStorage under key like `opencoaster:notify-preferences` using the same `StorageAdapter` pattern as `useFavorites.ts`
- Background task reuses `ThemeParksWikiProvider.fetchJson` to call `/entity/{parkId}/live` directly (avoids React Query dependency cycle)
- Must gate background task registration behind `Platform.OS` checks (some features differ iOS/Android)

#### Risks & Edge Cases

- **iOS background fetch is unreliable** — iOS decides when to run background tasks. 15-min interval is a _minimum_, not guaranteed
- **Android foreground service** — Android 14+ may require a foreground service notification for persistent background work
- **Wait time = 0** — some operating attractions report waitTime: 0 (walk-on). Notifications should only fire when waitTime is actually below threshold AND > 0
- **Park closed** — must check park-level status before evaluating thresholds (already handled in `getParkAttractions`)
- **Excessive notifications** — need debounce per attraction (don't re-notify if already notified within last X hours)
- **Uninstall/reinstall** — stored preferences survive via AsyncStorage but background task must be re-registered

#### Estimated Changed Lines

- New files: ~180 lines total
  - useNotificationPreferences.ts: ~70 lines
  - NotificationSettingsModal.tsx: ~80 lines
  - backgroundNotificationTask.ts: ~30 lines
- Modified files: ~80 lines
  - App.tsx: ~25 lines
  - app.json: ~8 lines
  - AttractionList.tsx: ~30 lines
  - ParkDetailScreen.tsx: ~15 lines
  - i18n files: ~10 lines
- **Total: ~260 lines**

---

### Feature 2: Zone Explorer (Lands)

**Goal**: Group attractions by park "land" or "area" instead of flat list.

#### Critical API Finding

The ThemeParks.wiki API **does NOT expose LAND entities** in the entity hierarchy for parks like Magic Kingdom or Efteling. All attractions have `parentId` pointing directly to the park itself. Both parks' `/children` endpoints return ATTRACTION, SHOW, and RESTAURANT entities all at the same level.

There are two viable approaches:

#### Approach A: Extract zone from attraction name (recommended for v1)

- Some attractions contain zone hints in their names (e.g., "Walt Disney World Railroad - Fantasyland", "Walt Disney World Railroad - Main Street, U.S.A.")
- Use heuristic parsing: split on `-` or `–` and extract the suffix if it matches known zone names
- Alternative: use attraction coordinates (available in API) with spatial clustering to infer zones
- **Pros**: No API changes; works for any park; coordinates are already in the API
- **Cons**: Heuristic/incomplete; won't work for parks without zone naming conventions

#### Approach B: Modify recursive collection to preserve hierarchy

- Change `getParkAttractions` to collect ALL entity types in the tree, not just ATTRACTION/SHOW
- Extract the parent entity name for each attraction (the intermediate LAND-like entity)
- Note: The API doesn't use `entityType: 'LAND'` — intermediate entities may have different types
- **Pros**: Data-driven; would work if the API adds LAND entities
- **Cons**: Currently no LAND entities exist in the API response; adds complexity

#### Files to Create

- `src/data/models/Zone.ts` — new model: `{ id: string; name: string; attractions: Attraction[] }`
- `src/features/park-details/ZoneList.tsx` — new component rendering zones with sections (each zone is a SectionList section with its own header)

#### Files to Modify

- `src/data/models/Attraction.ts` — add optional `zone?: string` field (or `landId?: string`)
- `src/data/providers/ThemeParksWikiProvider.ts` — modify `getParkAttractions` to preserve parent hierarchy and extract zone info
- `src/data/providers/ParkDiscoveryProvider.ts` — update interface return type to include zone grouping (or keep flat and add separate method)
- `src/data/providers/fixtures.ts` — add zone data to fixture attractions
- `src/features/park-details/useParkDetail.ts` — return zone-grouped attractions alongside flat list
- `src/features/park-details/ParkDetailScreen.tsx` — replace `AttractionList` with `ZoneList` conditionally
- `src/features/park-details/AttractionList.tsx` — keep as fallback for parks without zones
- `src/components/Skeleton.tsx` — add `ZoneListSkeleton`
- `src/i18n/locales/en.json` and `es.json` — add zone-related keys

#### Integration Points

- `useParkDetail` already returns `attractions: Attraction[]` — a second return field `zones: Zone[]` can be derived from the same data
- The sectioned list uses React Native's `SectionList` instead of `FlatList`
- Existing `onAddToItinerary` callbacks still work — attractions are the same objects, just grouped visually

#### Risks & Edge Cases

- **Parks without zones** — must gracefully fall back to flat list when no zone info is available
- **Attractions in wrong zone** — heuristic parsing may misplace attractions; need a manual override mechanism (or use coordinates)
- **Performance** — SectionList with many sections can lag; use `getItemLayout` for fixed-height items
- **Empty zones** — don't render sections with 0 attractions
- **Fixture/data update** — new tests need realistic zone-aware fixture data

#### Estimated Changed Lines

- New files: ~120 lines (Zone.ts + ZoneList.tsx)
- Modified files: ~200 lines
  - Attraction.ts: ~2 lines
  - ThemeParksWikiProvider.ts: ~50 lines (recursive collection changes + zone extraction)
  - ParkDiscoveryProvider.ts: ~10 lines (interface)
  - fixtures.ts: ~30 lines
  - useParkDetail.ts: ~20 lines
  - ParkDetailScreen.tsx: ~40 lines
  - AttractionList.tsx: ~10 lines (minor adjustments)
  - Skeleton.tsx: ~30 lines
  - i18n files: ~8 lines
- **Total: ~320 lines**

---

### Feature 3: Real-time Busy Meter

**Goal**: Display a park busy indicator (Low/Medium/High) based on current wait times.

#### Algorithm

1. Filter attractions where `status === 'operating'` AND `waitTime > 0`
2. Calculate average wait time across those attractions
3. Apply thresholds:
   - **Low**: avg < 15 min
   - **Medium**: avg 15-35 min
   - **High**: avg > 35 min
4. _(Could be made configurable or park-adaptive in future)_

#### Files to Create

- `src/features/park-details/BusyMeter.tsx` — component with colored badge/indicator showing Low/Medium/High
- `src/data/busy/busyMeter.ts` — pure function `calculateBusyLevel(attractions: Attraction[]): { level: 'low' | 'medium' | 'high'; averageWait: number }`

#### Files to Modify

- `src/features/park-details/ParkDetailScreen.tsx` — add BusyMeter to the cards row (next to Weather + Hours) → ~+20 lines
- `src/components/Skeleton.tsx` — add `BusyMeterSkeleton` → ~+20 lines
- `src/i18n/locales/en.json` and `es.json` — add busy meter i18n keys → ~+8 lines

#### Integration with Existing Code

- ParkDetailScreen already fetches `attractions` via `useParkDetail` — no new query needed
- BusyMeter can be computed as a `useMemo` from the attractions array
- Fits in the `cardsRow` View that already contains `WeatherCard` and `HoursCard`
- Re-fetches when pull-to-refresh triggers (already handled by `refetchAll`)

#### Risks & Edge Cases

- **Only closed attractions** — if no attractions are operating, show "—" or "Closed"
- **All wait times are 0** — treat as "Low" (walk-on conditions) but show 0 avg
- **Single attraction skewing** — a single 120-min coaster shouldn't make the whole park "High" if everything else is 5 min. Consider median instead of mean for v2.
- **Stale data** — busy meter is only as fresh as the last attractions fetch (which has 30s staleTime)
- **Empty park** — handle empty attractions array gracefully

#### Estimated Changed Lines

- New files: ~55 lines (BusyMeter.tsx ~35 + busyMeter.ts ~20)
- Modified files: ~60 lines
  - ParkDetailScreen.tsx: ~20 lines (add BusyMeter to cards row)
  - Skeleton.tsx: ~20 lines
  - i18n files: ~8 lines
  - ParkDetailScreen test: ~12 lines
- **Total: ~115 lines**

---

### Combined Impact Summary

| Metric               | Feature 1 (Notifications) | Feature 2 (Zone Explorer) | Feature 3 (Busy Meter) | Combined Total |
| -------------------- | ------------------------- | ------------------------- | ---------------------- | -------------- |
| New files            | 3                         | 2                         | 2                      | **7**          |
| Modified files       | 5                         | 9                         | 4                      | **~18**        |
| Estimated Δ lines    | ~260                      | ~320                      | ~115                   | **~695**       |
| 800-line budget risk | Low                       | Medium                    | Low                    | **Medium**     |
| Test files to update | 2                         | 3                         | 1                      | **~6**         |

### 800-Line Review Budget Assessment

The combined estimate is ~695 lines across all three features. This **fits within the 800-line budget** if implemented as a single change, but it's tight. The **Zone Explorer** alone is ~320 lines and has the highest risk of exceeding estimates (API changes are unpredictable).

**Recommendation**: Consider splitting into:

- **PR 1**: Busy Meter (smallest, self-contained, ~115 lines) — quick win
- **PR 2**: Zone Explorer + Notifications bundled (~580 lines) — or split further
- The combined 695 lines is under budget but leaves little margin for test files (~6 test files)

### Risks Across All Features

1. **iOS background fetch reliability** — Feature 1 may not work consistently on iOS; document as known limitation
2. **API missing LAND entities** — Feature 2 depends on heuristic extraction unless API changes; coordinate-based clustering is a fallback but complex
3. **AsyncStorage limits on free tier Expo Go** — Notification preferences + zone data could push storage; monitor with Sentry
4. **Testing background tasks** — Feature 1 is difficult to unit test; focus on integration and acceptance tests
5. **Feature interactions** — Notifications depend on attractions data; Zone Explorer changes Attraction model; coordinate with each other
6. **TypeScript complexity** — The provider interface change for Feature 2 (`getParkAttractions` returning grouped data) cascades to `FixtureParkDiscoveryProvider` and all consumers

### Ready for Proposal

**Yes** — All three features are well-understood. Proceed to SDD proposal for the combined change `notifications-zone-explorer-busy-meter`. The proposal should:

1. Recommend **PR 1 (Busy Meter)** as standalone low-risk slice
2. Proceed with **heuristic zone extraction** for Feature 2 (Approach A)
3. Use the **expo-notifications + expo-task-manager + AsyncStorage** pattern for Feature 1
4. Confirm delivery strategy: single PR under 800 lines vs. chained PRs
