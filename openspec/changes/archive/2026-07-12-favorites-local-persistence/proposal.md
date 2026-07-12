# Proposal: Favorites Local Persistence

## Intent

Let users save parks as favorites with local persistence, view them in the Profile tab, and toggle from park detail.

## Scope

### In Scope

1. Install `@react-native-async-storage/async-storage`
2. `AsyncStorageAdapter` implementing `StorageAdapter`
3. `FavoritePark` model (`parkId`, `parkName`, `addedAt`)
4. `useFavorites` hook (`favorites`, `isFavorite`, `toggleFavorite`, `isLoading`)
5. Favorite toggle button (star icon) on ParkDetailScreen
6. Favorites list in ProfileScreen
7. Tests for hook, adapter, and UI

### Out of Scope

- Favorite indicators in ParksListScreen (future)
- Cloud sync / cross-device favorites
- Favorites sorting/reordering
- Push notifications for favorites

## Capabilities

### New Capabilities

- `favorites-storage`: AsyncStorage adapter, FavoritePark model, and useFavorites hook — the full persistence layer for device-local favorites

### Modified Capabilities

None

## Approach

`useFavorites` hook backed by `StorageAdapter`. Install AsyncStorage → `AsyncStorageAdapter` wrapper. Hook loads from storage on mount via `useEffect`, saves on every toggle. Storage key: `opencoaster:favorites` containing a JSON array of `FavoritePark` objects. No React Context needed — the hook is self-contained with `useState` + `useEffect`.

## Affected Areas

| Area                                             | Impact   | Description                  |
| ------------------------------------------------ | -------- | ---------------------------- |
| `@react-native-async-storage/async-storage`      | New dep  | AsyncStorage package install |
| `src/data/cache/storageAdapter.ts`               | None     | Interface ready, no change   |
| `src/data/models/FavoritePark.ts`                | New      | FavoritePark type            |
| `src/features/favorites/AsyncStorageAdapter.ts`  | New      | Real StorageAdapter impl     |
| `src/features/favorites/useFavorites.ts`         | New      | Core hook                    |
| `src/features/favorites/__tests__/`              | New      | Test suite                   |
| `src/features/park-details/ParkDetailScreen.tsx` | Modified | Add favorite toggle          |
| `src/features/profile/ProfileScreen.tsx`         | Modified | Add favorites list           |

## Risks

| Risk                                 | Likelihood | Mitigation                             |
| ------------------------------------ | ---------- | -------------------------------------- |
| AsyncStorage unavailable (SSR/error) | Low        | Catch in hook, fallback to empty array |
| Favorites lost on data clear         | Low        | Expected — local-only by design        |
| Loading flash on hydrate             | Med        | Show spinner while read resolves       |

## Rollback Plan

`npm uninstall @react-native-async-storage/async-storage`, delete new files (`AsyncStorageAdapter.ts`, `FavoritePark.ts`, `useFavorites.ts`, test files), revert ParkDetailScreen and ProfileScreen diffs.

## Dependencies

- `@react-native-async-storage/async-storage`

## Success Criteria

- [ ] `useFavorites` loads persisted favorites on mount
- [ ] `toggleFavorite` adds/removes a park and persists to AsyncStorage
- [ ] ProfileScreen lists saved favorites
- [ ] ParkDetailScreen shows star toggle reflecting current state
- [ ] All new tests pass
