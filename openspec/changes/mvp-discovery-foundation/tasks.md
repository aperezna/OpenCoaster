# Tasks: MVP Discovery Foundation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~800–1000 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR1: Data + Cache + Location → PR2: App shell + Navigation + Features |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation: types, data layer, cache, location, fixtures + tests | PR 1 | Pure TS, testable without native deps. Base: main. |
| 2 | App shell: nav, screens, map, search, detail + tests | PR 2 | Depends on PR 1 types/providers. Base: main. |

## Phase 1: Types & Config Foundation

- [x] 1.1 `src/data/models/ParkSummary.ts` — typed interface with required + optional fields — `park-discovery-provider` R1/S1-2
- [x] 1.2 `src/config/constants.ts` — DEFAULT_REGION, staleTime 30s, cache TTLs — `cache-foundation` R1, `map-discovery` R1/S2
- [x] 1.3 RED→GREEN→REFACTOR: test ParkSummary shape, defaults, and constant values

## Phase 2: Cache Layer

- [x] 2.1 `src/data/cache/queryClient.ts` — QueryClient with staleTime=30s, retry=1, `["opencoaster"]` prefix — `cache-foundation` R1/S1-2, R3/S5
- [x] 2.2 `src/data/cache/storageAdapter.ts` — StorageAdapter interface (getItem, setItem, removeItem) — `cache-foundation` R2/S3-4
- [x] 2.3 RED→GREEN→REFACTOR: test staleTime, retry behavior, key namespace, StorageAdapter shape

## Phase 3: Data Layer — Provider & Fixtures

- [x] 3.1 `src/data/providers/fixtures.ts` — 3+ parks (≥1 US, ≥1 EU) with all required ParkSummary fields — `park-discovery-provider` R3/S5
- [x] 3.2 `src/data/providers/ParkDiscoveryProvider.ts` — ParkDiscoveryProvider interface + FixtureParkDiscoveryProvider.searchParks() — `park-discovery-provider` R2/S3-5
- [x] 3.3 RED→GREEN→REFACTOR: searchParks by name, by name+city, empty query returns all, no-match returns empty

## Phase 4: Location Service

- [x] 4.1 `src/data/location/LocationService.ts` — PermissionStatus, Coords, LocationService interface — `map-discovery` R2/S3-6
- [x] 4.2 `src/data/location/ExpoLocationService.ts` — wraps expo-location (requestPermission, getCurrentPosition) — `map-discovery` R2/S3-6
- [x] 4.3 `src/data/location/__tests__/FakeLocationService.ts` — test double: granted/denied/error outcomes — `map-discovery` R2/S3-6

## Phase 5: Navigation Shell

- [x] 5.1 `src/navigation/RootNavigator.tsx` — Stack(Discovery→initial, ParkDetail, Fallback) — `app-bootstrap` R2/S3-4
- [x] 5.2 RED→GREEN→REFACTOR: nav mounts both screens, unknown route renders fallback

## Phase 6: App Bootstrap

- [x] 6.1 `app/App.tsx` — QueryClientProvider + NavigationContainer + RootNavigator — `app-bootstrap` R1/S1-2, R3/S5
- [x] 6.2 RED→GREEN→REFACTOR: App renders without crash, TS compilation passes, query client available to screens

## Phase 7: Discovery Feature

- [x] 7.1 `src/features/discovery/SearchBar.tsx` — name+city inputs with onChange — `search-park` R1/S1-3
- [x] 7.2 `src/features/discovery/ParkResultList.tsx` — FlatList with tappable items + "No parks found" empty state — `search-park` R2/S4-5
- [x] 7.3 `src/features/discovery/useSearchParks.ts` — useQuery hook calling ParkDiscoveryProvider.searchParks() — `search-park` R1-2/S2-3, `cache-foundation` R3/S5
- [x] 7.4 `src/features/discovery/DiscoveryScreen.tsx` — composes MapView (OSM tiles) + location handling + SearchBar + ParkResultList — `map-discovery` R1-2 all scenarios, `search-park` R1-2
- [x] 7.5 RED→GREEN→REFACTOR: SearchBar input behavior, ParkResultList render+empty, useSearchParks hook with mock provider, DiscoveryScreen integration

## Phase 8: Park Detail Feature

- [ ] 8.1 `src/features/park-details/ParkDetailScreen.tsx` — placeholder with name, city, photo (or fallback) — `search-park` R3/S6-7
- [ ] 8.2 RED→GREEN→REFACTOR: detail shows park info, missing photo shows placeholder, nav from result list opens detail

## Design Coverage

| Design Section | Status | Phases |
|----------------|--------|--------|
| ParkSummary model | ✅ Covered | P1 |
| Cache strategy (staleTime, retry, namespace) | ✅ Covered | P2 |
| StorageAdapter type | ✅ Covered | P2 |
| ParkDiscoveryProvider + FixtureProvider | ✅ Covered | P3 |
| Fixture data (3 parks, US+EU) | ✅ Covered | P3 |
| LocationService interface + ExpoLocationService | ✅ Covered | P4 |
| FakeLocationService test double | ✅ Covered | P4 |
| RootNavigator (3 routes) | ⏳ PR 2 | P5 |
| App.tsx (QueryClientProvider + NavigationContainer) | ⏳ PR 2 | P6 |
| DiscoveryScreen (map + search composition) | ⏳ PR 2 | P7 |
| SearchBar (name + city) | ⏳ PR 2 | P7 |
| ParkResultList (+ empty state) | ⏳ PR 2 | P7 |
| useSearchParks hook | ⏳ PR 2 | P7 |
| ParkDetailScreen placeholder | ⏳ PR 2 | P8 |
