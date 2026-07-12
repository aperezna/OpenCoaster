# Favorites Storage Specification

## Purpose

Persistence layer for user-favorited parks using `StorageAdapter`. Provides a `useFavorites` hook that loads and persists `FavoritePark` entries.

## Requirements

### Requirement: FavoritePark Model

`FavoritePark` MUST expose `parkId: string`, `parkName: string`, and `addedAt: string` (ISO 8601 date). Storage key MUST be `opencoaster:favorites`.

### Requirement: useFavorites Hook

The system MUST provide a `useFavorites` hook returning `{ favorites: FavoritePark[], isFavorite(parkId): boolean, toggleFavorite(parkId): void, isLoading: boolean }`.

The hook MUST load favorites from `StorageAdapter.getItem` on mount. On every `toggleFavorite` call, the hook MUST persist the updated list via `StorageAdapter.setItem`.

The hook SHOULD return an empty array when no data is stored for the key.

The hook MUST function with any `StorageAdapter` implementation, including an in-memory adapter in tests.

#### Scenario: Toggle on adds and persists

- GIVEN no `FavoritePark` exists for a park ID
- WHEN `toggleFavorite(parkId)` is called with a `parkName`
- THEN the park is added to `favorites` with current `addedAt`
- AND `StorageAdapter.setItem` is called with the updated JSON array

#### Scenario: Toggle off removes and persists

- GIVEN a `FavoritePark` exists for the park ID
- WHEN `toggleFavorite(parkId)` is called
- THEN the park is removed from `favorites`
- AND `StorageAdapter.setItem` is called with the updated array

#### Scenario: Empty storage on mount

- GIVEN no data is stored under `opencoaster:favorites`
- WHEN `useFavorites` mounts
- THEN `favorites` is `[]` and `isLoading` is `false`

#### Scenario: Multiple favorites survive re-mount

- GIVEN three parks were toggled on in a previous session
- WHEN `useFavorites` mounts again
- THEN `favorites.length` is 3 and all `parkId` values match the toggled parks
