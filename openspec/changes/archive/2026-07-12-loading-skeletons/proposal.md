# Proposal: Loading Skeletons

## Intent

Replace plain "Loading..." text with animated skeleton placeholders during data fetches. Improves perceived performance and UX consistency across three screens.

## Scope

### In Scope

- Reusable `SkeletonBlock` and `SkeletonCircle` primitives using RN Animated API
- Screen-specific skeletons: ParkDetailSkeleton, ParksListSkeleton, ProfileSkeleton
- Replace text loaders on ParkDetailScreen, ParksListScreen, ProfileScreen

### Out of Scope

- Shimmer/gradient effect (simple pulse only)
- Pull-to-refresh skeletons
- Skeleton-to-content smooth transitions (fade-in deferred)

## Capabilities

### New Capabilities

- `skeleton-components`: Reusable animated skeleton primitives (SkeletonBlock, SkeletonCircle) using React Native Animated API with pulse animation

### Modified Capabilities

- `park-detail`: Add loading state — show skeleton matching content layout (photo, info, weather+hours cards, attractions) while data loads
- `parks-list`: Add loading state — show skeleton (search bar + list items) while data loads
- `profile-screen`: Add loading state — show skeleton (profile info + favorites list) while data loads

## Approach

Create `src/components/skeleton/SkeletonBlock.tsx` and `SkeletonCircle.tsx` using `Animated.loop` + opacity interpolation for pulse effect. No external dependencies. Compose screen-level skeletons from primitives. Keep `Animated.View` with `useNativeDriver: true` for animation perf on Android.

## Affected Areas

| Area                                                            | Impact   | Description                                     |
| --------------------------------------------------------------- | -------- | ----------------------------------------------- |
| `src/features/park-details/ParkDetailScreen.tsx`                | Modified | Replace "Loading..." with ParkDetailSkeleton    |
| `src/features/parks-list/ParksListScreen.tsx`                   | Modified | Add ParksListSkeleton during load               |
| `src/features/profile/ProfileScreen.tsx`                        | Modified | Replace "Loading..." with ProfileSkeleton       |
| `src/components/skeleton/`                                      | New      | SkeletonBlock, SkeletonCircle, screen skeletons |
| `src/features/park-details/__tests__/ParkDetailScreen.test.tsx` | Modified | Add loading state test                          |

## Risks

| Risk                              | Likelihood | Mitigation                                      |
| --------------------------------- | ---------- | ----------------------------------------------- |
| Animation perf on low-end Android | Low        | Use native driver; test on API 26+ emulator     |
| Misalignment with content layout  | Low        | Use same layout structure as content containers |

## Rollback Plan

Revert skeleton components and restore previous loading text/empty state in all 3 screens. Single-commit revert.

## Dependencies

None — uses React Native built-in `Animated` API only.

## Success Criteria

- [ ] ParkDetailScreen shows skeleton matching content layout during fetch
- [ ] ParksListScreen shows skeleton matching list layout during fetch
- [ ] ProfileScreen shows skeleton matching profile layout during fetch
- [ ] No regressions in data loading, favorites toggle, or navigation
