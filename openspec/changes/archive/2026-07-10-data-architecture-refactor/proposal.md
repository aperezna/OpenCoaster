# Proposal: Data Architecture Refactor

## Intent

Two connected improvements: (1) unify all park data fetching under React Query for caching, deduplication, retry, and refetch; (2) eliminate direct `ThemeParksWikiProvider` instantiation in screens by providing it through React Context. Pure refactor — app behavior unchanged.

## Scope

### In Scope
- React Query hooks for `getParkById`, `getParkWeather`, `getParkHours`, `getParkAttractions`
- `ParkDiscoveryProviderContext` (React Context + provider component + consumer hook)
- Wire provider context into `App.tsx` (alongside existing `QueryClientProvider`)
- Update `ParkDetailScreen` → React Query hooks + context consumption
- Update `DiscoveryScreen` → context consumption (already uses `useSearchParks`)
- Update `ProfileScreen` → context consumption
- `FixtureParkDiscoveryProvider` already exists — ensure test-wrappable via context

### Out of Scope
- New data operations or API endpoints
- Runtime provider switching / multi-provider support
- Cache persistence tuning or offline indicators
- LocationService injection (stays as prop for now)

## Capabilities

### New Capabilities
None — pure refactor, no spec-level behavior changes.

### Modified Capabilities
None — existing specs cover the same behavior.

## Approach

**Track 1 (React Query hooks):** Create `useParkById`, `useParkWeather`, `useParkHours`, `useParkAttractions` under `src/features/park-details/` following the same pattern as `useSearchParks`. Each hook takes a `parkId` and `ParkDiscoveryProvider`, uses `useQuery` with appropriate key prefix and `queryFn`. `ParkDetailScreen` replaces its `useState`+`useEffect` block with these hooks.

**Track 2 (Provider Context):** Create `ParkDiscoveryProviderContext.tsx` in `src/data/providers/` exporting a `ParkDiscoveryContextProvider` (defaults to `ThemeParksWikiProvider`) and a `useParkDiscoveryProvider()` hook. Wire the context provider in `App.tsx` above `RootNavigator`. Update all three screens to call `useParkDiscoveryProvider()` instead of `new ThemeParksWikiProvider()`. Keep the optional prop override on hooks for test injection.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/park-details/` | Modified + New | `ParkDetailScreen.tsx` refactored; new hooks (`usePark*`) |
| `src/features/discovery/DiscoveryScreen.tsx` | Modified | Remove direct `ThemeParksWikiProvider` instantiation |
| `src/features/profile/ProfileScreen.tsx` | Modified | Remove direct `ThemeParksWikiProvider` instantiation |
| `src/data/providers/` | New | `ParkDiscoveryProviderContext.tsx` |
| `App.tsx` | Modified | Add `ParkDiscoveryContextProvider` wrapper |
| `src/navigation/RootNavigator.tsx` | Unchanged | Screens now get provider from context internally |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing tests mock provider via prop — context change breaks them | Low | Keep optional prop override in hooks; test both paths |
| `useParkDetail` fetches 4 queries independently — waterfall | Med | Use `useQueries` for parallel fetch, same behavior as current `Promise.all` |

## Rollback Plan

Remove new hooks and `ParkDiscoveryProviderContext`. Restore direct `new ThemeParksWikiProvider()` defaults in all three screens. Revert `App.tsx`. No data migration.

## Dependencies

- `@tanstack/react-query` (already installed)
- None external — pure internal refactor

## Success Criteria

- [ ] All existing Jest tests pass without modification
- [ ] `ParkDetailScreen` shows loading/error/data states via React Query
- [ ] `npx tsc --noEmit` passes with no new type errors
- [ ] `DiscoveryScreen`, `ParkDetailScreen`, `ProfileScreen` consume provider from context
- [ ] Test wrapper can inject `FixtureParkDiscoveryProvider` via context
