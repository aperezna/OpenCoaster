# Tasks: Favorites Local Persistence

## Review Workload Forecast

| Field                   | Value       |
| ----------------------- | ----------- |
| Estimated changed lines | ~280–350    |
| 400-line budget risk    | Low         |
| Chained PRs recommended | No          |
| Suggested split         | Single PR   |
| Delivery strategy       | ask-on-risk |
| Chain strategy          | pending     |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal                          | Likely PR | Notes                               |
| ---- | ----------------------------- | --------- | ----------------------------------- |
| 1    | Full favorites implementation | PR 1      | Single PR; all phases merge to main |

## Phase 1: Foundation

- [x] 1.1 Install `@react-native-async-storage/async-storage` in `package.json`
- [x] 1.2 Create `src/data/models/FavoritePark.ts` — `parkId`, `parkName`, `addedAt` interface
- [x] 1.3 Create `src/data/cache/asyncStorageAdapter.ts` implementing `StorageAdapter` — wraps AsyncStorage `getItem`/`setItem`/`removeItem`, storage key `opencoaster:favorites`
- [x] 1.4 Write `src/data/cache/__tests__/asyncStorageAdapter.test.ts` — test getItem (found/missing), setItem, removeItem with mocked AsyncStorage

## Phase 2: Core Hook + Navigation

- [x] 2.1 Create `src/features/favorites/useFavorites.ts` — hook returns `{ favorites, isFavorite, toggleFavorite, isLoading }`; injectable `StorageAdapter` param; functional `setState` for toggles; `try/catch` error handling; loads on mount via `useEffect`
- [x] 2.2 Update `RootNavigator.tsx` — change `Parques` type from `{ parkId?: string }` to `NavigatorScreenParams<ParquesStackParamList> | undefined`; import from `@react-navigation/native`
- [x] 2.3 Update `ParquesStackNavigator.tsx` — remove `useRoute` tab-param bridge and `initialParams`; no longer needed with nested navigation
- [x] 2.4 Remove auto-nav `useEffect` and `hasAutoNavigated` ref from `ParksListScreen.tsx`
- [x] 2.5 Update `DiscoveryScreen.tsx` — change `navigation.navigate('Parques', { parkId })` to `navigation.navigate('Parques', { screen: 'ParkDetail', params: { parkId } })`

## Phase 3: UI Screens

- [x] 3.1 Add star toggle button to `ParkDetailScreen.tsx` — call `useFavorites()`; render filled/outline state based on `isFavorite(parkId)`; press calls `toggleFavorite(parkId, park.name)`
- [x] 3.2 Add favorites list to `ProfileScreen.tsx` — FlatList of `FavoritePark` entries; empty state "No favorites yet"; tap navigates via `navigation.navigate('Parques', { screen: 'ParkDetail', params: { parkId } })`

## Phase 4: Testing

- [x] 4.1 Write `src/features/favorites/__tests__/useFavorites.test.tsx` — in-memory adapter mock; scenarios: load empty, load populated, toggle on (adds+persists), toggle off (removes+persists), rapid toggles, error resilience
- [x] 4.2 Write `src/features/park-details/__tests__/ParkDetailScreen.test.tsx` (favorites) — mock `useFavorites`; test star toggle renders and toggles state
- [x] 4.3 Write `src/features/profile/__tests__/ProfileScreen.test.tsx` (favorites) — mock `useFavorites`; test favorites list, empty state, tap navigates

## Additional Testing Changes

- [x] 4.4 Update `src/features/parks-list/__tests__/ParksListScreen.test.tsx` — remove auto-nav tests
- [x] 4.5 Update `src/navigation/__tests__/ParquesStackNavigator.test.tsx` — remove auto-nav tests
- [x] 4.6 Run full suite: 19 suites, 105 tests, all passing
