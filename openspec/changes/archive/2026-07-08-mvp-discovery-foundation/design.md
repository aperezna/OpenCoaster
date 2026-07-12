# Design: MVP Discovery Foundation

## Technical Approach

Greenfield Expo + React Native + TypeScript bootstrap with discovery-first architecture. A single `DiscoveryScreen` hosts both map view and search input. `ParkDiscoveryProvider` interface normalizes fixture data into `ParkSummary` models. Geolocation abstracted behind `LocationService` interface for testability. TanStack Query provides in-memory caching with `StorageAdapter` types for future persistence. Navigation via `@react-navigation/native-stack` with two routes.

## Architecture Decisions

| Option                                              | Tradeoff                                                                | Decision                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Single DiscoveryScreen vs. separate screens         | Separate adds nav complexity; single works for MVP scope                | **Single DiscoveryScreen** — map + search collocated                          |
| Geolocation as hook vs. service interface           | Hook is tight to RN; interface enables pure TS test doubles for Windows | **LocationService interface** — `getCurrentPosition()`, `requestPermission()` |
| Flat provider interface vs. discriminated by source | Flat is simpler; discriminated needed later for multi-provider          | **Flat `searchParks(query)`** — keeps first slice simple                      |
| `@react-navigation/native-stack` vs. expo-router    | expo-router adds file-convention overhead; native-stack is explicit     | **Native stack navigator** — explicit route config, no file convention        |
| persistQueryClient now vs. deferred                 | Needs AsyncStorage dep; fixture data doesn't need persistence yet       | **StorageAdapter types declared, wiring deferred**                            |
| OSM tile rendering (no API key) vs. Google Maps     | OSM needs tile URL but no key; Google requires billing                  | **react-native-maps OSM via `urlTileTemplate`** — no API key                  |

## Data Flow

```
DiscoveryScreen
  ├── LocationService.getCurrentPosition()
  │       ├── granted → Coords → MapView marker + center
  │       ├── denied  → no marker, search focused
  │       └── error   → no marker, search focused
  │
  └── SearchBar (name + city)
        └── useSearchParks(query) ──→ ParkDiscoveryProvider.searchParks(q)
                                            │
                                       [fixture data]
                                            │
                                       ParkSummary[] → ParkResultList
                                            │
                                       tap → navigate('ParkDetail', { parkId })
```

Provider boundary isolates consumers from data source:

```
Screen/hook → ParkDiscoveryProvider (interface)
                  ├── FixtureParkDiscoveryProvider  ← current
                  ├── ThemeParksWikiProvider (future)
                  └── QueueTimesProvider (future)
```

## Navigation / Routes

| Route         | Component        | Params               | Notes                                  |
| ------------- | ---------------- | -------------------- | -------------------------------------- |
| `Discovery`   | DiscoveryScreen  | none                 | Initial route. Map + search.           |
| `ParkDetail`  | ParkDetailScreen | `{ parkId: string }` | Placeholder. Reads park from provider. |
| `*` (unknown) | FallbackView     | —                    | Shows "Screen not found" — no crash.   |

## File / Folder Structure

```
app/
├── App.tsx                              ← QueryClientProvider + NavigationContainer
├── src/
│   ├── navigation/
│   │   └── RootNavigator.tsx            ← Stack: Discovery, ParkDetail, Fallback
│   ├── features/
│   │   ├── discovery/
│   │   │   ├── DiscoveryScreen.tsx       ← Map + SearchBar composition
│   │   │   ├── SearchBar.tsx            ← Name + city inputs
│   │   │   ├── ParkResultList.tsx       ← FlatList, tappable items
│   │   │   └── useSearchParks.ts        ← useQuery hook
│   │   └── park-details/
│   │       └── ParkDetailScreen.tsx     ← Placeholder: name, city, photo
│   ├── data/
│   │   ├── models/
│   │   │   └── ParkSummary.ts           ← Type def
│   │   ├── providers/
│   │   │   ├── ParkDiscoveryProvider.ts ← Interface + FixtureProvider
│   │   │   └── fixtures.ts             ← 3+ parks (≥1 US, ≥1 EU)
│   │   ├── cache/
│   │   │   ├── queryClient.ts          ← QueryClient, staleTime 30s, retry 1
│   │   │   └── storageAdapter.ts       ← StorageAdapter type
│   │   └── location/
│   │       ├── LocationService.ts       ← Interface + PermissionStatus
│   │       ├── ExpoLocationService.ts   ← expo-location wrapper
│   │       └── __tests__/
│   │           └── FakeLocationService.ts  ← Test double
│   └── config/
│       └── constants.ts                ← Default region, cache TTLs
__tests__/
├── providers/
│   └── ParkDiscoveryProvider.test.ts
└── search/
    └── useSearchParks.test.ts
```

## Interfaces / Contracts

```typescript
// --- Models ---
export interface ParkSummary {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  photoUrl?: string;
  timezone?: string;
}

// --- Provider ---
export interface ParkSearchQuery {
  name?: string;
  city?: string;
}
export interface ParkDiscoveryProvider {
  searchParks(query: ParkSearchQuery): Promise<ParkSummary[]>;
}

// --- Location ---
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';
export interface Coords {
  latitude: number;
  longitude: number;
}
export interface LocationService {
  requestPermission(): Promise<PermissionStatus>;
  getCurrentPosition(): Promise<Coords | null>;
}

// --- Cache ---
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```

## Cache Strategy

- **QueryClient**: `staleTime: 30_000`, `retry: 1`, `defaultQueryOptions`
- **Key namespace**: `["opencoaster", ...rest]` — all query keys start with `"opencoaster"`
- **StorageAdapter**: interface declared with type exports. AsyncStorage integration deferred — fixture data needs no persistence layer in this slice
- **TTL**: `staleTime` only; `gcTime` (cacheTime) uses default. Explicit `fetchedAt` metadata deferred to detail slice

## Geolocation Abstraction

`LocationService` interface decouples consumers from `expo-location`:

| Implementation        | Context    | Behavior                                          |
| --------------------- | ---------- | ------------------------------------------------- |
| `ExpoLocationService` | Production | Wraps `expo-location` native calls                |
| `FakeLocationService` | Tests      | Returns controlled Coords; simulates denial/error |

The `DiscoveryScreen` receives `LocationService` as a dependency (props or context). Tests inject `FakeLocationService` without any native module dependency. This is critical because Windows shell cannot run `expo-location`.

## OSM Map Integration

`react-native-maps` renders OpenStreetMap via:

```typescript
<MapView
  urlTileTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
  initialRegion={DEFAULT_REGION}
/>
```

No Google Maps API key required. Attribution handled per OSM tile usage policy.

## Testing Strategy

| Layer       | What                                         | Approach                                                    |
| ----------- | -------------------------------------------- | ----------------------------------------------------------- |
| Unit        | `FixtureParkDiscoveryProvider.searchParks()` | Pure TS — test name match, name+city match, empty, no-match |
| Unit        | `FakeLocationService`                        | All 3 permission outcomes + position return                 |
| Unit        | `useSearchParks` (hook)                      | `@testing-library/react-hooks` with QueryClient wrapper     |
| Unit        | Cache config                                 | Verify staleTime, retry, key namespace                      |
| Integration | `DiscoveryScreen`                            | render with mock provider + mock location service           |

## Migration / Rollout

No migration required — greenfield project. Delete `app/` and `__tests__/` to roll back.

## Review Budget Note

Estimated ~700–900 lines for initial implementation (App.tsx, nav, 2 screens, provider, fixtures, cache, location interface, tests). The 800-line review budget from config is at risk — recommend chained PRs or explicit size exception if this exceeds budget.

## Open Questions

- [ ] Confirm OSM tile URL and attribution text with product/legal
- [ ] Decide LocationService injection mechanism: React Context vs. prop-drilled vs. module-level default
- [ ] Validate 800-line budget tolerance — may need chained PRs
