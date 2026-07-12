# Design: Parks List Screen

## Technical Approach

Nested `@react-navigation/native-stack` inside the Parques tab. Stack has two screens: `ParksList` (new list with search) and `ParkDetail` (existing detail adapted for stack params). Reuses `useSearchParks`, `ParkResultList`, and the existing `ParkDiscoveryProvider`. Auto-nav from DiscoveryScreen uses a `useRef` guard plus clearing tab params for defense-in-depth.

## Architecture Decisions

### Decision: Param bridge (tab → stack)

| Option                                                                            | Tradeoff                                                      | Decision                                                    |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| `ParquesStackNavigator` reads tab route and passes `initialParams` to `ParksList` | Clean bridge; stack screens read stack params, not tab params | **Chosen**                                                  |
| `ParksListScreen` reads `route.params?.parkId` directly                           | **Doesn't work** — tab params aren't visible inside the stack | Rejected — this was the critical bug in the previous design |

**Mechanism**: `ParquesStackNavigator` (rendered by `Tab.Screen name="Parques"`) calls `useRoute<RouteProp<RootTabParamList, 'Parques'>>()` to read tab params, then passes them as `initialParams` to `Stack.Screen name="ParksList"`. `ParksListScreen` reads them from its stack `route.params`.

### Decision: Make parkId required on ParkDetail

| Option                            | Tradeoff                                                      | Decision   |
| --------------------------------- | ------------------------------------------------------------- | ---------- |
| `ParkDetail: { parkId: string }`  | Both entry paths (list tap, auto-nav) always provide a parkId | **Chosen** |
| `ParkDetail: { parkId?: string }` | Loose typing, masks bugs                                      | Rejected   |

`DEFAULT_PARK_ID` stays in the component body as a runtime safety net, but the type contract is now exact.

### Decision: Auto-nav guard

| Guard               | Mechanism                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| 1. `useRef` flag    | Set false on mount, true after first auto-nav. Prevents re-trigger on back.                       |
| 2. Clear tab params | `navigation.setParams({})` after consuming — defense against remount if the stack re-initializes. |

### Decision: Search debounce

| Option                           | Tradeoff                                 | Decision   |
| -------------------------------- | ---------------------------------------- | ---------- |
| `useEffect` + `setTimeout` 300ms | Simple, no extra deps                    | **Chosen** |
| Lodash debounce                  | Extra dependency, overkill for one input | Rejected   |

`ParksListScreen` maintains local `searchText` state (immediate), debounces to `debouncedText` via `useEffect` + `setTimeout(300ms)`, then passes `debouncedText` to `useSearchParks`.

## Data Flow

```
DiscoveryScreen → navigate('Parques', { parkId })
                      ↓
            Tab route: Parques { parkId }
                      ↓
       ParquesStackNavigator  ← reads useRoute<RootTabParamList,'Parques'>()
            sets initialParams on ParksList screen
                      ↓
          ┌─ ParksListScreen ──────────────────────┐
          │  mount: route.params.parkId? + guard?  │
          │   YES + useRef false →                  │
          │     navigate('ParkDetail',{parkId})     │
          │     setRef(true), clear tab params      │
          │   NO → render list (useSearchParks)     │
          └─────────────────────────────────────────┘

From ParksList:
  Tap park → Stack.push('ParkDetail', { parkId })
  Back     → Stack.pop() → ParksList (guard=true, tab params cleared)
```

## File Changes

| File                                                         | Action | Description                                                                                                                                      |
| ------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/features/parks-list/ParksListScreen.tsx`                | Create | List + debounced search (300ms) + `ParkResultList` + auto-nav guard (useRef + clear params)                                                      |
| `src/features/parks-list/__tests__/ParksListScreen.test.tsx` | Create | Unit: render all, search filters, empty state, tap navigates, guard stability, tab-switch-then-return, back-then-different-park                  |
| `src/navigation/ParquesStackNavigator.tsx`                   | Create | Native-stack with `ParksList` + `ParkDetail`. Reads tab params → passes as `initialParams` to `ParksList`. Exports `ParquesStackParamList` types |
| `src/navigation/__tests__/ParquesStackNavigator.test.tsx`    | Create | Integration: list→detail nav, deep-link bypass, unknown parkId fallback                                                                          |
| `src/navigation/RootNavigator.tsx`                           | Modify | `Parques` tab renders `<ParquesStackNavigator />` instead of `<ParkDetailScreen />`                                                              |
| `src/features/park-details/ParkDetailScreen.tsx`             | Modify | Accept `ParquesStackParamList['ParkDetail']` route type; keep `DEFAULT_PARK_ID` fallback                                                         |
| `src/navigation/__tests__/RootNavigator.test.tsx`            | Modify | `Parques` tab test checks for stack mount instead of `park-detail-screen` testID                                                                 |

## Interfaces / Contracts

```typescript
// src/navigation/ParquesStackNavigator.tsx
export type ParquesStackParamList = {
  ParksList: { parkId?: string } | undefined;
  ParkDetail: { parkId: string }; // ← required (was optional)
};

// param bridge — ParquesStackNavigator reads tab params and passes as initialParams
const tabRoute = useRoute<RouteProp<RootTabParamList, 'Parques'>>();
// <Stack.Screen name="ParksList" initialParams={tabRoute.params} />
```

## Testing Strategy

| Layer | What                                      | Approach                                                                                                                       |
| ----- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Unit  | Render all parks on mount                 | Mock `useSearchParks({})` returning list; assert `ParkResultList` renders all items                                            |
| Unit  | Search filters by name                    | Type in search bar; assert debounced call with name query                                                                      |
| Unit  | Empty state shows "No parks found"        | Mock empty return from `useSearchParks`; assert empty testID                                                                   |
| Unit  | Tap park navigates to detail              | `onParkPress` → assert `navigate('ParkDetail', { parkId })`                                                                    |
| Unit  | Auto-nav guard on mount with parkId       | Render with `initialParams={{ parkId: 'x' }}`; assert nav to ParkDetail; back → assert no re-nav                               |
| Unit  | Tab-switch-then-return — guard persists   | Same as above + simulate tab focus cycle; assert guard holds                                                                   |
| Unit  | Back after deep link → tap different park | Render deep-link → back → tap park B; assert nav to B                                                                          |
| E2E   | Deep link with unknown parkId             | Navigate with nonexistent `parkId`; assert detail shows "Park not found" (covered by existing `!park` fallback at lines 55-61) |

## Migration / Rollout

No migration required. The Parques tab previously rendered `ParkDetailScreen` directly — now renders the stack navigator which defaults to `ParksList`. The `parkId` param on `RootTabParamList['Parques']` is preserved for the deep-link bridge.

## Open Questions

- None
