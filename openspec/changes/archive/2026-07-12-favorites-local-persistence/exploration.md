## Exploration: favorites-local-persistence

### Current State

The app has no favorites system. `@react-native-async-storage/async-storage` is NOT installed — only the `StorageAdapter` interface (`getItem`/`setItem`/`removeItem`) exists in `src/data/cache/storageAdapter.ts` with test-only in-memory implementations. The `StorageAdapter` was designed for offline persistence but never backed by a real driver.

The `UserProfile` model (`id`, `username`, `email`, `avatarUrl`, `memberSince`) has no favorites field. `ProfileScreen` shows avatar/username/email/memberSince/logout — no favorites list. `ParkDetailScreen` has no favorite toggle. `ParksListScreen`/`ParkResultList` has no favorite indicators.

The app uses React Query for server-state (parks, weather, hours, attractions) via `useParkDetail` and `useSearchParks` hooks. All data flows through `ParkDiscoveryProvider` interface + React Context.

### Affected Areas

- **NEW** — `@react-native-async-storage/async-storage` package install (dependency to add)
- `src/data/cache/storageAdapter.ts` — `StorageAdapter` interface (already ready, needs no change)
- `src/data/models/UserProfile.ts` — will NOT be modified (favorites are local-only, not server profile)
- **NEW** — `src/data/models/FavoritePark.ts` — model for persisted favorite data
- **NEW** — `src/features/favorites/useFavorites.ts` — custom hook wrapping StorageAdapter
- **NEW** — `src/features/favorites/AsyncStorageAdapter.ts` — real StorageAdapter implementation
- **NEW** — `src/features/favorites/__tests__/useFavorites.test.ts` — tests for the hook
- `src/features/profile/ProfileScreen.tsx` — add favorites list section
- `src/features/park-details/ParkDetailScreen.tsx` — add favorite toggle (star icon)
- `src/features/parks-list/ParksListScreen.tsx` — optionally pass favorite state to ParkResultList
- `src/features/discovery/ParkResultList.tsx` — optionally show favorite indicators
- `src/navigation/RootNavigator.tsx` — no change needed (favorites live inside existing tabs)

### Approaches

1. **Simple hook + AsyncStorage (recommended)**
   Create a `useFavorites` custom hook that reads/writes a JSON array of park IDs (or serialized favorite entries) via AsyncStorage through the `StorageAdapter` interface. Exposes `favorites`, `isFavorite(id)`, `toggleFavorite(id)`, `addFavorite(park)`, `removeFavorite(id)`.
   - Pros: Follows existing StorageAdapter pattern; dead simple — < 80 lines of hook code; no React Query overhead for local-only state; easy to test with fixture StorageAdapter; keeps favorites separate from server profile model
   - Cons: Manual JSON serialization (trivial for a string[]); doesn't auto-sync across tabs (but React Query also wouldn't without extra wiring)
   - Effort: Low

2. **React Query + persisted favorites**
   Store favorites as a React Query cache entry using `persistQueryClient` + the StorageAdapter, treating favorites as another query. Create `useFavoritesQuery` that follows the same pattern as `useParkDetail`.
   - Pros: Consistent with existing data access patterns; cache invalidation built-in; query key namespacing already established
   - Cons: React Query is designed for server-state, not local preferences — adds complexity for no gain; favorites don't need staleTime/retry/refetch; `persistQueryClient` isn't set up yet; adds a whole extra concern to the cache layer
   - Effort: Medium

3. **Extend UserProfile model + provider**
   Add `favoriteParkIds: string[]` to `UserProfile`, persist through provider interface. Provider would merge AsyncStorage-based favorites with provider-sourced profile.
   - Pros: Single source of truth for user data
   - Cons: UserProfile comes from the provider (server); mixing local-only state with server data is an architectural smell; forces provider changes for purely local behavior; breaks fixture simplicity
   - Effort: Medium

### Recommendation

**Approach 1: Simple hook + AsyncStorage**. The `StorageAdapter` interface was intentionally designed for this kind of local persistence. A `useFavorites` hook wrapping it is the most straightforward path:

- Install `@react-native-async-storage/async-storage`
- Write `AsyncStorageAdapter` implementing `StorageAdapter` (trivial — one method per AsyncStorage call)
- Define a `FavoritePark` model: `{ parkId: string, parkName: string, addedAt: string }` — caching the park name enables offline display in profile without provider calls
- Write `useFavorites` hook using `StorageAdapter` with key `'opencoaster:favorites'` — stores a JSON array of `FavoritePark` objects
- ProfileScreen reads favorites from the hook, renders a list
- ParkDetailScreen uses `isFavorite`/`toggleFavorite` from the hook
- ParkResultList optionally receives `favoriteIds: Set<string>` to show star indicators
- Tests use a fixture `StorageAdapter` (already exists in `storageAdapter.test.ts`)

### Risks

- AsyncStorage is async — brief loading state needed while favorites hydrate on app start
- If user clears app data, favorites are lost (expected for local-only storage; could add backup/export later)
- ParkDetailScreen needs to receive or access the hook — if it's deep in navigation, might need to lift state or keep hook self-contained (React state inside the hook handles this via useState + useEffect)
- No cross-tab/window sync (irrelevant for mobile, negligible risk)

### Ready for Proposal

Yes. The orchestrator can proceed to sdd-propose with a clear scope: install AsyncStorage, create AsyncStorageAdapter + FavoritePark model + useFavorites hook, add toggle to ParkDetailScreen, add list to ProfileScreen, optionally add indicators to ParksListScreen.
