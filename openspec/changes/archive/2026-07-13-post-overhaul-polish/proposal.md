# Proposal: Post-Overhaul Polish

## Intent

Polish quality gaps from the MVP foundation: component crashes kill the whole app (no error boundaries), white flash on cold start (splash not configured), search only filters by name (missing city/country), and "not wrapped in act()" test warnings degrade CI signal.

## Scope

### In Scope

- React error boundaries wrapping the app root with Sentry exception capture
- Native splash screen via `expo-splash-screen` (visible until app is ready)
- City and country search/filter on the search screen
- Clean up "not wrapped in act()" warnings from React Testing Library

### Out of Scope

- Offline-first search indexing
- Animated splash transitions
- Search autocomplete or suggestions
- Region/spot-level filtering
- Test coverage increases (warning cleanup only)

## Capabilities

### New Capabilities

- `splash-screen`: native splash screen configuration — stay visible until app ready, prevent white flash on cold start

### Modified Capabilities

- `sentry-crash-reporting`: add error boundary requirement — Sentry MUST capture React render errors via boundary wrapping the app root
- `search-park`: add country filter field; the system MUST filter by country and MAY combine city + country + name filters

## Approach

1. **Error Boundaries**: Class-based `ErrorBoundary` component calling `Sentry.captureException`. Wrap app root. No new deps.
2. **Splash Screen**: Use `expo-splash-screen` — `preventAutoHideAsync` at init + `hideAsync` after app ready (Sentry, query client, fonts). Configure in bootstrap layer.
3. **Search city/country**: Add filter UI, extend `useSearchParks` to accept city/country params, filter client-side from existing data.
4. **Test warnings**: Use `waitFor`/`findBy*` async utils or explicit `act()` wrappers from Testing Library.

## Affected Areas

| Area                               | Impact   | Description                                |
| ---------------------------------- | -------- | ------------------------------------------ |
| `src/components/ErrorBoundary.tsx` | New      | Error boundary with Sentry integration     |
| `src/App.tsx`                      | Modified | Wrap root in boundary + splash screen init |
| `src/screens/SearchScreen.tsx`     | Modified | Add city/country filter fields             |
| `src/data/useSearchParks.ts`       | Modified | Accept city/country query params           |
| `src/**/*.test.tsx`                | Modified | Fix act() warnings                         |

## Risks

| Risk                                | Likelihood | Mitigation                                             |
| ----------------------------------- | ---------- | ------------------------------------------------------ |
| Splash delays perceived launch time | Medium     | Only block on critical init (Sentry, query client)     |
| Error boundary hides real bugs      | Low        | Always report to Sentry, show user-facing fallback     |
| Country adds API query complexity   | Low        | Filter client-side — city/country fields exist in data |

## Rollback Plan

Each item is independently revertible: remove `ErrorBoundary` wrapper, revert splash config to auto-hide, revert search filter UI fields and hook params, revert test wrapper changes.

## Dependencies

- `expo-splash-screen` (already present as Expo managed dep)

## Success Criteria

- [ ] Error boundary catches a thrown React error and renders fallback UI without crashing the app
- [ ] No white flash on cold start — splash stays visible until app is ready, then hides cleanly
- [ ] Search by city and country returns matching filtered results
- [ ] Zero "not wrapped in act()" warnings in `npx jest` output
