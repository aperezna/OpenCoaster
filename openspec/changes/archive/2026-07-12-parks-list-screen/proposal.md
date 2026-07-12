# Proposal: Parks List Screen

## Intent

Give users a browsable park list in the Parques tab so they can search and select which park to explore, instead of navigating to a hardcoded Magic Kingdom detail screen.

## Scope

### In Scope

- `ParksListScreen` with search bar + park list, reusing `ParkResultList` and `useSearchParks`
- `ParquesStackNavigator` — nested native-stack inside Parques tab (ParksList → ParkDetail)
- Update `RootNavigator` Parques tab to render the stack
- Update `ParkDetailScreen` to read stack params with fallback (auto back button from native-stack header)
- Keep `DiscoveryScreen → Parques` navigation working via auto-navigate bridge with `useRef` guard
- Tests for new list screen + updated navigator tests

### Out of Scope

- Park photos in list rows (future enhancement)
- Pull-to-refresh
- Favorites toggle from list
- Sorting/filtering beyond name search
- Reworking RootNavigator tab structure

## Capabilities

### New Capabilities

None — parks list reuses existing `search-park` and `park-discovery-provider` capabilities.

### Modified Capabilities

- `app-bootstrap`: Navigation structure — Parques tab now wraps a nested native-stack (ParksList → ParkDetail) instead of rendering ParkDetailScreen directly. ParquesStackParamList types added.

## Approach

Nested `@react-navigation/native-stack` inside the Parques tab.

1. **ParquesStackNavigator** — two screens: `ParksList` and `ParkDetail`
2. **RootNavigator** — Parques tab renders `<ParquesStackNavigator />`
3. **ParksListScreen** — `useSearchParks({})` on mount for all parks; `SearchBar` + debounced `useSearchParks({name})` for filtering; renders `ParkResultList` with `onParkPress → navigate('ParkDetail', { parkId })`
4. **Deep-link bridge** — reads tab params on mount; auto-navigates to ParkDetail when `parkId` present; `useRef` guard prevents re-trigger on back
5. **ParkDetailScreen** — adds `ParquesStackParamList['ParkDetail']` param type; keeps `DEFAULT_PARK_ID` fallback; back button auto-provided by native-stack header
6. **Tests** — unit + integration for list screen behavior; update RootNavigator test for stack mount

## Affected Areas

| Area                                                         | Impact   | Description                         |
| ------------------------------------------------------------ | -------- | ----------------------------------- |
| `src/navigation/RootNavigator.tsx`                           | Modified | Parques tab renders stack navigator |
| `src/navigation/ParquesStack.tsx`                            | New      | Stack navigator + param types       |
| `src/features/parks-list/ParksListScreen.tsx`                | New      | List + search screen                |
| `src/features/park-details/ParkDetailScreen.tsx`             | Modified | Stack params + auto back button     |
| `src/navigation/__tests__/RootNavigator.test.tsx`            | Modified | Updated for stack mount             |
| `src/features/parks-list/__tests__/ParksListScreen.test.tsx` | New      | List + search + auto-nav tests      |

## Risks

| Risk                             | Likelihood | Mitigation                                      |
| -------------------------------- | ---------- | ----------------------------------------------- |
| Auto-navigate flash on deep-link | Low        | Screen render is synchronous — negligible flash |
| Re-trigger auto-nav on back      | Medium     | `useRef` guard + clear tab params after nav     |
| Line count (est. 150-250)        | Low        | Well under 800-line review budget               |

## Rollback

Restore `RootNavigator.tsx` to render `<ParkDetailScreen />` directly in the Parques tab. No data migration needed.

## Dependencies

None — `@react-navigation/native-stack` already installed.

## Success Criteria

- [ ] Tapping Parques tab shows park list (not detail)
- [ ] Typing in search bar filters parks by name
- [ ] Tapping a park navigates to ParkDetail with correct data
- [ ] ParkDetail shows back button via native-stack header
- [ ] DiscoveryScreen park selection navigates to ParkDetail via Parques
- [ ] Pressing back from ParkDetail after deep-link returns to list (no re-trigger)
- [ ] All existing tests pass
