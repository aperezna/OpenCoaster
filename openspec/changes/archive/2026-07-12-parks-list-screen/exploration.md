## Exploration: parks-list-screen

### Current State

The Parques (Parks) tab in `RootNavigator.tsx` renders `<ParkDetailScreen />` directly with **no list intermediation**. `ParkDetailScreen` reads `route.params?.parkId` from the tab params and falls back to a hardcoded `DEFAULT_PARK_ID` (`75ea578a-adc8-4116-a54d-dccb60765ef9` — Magic Kingdom). This means:

- Tapping the Parques tab always shows Magic Kingdom detail
- There is zero browsing or selection before hitting a park
- `DiscoveryScreen` navigates to `Parques` with `{ parkId }` to bypass the list, which works but couples the tab to a single-screen experience

**Existing reusable pieces:**

- `ParkResultList.tsx` — FlatList rendering `ParkSummary[]` with `onParkPress` callback and empty-state handling
- `SearchBar.tsx` — simple `TextInput` wrapper with `name`/`onNameChange` props
- `useSearchParks.ts` — TanStack Query hook wrapping `provider.searchParks(query)`, works with empty `{}` to return all parks
- `ParkDiscoveryProvider` interface with `searchParks(ParkSearchQuery)` returning `ParkSummary[]`
- `@react-navigation/native-stack` v7 is **already installed** in `package.json`

### Affected Areas

- `src/navigation/RootNavigator.tsx` — Parques tab renderer, exports, param types
- `src/features/park-details/ParkDetailScreen.tsx` — param reading (needs stack support), back-button behavior
- `src/features/discovery/DiscoveryScreen.tsx` — only if param types change; otherwise no modifications needed
- `src/navigation/__tests__/RootNavigator.test.tsx` — test for Parques tab mount needs updating
- `src/features/park-details/__tests__/ParkDetailScreen.test.tsx` — may need updates if param types change
- `NEW: src/features/parks-list/ParksListScreen.tsx` — new screen
- `NEW: src/features/parks-list/__tests__/ParksListScreen.test.tsx` — new tests
- `NEW: src/navigation/ParquesStack.tsx` — new nested stack navigator

### Approaches

1. **Nested native-stack navigator (recommended)** — Create a `ParquesStack` using `@react-navigation/native-stack` with two screens (`ParksList` → `ParkDetail`). The Parques tab renders the stack. `ParksListScreen` reads tab params on mount and auto-navigates to `ParkDetail` when `parkId` is provided (the deep-link from `DiscoveryScreen`).
   - **Pros**: Standard React Navigation pattern; native back button/gestures; clean separation of concerns; uses already-installed dependencies; `ParkDetailScreen` becomes a proper stack screen with typed params
   - **Cons**: Requires a thin auto-navigation bridge in `ParksListScreen` for the DiscoveryScreen deep-link case; slight navigation timing consideration on first mount
   - **Effort**: Medium

2. **State-driven toggle in the Parques tab** — Render a container component that holds a `selectedParkId` state and conditionally shows either `ParksListScreen` or `ParkDetailScreen`, keeping both inline inside the tab with no nested navigator.
   - **Pros**: No additional navigator; no new dependency; simplest possible wiring
   - **Cons**: Loses native stack transitions and back-button behavior; must manually manage back navigation (hardware back on Android breaks); breaks React Navigation's screen lifecycle; `DiscoveryScreen` navigation still works via tab params but manual back-handling is fragile
   - **Effort**: Low

3. **Replace tab with a single stack, demote tabs** — Move the bottom-tab structure inside a root stack that owns `Mapa`, `ParquesStack`, and `Usuario` tabs, where `ParquesStack` already includes the list → detail navigation. This is a more ambitious refactor.
   - **Pros**: Cleanest navigation hierarchy; every screen is a stack screen
   - **Cons**: Higher effort, touches every route, risks breaking existing navigation; overkill for a single-screen change
   - **Effort**: High

### Recommendation

**Approach 1 (nested native-stack navigator).** Here's the concrete plan:

**Navigation structure:**

```
Tab.Navigator
├── Mapa → DiscoveryScreen
├── Parques → ParquesStack (new)
│   ├── ParksList (initial)
│   └── ParkDetail
└── Usuario → ProfileScreen
```

**Param types:**

```typescript
export type ParquesStackParamList = {
  ParksList: undefined;
  ParkDetail: { parkId: string };
};
```

**Deep-link bridge (ParksListScreen → ParkDetail):**

```typescript
// ParksListScreen reads tab params on mount
const tabRoute = useRoute<RouteProp<RootTabParamList, 'Parques'>>();

useEffect(() => {
  if (tabRoute.params?.parkId) {
    navigation.navigate('ParkDetail', { parkId: tabRoute.params.parkId });
  }
}, []);
```

This preserves the existing `navigation.navigate('Parques', { parkId })` from `DiscoveryScreen` with zero changes to that file.

**ParkDetailScreen changes:**

- Add a new param type for `ParquesStackParamList['ParkDetail']` in addition to the tab fallback
- The back button is automatic from `native-stack` header (no extra code needed)
- Keep the `DEFAULT_PARK_ID` fallback for resilience

**ParksListScreen:**

- Uses `useSearchParks({}, provider)` on mount to fetch all parks
- Has a `SearchBar` that updates a local `searchText` state and triggers `useSearchParks({ name: searchText }, provider)` after debounce (simple `setTimeout` or inline)
- Renders `ParkResultList` with `onParkPress` → `navigation.navigate('ParkDetail', { parkId })`

**No changes needed to:** `DiscoveryScreen`, `useSearchParks`, `ParkResultList`, `SearchBar`, data providers, or models.

### Risks

- **Auto-navigation timing**: `ParksListScreen` auto-navigating on mount could cause a flash of the list before the detail screen pushes. Mitigation: pass a loading state or conditionally render a spinner until the auto-navigate fires. In practice, React Navigation's screen render is synchronous enough that this is a non-issue, but worth testing.
- **Param cleanup after deep-link**: Once the stack navigates to `ParkDetail`, pressing back returns to `ParksList`. At that point tab params still have `parkId` — re-entering `ParksListScreen` would re-trigger the auto-navigate. Mitigation: clear tab params or use a ref guard (`autoNavigatedRef`).
- **Review budget**: The change touches ~5 files and adds 2 new ones. Estimated 150-250 lines delta (under the 800-line budget from `openspec/config.yaml`).
- **Test regressions**: `RootNavigator.test.tsx` mounts `ParkDetailScreen` via the Parques tab — the test will need updating since the tab now renders a stack. `ParkDetailScreen.test.tsx` may need param type adjustments.

### Ready for Proposal

Yes — the orchestrator should proceed to `sdd-propose`. Approach 1 is well-understood, uses existing dependencies, and has clear file boundaries. The key design decisions (auto-navigation guard, param fallback) are ready to be captured in the proposal.
