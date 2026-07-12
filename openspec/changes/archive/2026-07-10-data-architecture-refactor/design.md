# Design: Data Architecture Refactor

## Technical Approach

Two-track refactor: (1) create React Query hooks for all park data queries following the existing `useSearchParks` pattern with `useQueries` for parallel fetching; (2) introduce `ParkDiscoveryContext` to provide the provider instance throughout the component tree, eliminating `new ThemeParksWikiProvider()` in screens. Production code wraps in `App.tsx`; tests inject `FixtureParkDiscoveryProvider` via context wrapper — no prop-based injection needed.

## Architecture Decisions

### Decision: Hook Composition for Park Detail

| Option                                   | Tradeoff                                                        | Decision                                                                    |
| ---------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 4 individual hooks (`useParkById`, etc.) | More granular, reusable                                         | ✅ Single composite `useParkDetail` hook with `useQueries` (parallel fetch) |
| Single composite `useParkDetail`         | One import, mirrors current `Promise.all`, dedup via query keys |                                                                             |

**Rationale**: Current `ParkDetailScreen` fetches all 4 data points in parallel via `Promise.all`. `@tanstack/react-query`'s `useQueries` mirrors this exactly — parallel execution, independent loading states, built-in deduplication. Individual queries (park, weather, hours, attractions) each get their own query key so they cache independently. The composite hook matches the screen's single responsibility: "show me everything about this park."

### Decision: Context Hook Strictness

| Option                  | Tradeoff                                             | Decision                                                                            |
| ----------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Throw if no context     | Forces intentional wrapping everywhere               | ✅ `useParkDiscoveryProvider()` returns `ParkDiscoveryProvider` (throws if missing) |
| Return null             | Silent default, leaks `new ThemeParksWikiProvider()` |                                                                                     |
| Return fallback default | Defeats the purpose of the refactor                  |                                                                                     |

**Rationale**: `App.tsx` always wraps the tree, so production never hits the throw. Tests use `ParkDiscoveryContextProvider` wrapper to inject `FixtureParkDiscoveryProvider`. This eliminates the accidental `new ThemeParksWikiProvider()` default path entirely.

### Decision: Remove Provider Prop from Screens

| Option                            | Tradeoff                                  | Decision                          |
| --------------------------------- | ----------------------------------------- | --------------------------------- |
| Keep `parkDiscoveryProvider` prop | Dead code path, dual interface            | ✅ Remove prop from all 3 screens |
| Remove prop, context-only         | Clean contract, tests use context wrapper |                                   |

**Rationale**: The proposal explicitly requires FixtureProvider to be usable via context wrapper. Removing the prop forces consistent context consumption and removes the dead default-instantiation path. Hooks still accept `provider` as a direct parameter (following `useSearchParks` pattern), enabling direct test injection at the hook level if needed.

## Data Flow

```
App.tsx
  ├─ QueryClientProvider
  │  └─ ParkDiscoveryContextProvider (default: ThemeParksWikiProvider)
  │     └─ NavigationContainer
  │        └─ RootNavigator
  │           ├─ DiscoveryScreen
  │           │  └─ useParkDiscoveryProvider() → provider
  │           │     └─ useSearchParks(query, provider)
  │           ├─ ParkDetailScreen
  │           │  └─ useParkDiscoveryProvider() → provider
  │           │     └─ useParkDetail(parkId, provider)
  │           │        └─ useQueries([park, weather, hours, attractions])
  │           └─ ProfileScreen
  │              └─ useParkDiscoveryProvider() → provider
  │                 └─ provider.getUserProfile()  (via useEffect)
```

## File Changes

| File                                                  | Action | Description                                                                      |
| ----------------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| `src/data/providers/ParkDiscoveryProviderContext.tsx` | Create | Context, `ParkDiscoveryContextProvider`, and `useParkDiscoveryProvider()` hook   |
| `src/features/park-details/useParkDetail.ts`          | Create | Composite hook using `useQueries` for park/weather/hours/attractions in parallel |
| `src/features/park-details/ParkDetailScreen.tsx`      | Modify | Replace useState/useEffect with `useParkDetail`; consume provider from context   |
| `src/features/discovery/DiscoveryScreen.tsx`          | Modify | Remove `new ThemeParksWikiProvider()` default; consume provider from context     |
| `src/features/profile/ProfileScreen.tsx`              | Modify | Remove `new ThemeParksWikiProvider()` default; consume provider from context     |
| `App.tsx`                                             | Modify | Wrap children with `ParkDiscoveryContextProvider` above `RootNavigator`          |

## Interfaces / Contracts

```tsx
// ParkDiscoveryProviderContext.tsx
export function ParkDiscoveryContextProvider({
  children,
  provider = new ThemeParksWikiProvider(),
}: {
  children: React.ReactNode;
  provider?: ParkDiscoveryProvider;
}): JSX.Element;

export function useParkDiscoveryProvider(): ParkDiscoveryProvider;

// useParkDetail.ts — follows useSearchParks pattern
export function useParkDetail(
  parkId: string,
  provider: ParkDiscoveryProvider,
): {
  park: ParkSummary | null | undefined;
  weather: ParkWeather | null | undefined;
  hours: ParkHours | null | undefined;
  attractions: Attraction[] | undefined;
  isLoading: boolean;
  isParkLoading: boolean; // separate loading for park lookup
  error: Error | null;
};
```

## Testing Strategy

| Layer       | What to Test               | Approach                                                                                                                                        |
| ----------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | `useParkDetail` hook       | Wrap in `QueryClientProvider` + `ParkDiscoveryContextProvider` with `FixtureParkDiscoveryProvider`                                              |
| Integration | ParkDetailScreen           | Replace `parkDiscoveryProvider={fixture}` prop with `<ParkDiscoveryContextProvider provider={fixture}>` wrapper. All test assertions unchanged. |
| Integration | DiscoveryScreen            | Same context wrapper pattern; fixture provider injected via context                                                                             |
| Integration | RootNavigator              | Add `ParkDiscoveryContextProvider` to test wrapper alongside `QueryClientProvider`                                                              |
| Unit        | `useParkDiscoveryProvider` | Verify it returns the provider from context; verify it throws when used without provider                                                        |

## Migration / Rollout

No migration required. All screens currently use the same `ThemeParksWikiProvider` — this only changes HOW they receive it. The `new ThemeParksWikiProvider()` default is replaced by the context provider's default. `App.tsx` will add the wrapper before `NavigationContainer`, ensuring all screens receive the provider at mount.

## Open Questions

- [ ] Should ProfileScreen get a dedicated `useUserProfile` React Query hook, or keep useState/useEffect + context provider? The proposal scope lists only park data hooks, so keeping useEffect is consistent for now.
