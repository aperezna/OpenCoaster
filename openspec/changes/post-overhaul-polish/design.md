# Design: Post-Overhaul Polish

## Technical Approach

Four independent improvements on the existing codebase: (1) class-based ErrorBoundary wrapping the app render tree with Sentry capture, (2) expo-splash-screen init that blocks until critical providers are ready, (3) city/country filter fields in the search screen + client-side filtering in the provider layer, and (4) fixing "not wrapped in act()" by wrapping state-mutating calls in `act()` or using async queries properly.

## Architecture Decisions

| Option                                                        | Tradeoff                                                                                                                                                         | Decision                                                                   |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `Sentry.wrap()` vs. custom class ErrorBoundary                | Sentry.wrap() is already present; but it wraps the top module, not the render tree. A class boundary inside `AppInner` catches render errors with a fallback UI. | Custom `ErrorBoundary` inside `AppRoot`, calling `Sentry.captureException` |
| SearchBar component vs. inline inputs                         | SearchBar is used only by DiscoveryScreen (map). ParksListScreen uses its own inline input. Extending SearchBar would couple unrelated screens.                  | Add city/country inputs directly in `ParksListScreen`                      |
| Splash `preventAutoHideAsync` location                        | Must run before any React rendering. `App.tsx` module scope is too early (no `SplashScreen` import yet).                                                         | Call at the top of `AppInner` body, hide in a `useEffect` after readiness  |
| Filter in `useSearchParks` vs. `FixtureParkDiscoveryProvider` | Provider is the correct layer — `ThemeParksWikiProvider` already receives search query from API.                                                                 | Extend `ParkSearchQuery` interface + filter logic in `searchParks`         |

## Data Flow

```
App.tsx
│
├─ SplashScreen.preventAutoHideAsync()
│
├─ ErrorBoundary                         ← catches render crashes
│   └─ PersistQueryClientProvider
│       └─ ParkDiscoveryContextProvider
│           └─ ThemeProvider
│               └─ NavigationContainer
│                   └─ RootNavigator
│                       └─ ParksListScreen
│                           ├─ nameInput → debounce → { name, city?, country? }
│                           └─ useSearchParks({ name, city, country }, provider)
│                                 │
│                                 └─ FixtureParkDiscoveryProvider.searchParks()
│                                       filters by name + city + country (client-side)
│
└─ useEffect(() => { SplashScreen.hideAsync(); }, [ready])
```

## File Changes

| File                                                         | Action   | Description                                                                                                          |
| ------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/components/ErrorBoundary.tsx`                           | Create   | Class component with `componentDidCatch` → `Sentry.captureException` + fallback UI                                   |
| `App.tsx`                                                    | Modify   | Import `ErrorBoundary`, wrap `AppInner`; import `SplashScreen`, call `preventAutoHideAsync`, `hideAsync` after ready |
| `src/data/providers/ParkDiscoveryProvider.ts`                | Modify   | Add `city` and `country` to `ParkSearchQuery` interface                                                              |
| `src/data/providers/ParkDiscoveryProvider.ts`                | Modify   | Add client-side city+country filter logic in `FixtureParkDiscoveryProvider.searchParks()`                            |
| `src/features/parks-list/ParksListScreen.tsx`                | Modify   | Add city/country `TextInput` fields, wire through debounced state, extend query to `{ name, city, country }`         |
| `src/features/parks-list/__tests__/ParksListScreen.test.tsx` | Modify   | Wrap `fireEvent.changeText` in `act()`, fix timer patterns                                                           |
| `src/features/discovery/__tests__/SearchBar.test.tsx`        | Modify   | Remove `await render()` (no-op but triggers act warning)                                                             |
| `src/features/discovery/__tests__/useSearchParks.test.tsx`   | Modify   | Same — fix `render()` calls without async                                                                            |
| `src/features/discovery/__tests__/ParksListScreen.test.tsx`  | Possibly | Fix act warnings if present                                                                                          |

## Interfaces / Contracts

```typescript
// Modified interface
export interface ParkSearchQuery {
  name?: string;
  city?: string;
  country?: string;
  proximity?: { latitude: number; longitude: number; radiusKm: number };
}
```

## Testing Strategy

| Layer       | What to Test                                                | Approach                                                                           |
| ----------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Unit        | ErrorBoundary catches error, calls Sentry, renders fallback | Render with child that throws, assert fallback visible + `captureException` called |
| Unit        | SplashScreen.preventAutoHideAsync called on mount           | Mock expo-splash-screen, assert prevent called                                     |
| Integration | Search filters by city AND country                          | Extend `useSearchParks.test.tsx` with city/country queries                         |
| Fix         | Zero "not wrapped in act()" in `npx jest` output            | Run full suite after fix, grep for "not wrapped in act()"                          |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Each item is independently revertible.

## Open Questions

- [ ] Should `ErrorBoundary` use `Sentry.wrap` (already on AppRoot) OR replace it? The spec says "MUST wrap app root in Sentry.wrap()" which is already done. Adding an inner ErrorBoundary is additive.
- [ ] Does `expo-splash-screen` need a package install in Expo SDK 52? It may be auto-provided; verify during apply.
