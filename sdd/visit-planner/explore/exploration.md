## Exploration: Visit Planner / Itinerary

### Current State

The OpenCoaster app is an Expo SDK 52 / React Native 0.76 Android MVP with feature-first architecture. It currently has no itinerary or visit-planning functionality. Here's what exists today relevant to this feature:

**Park Detail & Attractions (`src/features/park-details/`)**:

- `useParkDetail(parkId, provider)` uses `useQueries` to fire 4 parallel TanStack Query fetches: park info, weather, hours, attractions.
- `getParkAttractions(parkId)` returns `Attraction[]` with `{ id, name, parkId, waitTime, status (operating|closed|down), type (roller_coaster|water_ride|dark_ride|flat_ride|show|family) }`.
- `AttractionList` renders a FlatList with name, type label, status dot, and wait time.
- ThemeParksWikiProvider fetches `/entity/{parkId}/children` + `/entity/{parkId}/live` in parallel, merges live data (wait times, status) into each attraction.
- **No method exists to fetch specific attractions by ID** — you get all attractions for a park.

**Favorites Persistence (`src/features/favorites/useFavorites.ts`)**:

- Closest existing pattern for user collections.
- Uses React `useState + useEffect` for loading on mount, `useCallback` for mutations.
- `StorageAdapter` interface (`getItem`, `setItem`, `removeItem`) injected as constructor parameter — defaults to `AsyncStorageAdapter`.
- Data stored as JSON string under key `'opencoaster:favorites'`.
- Fire-and-forget persistence: `adapter.setItem(key, JSON.stringify(next)).catch(() => {})`.
- Model: `FavoritePark { parkId, parkName, addedAt }` — simple flat array.
- Testing via `createInMemoryAdapter()` — synchronous thenable wrapper.

**Data Layer (`src/data/providers/ParkDiscoveryProvider.ts`)**:

- Interface: `searchParks`, `getParkById`, `getParkWeather`, `getParkHours`, `getParkAttractions`, `getUserProfile`.
- Context-based provider pattern: `ParkDiscoveryContextProvider` → `useParkDiscoveryProvider()`.
- Can add new methods to the interface and both implementations (ThemeParksWikiProvider + FixtureParkDiscoveryProvider).

**Navigation (`src/navigation/`)**:

- Bottom tabs: `Mapa` (Discovery), `Parques` (nested stack), `Usuario` (Profile).
- `ParquesStackNavigator` has only 2 screens: `ParksList`, `ParkDetail`.
- No Expo Router — plain `@react-navigation/native` v7 + `native-stack` + `bottom-tabs`.
- No VisitPlanner route exists.

**Profile Screen (`src/features/profile/ProfileScreen.tsx`)**:

- Shows user avatar, username, email, member-since date, favorites list, dark mode toggle, logout.
- Favorites rendered as a simple FlatList of park names that navigate to ParkDetail.
- Section-style layout — easy to add an "Itineraries" section.

**Storage Pattern (`src/data/cache/storageAdapter.ts`)**:

- `StorageAdapter { getItem(key), setItem(key, value), removeItem(key) }` — simple 3-method interface.
- `AsyncStorageAdapter` wraps `@react-native-async-storage/async-storage`.
- Reusable as-is for itinerary persistence.

**Models (`src/data/models/`)**:

- `Attraction { id, name, parkId, waitTime, status, type }` — no schedule/date context.
- `ParkSummary { id, name, city, country, latitude, longitude, photoUrl?, timezone?, address?, phone?, website? }`
- `ParkHours { opening, closing, timezone? }`
- `ParkWeather { temperature, condition, unit }`
- `UserProfile { id, username, email, avatarUrl?, memberSince }`
- `FavoritePark { parkId, parkName, addedAt }`
- **No `Itinerary`, `PlannedVisit`, or `ItineraryItem` model exists.**

**Packages**:

- No date-picker or calendar packages in `dependencies` or `devDependencies`.
- Has `expo-location` (for park discovery proximity), `react-native-maps`, `@react-native-async-storage/async-storage`.
- TanStack Query v5 with AsyncStorage persister already configured.

### Affected Areas

| File / Module                                    | Why Affected                                           |
| ------------------------------------------------ | ------------------------------------------------------ |
| `src/data/models/` (new `Itinerary.ts`)          | Need model for Itinerary + ItineraryItem               |
| `src/features/visit-planner/` (new)              | New feature folder for itinerary screens + hooks       |
| `src/features/favorites/useFavorites.ts`         | Pattern reference; may create `useItineraries` analog  |
| `src/data/cache/storageAdapter.ts`               | Reusable as-is for itinerary persistence               |
| `src/navigation/ParquesStackNavigator.tsx`       | Add VisitPlanner route(s) to the stack                 |
| `src/features/park-details/ParkDetailScreen.tsx` | Add "Plan a visit" button / entry point                |
| `src/features/park-details/AttractionList.tsx`   | Add "Add to itinerary" per attraction                  |
| `src/features/profile/ProfileScreen.tsx`         | Add "Itineraries" section showing saved plans          |
| `src/data/providers/ParkDiscoveryProvider.ts`    | MAY add `getAttractionsByIds()` for selective fetching |
| `src/data/providers/ThemeParksWikiProvider.ts`   | If provider method added, implement here               |
| `src/data/providers/fixtures.ts`                 | Add fixture itineraries for tests                      |
| `package.json`                                   | Add date-picker/calendar dependency                    |

### Approaches

#### Approach 1: Lightweight — Standalone Hook + New Screens

**Description**: Follow the `useFavorites` pattern exactly. Create a `useItineraries` hook using the same `StorageAdapter` + `useState` + `useEffect` pattern. Add `VisitPlannerScreen` and `ItineraryDetailScreen` to the existing stack. No provider changes.

- **Pros**:
  - Most consistent with existing code patterns
  - No new dependencies beyond a date-picker
  - `useItineraries` can slot alongside `useFavorites` with the same adapter
  - Testable the exact same way (in-memory adapter)
  - Minimal blast radius

- **Cons**:
  - No live wait-time refreshing on the itinerary detail screen (would need to re-fetch all park attractions)
  - Reordering needs a drag-and-drop library or manual move-up/move-down buttons
  - Date picker UX is basic (platform default)

- **Effort**: Medium (~3-4 days)
- **New deps**: `@react-native-community/datetimepicker`

#### Approach 2: Integrated — ParkDetail + Itinerary CTA with Live Data

**Description**: Everything in Approach 1, PLUS integration with `ParkDetailScreen`. Each attraction gets an "Add to itinerary" button. The itinerary detail screen re-fetches live wait times for planned attractions using `getParkAttractions(parkId)` and filtering client-side. Park detail shows a "Plan visit on [date]" CTA banner.

- **Pros**:
  - Richer UX — add attractions directly from park detail
  - Live wait times on the itinerary screen (TanStack Query handles caching)
  - Better discoverability of the feature
  - No provider interface change needed (filtering is client-side)

- **Cons**:
  - Heavier data fetching (always fetches all park attractions for live data)
  - More UI work: inline add-to-itinerary on each attraction row
  - Reorder still needs manual UX (move up/down buttons)

- **Effort**: Medium-High (~5-7 days)
- **New deps**: `@react-native-community/datetimepicker`

#### Approach 3: Provider-backed — Selective Attraction Fetching

**Description**: Add `getAttractionsByIds(ids: string[])` to `ParkDiscoveryProvider` interface and implement in `ThemeParksWikiProvider`. Store only attraction IDs in the itinerary. Fetch live data for only planned attractions. Use TanStack Query for live data on itinerary screen.

- **Pros**:
  - Bandwidth-efficient — only fetches planned attractions
  - Proper separation of concerns (data layer knows how to fetch specific attractions)
  - TanStack Query handles caching + refresh

- **Cons**:
  - Provider changes affect 2 implementations + tests
  - ThemeParksWiki API has no "get by IDs" endpoint — would fetch all park attractions and filter server-side... which is the same as client-side filtering
  - No real efficiency gain since the API doesn't support partial fetches
  - Over-engineered for MVP scope

- **Effort**: High (~7-10 days)
- **New deps**: `@react-native-community/datetimepicker` + maybe a reorder library

### Recommendation

**Approach 2 (Integrated)** is the right balance for an MVP. Here's the reasoning:

1. **Pattern consistency**: `useItineraries` mirrors `useFavorites` exactly — same `StorageAdapter`, same lifecycle, same test pattern. This keeps the codebase coherent.

2. **No provider bloat**: The ThemeParks.wiki API doesn't support partial attraction lookups, so adding `getAttractionsByIds` to the provider is misleading — it would still fetch all attractions and filter. Better to keep filtering in the feature layer.

3. **UX matters for MVP**: The "Plan a visit" CTA on ParkDetail and inline add-buttons on attractions make the feature discoverable. A standalone screen nobody finds is worse than no feature.

4. **Live wait times**: Re-fetching all park attractions for the itinerary is cheap (single API call, TanStack Query handles caching and stale-time). The attractions array for a park is typically 20-60 items.

5. **Reordering**: For MVP, use move-up/move-down buttons instead of drag-and-drop (avoids adding `react-native-draggable-flatlist` or similar). This can be upgraded later.

6. **Date picker**: `@react-native-community/datetimepicker` is the standard for Expo apps. Minimal footprint, works on Android.

**Recommended folder structure**:

```
src/features/visit-planner/
├── __tests__/
│   ├── useItineraries.test.ts
│   └── VisitPlannerScreen.test.tsx
├── ItineraryDetailScreen.tsx
├── VisitPlannerScreen.tsx
└── useItineraries.ts
```

### Risks

- **No calendar/date-picker package installed**: Adding `@react-native-community/datetimepicker` requires an Expo dev client build or EAS Build — it's not available in Expo Go (Go only supports Expo SDK packages). Need to verify if the project uses development builds or Expo Go.
- **No drag-and-drop**: Reordering with move-up/move-down buttons is acceptable for MVP but less intuitive. Users may expect drag-and-drop.
- **AsyncStorage size limits**: If a user creates many itineraries with many attractions, AsyncStorage (6MB limit on Android) could become a concern. For MVP with typical park visits (10-20 attractions per itinerary), this is fine.
- **Park hours not date-aware**: `ParkHours` only returns today's schedule via the API. If planning a future date, park hours for that specific date won't be available from the API. This is a known limitation — the itinerary may show "hours not available" for future dates.
- **Attraction data may change**: Wait times on the itinerary are snapshots of when they were added, not real-time unless re-fetched. The design needs to clarify: show cached wait time vs. fetch live on itinerary open.

### Ready for Proposal

**Yes** — the investigation is complete and the recommended approach is clear. The next phase should be `sdd-propose` to define scope, approach, and rollback plan.

Key decisions the proposal should address:

1. Whether to use `@react-native-community/datetimepicker` or a simpler text-input date entry
2. Reorder UX: move-up/move-down buttons vs. drag-and-drop
3. Live wait time refresh strategy on itinerary screen
4. Whether visit-planner lives in the Parques stack tab or gets its own tab
5. Date picker compatibility with Expo Go vs. dev builds
