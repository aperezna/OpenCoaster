# Design: Loading Skeletons

## Technical Approach

Create a single `src/components/Skeleton.tsx` module exporting `SkeletonBlock` (the pulse-animated primitive) and three screen-specific skeletons (`ParkDetailSkeleton`, `ParksListSkeleton`, `ProfileSkeleton`). Each screen checks its loading condition and renders the matching skeleton instead of "Loading..." text. Pure UI — no data/logic changes.

Maps to proposal's _skeleton-components_ capability; modifies _park-detail_, _parks-list_, _profile-screen_ as specified.

## Architecture Decisions

| Decision       | Choice                                                        | Alternatives                         | Rationale                                                                                          |
| -------------- | ------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| File layout    | Single `src/components/Skeleton.tsx`                          | `src/components/skeleton/` directory | Fewer files for simple primitives; only 4 exports, co-located                                      |
| Skeleton shape | `SkeletonBlock` only (generic)                                | Separate `SkeletonCircle`            | `SkeletonBlock` with `borderRadius: '50%'` and equal w/h handles circles; avoids API surface bloat |
| Pulse impl     | `Animated.loop` + `Animated.sequence` over opacity            | `Animated.timing` with `interpolate` | Sequence is explicit about direction (1→0.3→1); fewer refs, same perf                              |
| Native driver  | `useNativeDriver: true`                                       | JS-side animation                    | Required for 60fps on Android; RN docs mandate it for non-layout Animated props                    |
| Composition    | Screen skeletons wrap `SkeletonBlock` with fixed layout props | Dynamic prop injection per variant   | Layout is static per screen; fixed props are simpler and testable                                  |

## Data Flow

```
Screen renders
  │
  ├── loading === true? →  <ParkDetailSkeleton />
  │                         (or ParksListSkeleton, ProfileSkeleton)
  │
  └── loading === false? →  <Content />  (normal component tree)
```

No data transformation. The skeleton is a visual placeholder — it replaces the entire screen content during fetch and unmounts when data arrives. No animation lifecycle coordination with data.

## File Changes

| File                                             | Action | Description                                                                                       |
| ------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------- |
| `src/components/Skeleton.tsx`                    | Create | `SkeletonBlock` primitive + `ParkDetailSkeleton`, `ParksListSkeleton`, `ProfileSkeleton`          |
| `src/components/__tests__/Skeleton.test.tsx`     | Create | Render + animation class test                                                                     |
| `src/features/park-details/ParkDetailScreen.tsx` | Modify | Replace `<Text>Loading...</Text>` with `<ParkDetailSkeleton />` at existing `isParkLoading` guard |
| `src/features/parks-list/ParksListScreen.tsx`    | Modify | Destructure `isLoading` from `useSearchParks`; show `<ParksListSkeleton />` while loading         |
| `src/features/profile/ProfileScreen.tsx`         | Modify | Replace `<Text>Loading...</Text>` with `<ProfileSkeleton />` at `!profile` guard                  |

## Interfaces

```tsx
// SkeletonBlock: animate pulse on configurable rectangle
interface SkeletonBlockProps {
  width: number | string;
  height: number;
  borderRadius?: number; // default 4
  style?: ViewStyle; // extra style overrides
}

// Screen skeletons — no props, fixed layout
function ParkDetailSkeleton(): JSX.Element;
function ParksListSkeleton(): JSX.Element;
function ProfileSkeleton(): JSX.Element;
```

Animation: `Animated.loop` runs `Animated.sequence` → `Animated.timing(opacity, { toValue: 0.3, duration: 500 })` + `Animated.timing(opacity, { toValue: 1, duration: 500 })` → repeats. Total cycle ~1000ms.

## Testing Strategy

| Layer       | What                                          | Approach                                                                             |
| ----------- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| Unit        | `SkeletonBlock` renders with given dimensions | `render(<SkeletonBlock width={100} height={20} />)` — assert style props             |
| Unit        | Skeleton starts with opacity animation        | Check `Animated.loop` was called with sequence via spy/mock                          |
| Integration | Screen shows skeleton while loading           | Render screen in loading state: assert skeleton testID, assert content testID absent |
| Integration | Screen shows content when loaded              | Render screen with data: assert content testID present                               |

## Migration / Rollout

No migration required. All three screens currently show "Loading..." text — swapping the JSX branch is a visual-only change. One commit covers all files.

## Open Questions

- [ ] `ParkResultList` shows "No parks found" when `parks` is `[]` before initial fetch completes — does the proposed `isLoading && !parks` guard cover this, or do we also need a separate loading flag from the query? (Current `useSearchParks` returns `isLoading` which is `true` during initial fetch, so the guard works.)
