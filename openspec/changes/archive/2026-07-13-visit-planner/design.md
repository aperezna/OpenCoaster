# Design: Visit Planner / Itinerary

## Technical Approach

Mirror the `useFavorites` pattern — a `useItineraries` hook backed by `StorageAdapter` with `useState + useEffect`. New `Itinerary` + `ItineraryItem` models in `src/data/models/`. Two new screens (VisitPlannerScreen, ItineraryDetailScreen) in a new `src/features/visit-planner/` feature folder, wired into the Parques stack navigator. Live wait times refresh via `useFocusEffect` + `useParkDetail` refetch. Integration points: ParkDetailScreen ("Plan visit" CTA + add-to-itinerary on attraction cards) and ProfileScreen ("My Itineraries" section).

## Architecture Decisions

| Option                                                                  | Tradeoff                                                                                                                                    | Decision                                                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Persistence**: `useState+useEffect` vs TanStack Query for itineraries | Query is overkill for local-only CRUD. `useFavorites` precedent proves the simpler pattern works. `useState+useEffect` with StorageAdapter. | **`useState+useEffect`** — matches existing `useFavorites` exactly.                 |
| **Wait time refresh**: FocusEffect vs manual pull                       | FocusEffect is automatic and matches user expectation ("when I open the plan, I see current times"). No extra button needed.                | **`useFocusEffect`** — triggers `useParkDetail` refetch for the itinerary's parkId. |
| **Add-to-itinerary UI**: Modal picker vs bottom sheet                   | Both work. Modal is simpler to implement with React Native primitives and matches the app's current pattern (no bottom-sheet lib exists).   | **Modal picker** — no new dependencies.                                             |
| **Date picker**: `@react-native-community/datetimepicker` vs text input | Native date picker is the standard UX for date selection. Text input is fragile.                                                            | **`@react-native-community/datetimepicker`** — requires dev build, documented risk. |
| **Itinerary ID**: UUID vs incrementing counter                          | UUID avoids collisions across creates/deletes.                                                                                              | **`crypto.randomUUID()`** or `Date.now().toString(36)` — simple, no dep.            |
| **Reorder**: Move up/down vs drag-and-drop                              | Drag-and-drop needs gesture handler lib. Move up/down buttons work without new deps.                                                        | **Move up/down** — per spec scope.                                                  |

## Data Flow

```
User taps "Plan visit" on ParkDetail
    │
    ▼
VisitPlannerScreen (create) ──→ useItineraries.createItinerary()
    │                                   │
    │                                   ▼
    │                            StorageAdapter.setItem(JSON.stringify(all))
    │                                   │
    │                                   ▼
    │                            useItineraries state updates → UI re-renders
    │
    ▼
ItineraryDetailScreen (view)
    │
    ├── useFocusEffect ──→ useParkDetail(parkId).refetch()  ◄── live wait times
    │
    └── useItineraries ──→ StorageAdapter.getItem() / setItem()

User taps "Add to itinerary" on attraction
    │
    ▼
AttractionList ──→ onAddToItinerary(attraction) ──→ useItineraries.addAttraction()

ProfileScreen renders
    │
    └── useItineraries() ──→ "My Itineraries" section ──→ tap → navigate
```

## File Changes

| File                                                   | Action | Description                                       |
| ------------------------------------------------------ | ------ | ------------------------------------------------- |
| `src/data/models/Itinerary.ts`                         | Create | `Itinerary` + `ItineraryItem` interfaces          |
| `src/features/visit-planner/useItineraries.ts`         | Create | Hook mirroring `useFavorites` pattern             |
| `src/features/visit-planner/VisitPlannerScreen.tsx`    | Create | Create itinerary + date picker screen             |
| `src/features/visit-planner/ItineraryDetailScreen.tsx` | Create | View single itinerary, reorder, delete            |
| `src/features/visit-planner/ItineraryPickerModal.tsx`  | Create | Modal to pick target itinerary on add             |
| `src/features/park-detail/ParkDetailScreen.tsx`        | Modify | Add "Plan visit" CTA + pass `onAddToItinerary`    |
| `src/features/park-detail/AttractionList.tsx`          | Modify | Add "Add to itinerary" button + "Added" indicator |
| `src/features/profile/ProfileScreen.tsx`               | Modify | Add "My Itineraries" section                      |
| `src/navigation/ParquesStackNavigator.tsx`             | Modify | Add VisitPlanner + ItineraryDetail routes         |
| `package.json`                                         | Modify | Add `@react-native-community/datetimepicker`      |

## Interfaces / Contracts

```typescript
// src/data/models/Itinerary.ts
export interface Itinerary {
  id: string;
  parkId: string;
  parkName: string;
  date?: string; // ISO 8601 date (YYYY-MM-DD), undefined = "Date TBD"
  items: ItineraryItem[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface ItineraryItem {
  id: string; // unique within itinerary
  attractionId: string;
  name: string;
  order: number; // 0-based position
}

// Storage key
const ITINERARIES_KEY = 'opencoaster:itineraries';

// useItineraries hook return type
interface UseItinerariesReturn {
  itineraries: Itinerary[];
  isLoading: boolean;
  createItinerary: (parkId: string, parkName: string, date?: string) => void;
  deleteItinerary: (id: string) => void;
  updateDate: (id: string, date?: string) => void;
  addAttraction: (itineraryId: string, attraction: { id: string; name: string }) => void;
  removeAttraction: (itineraryId: string, attractionId: string) => void;
  moveItemUp: (itineraryId: string, attractionId: string) => void;
  moveItemDown: (itineraryId: string, attractionId: string) => void;
  isAttractionInItinerary: (attractionId: string) => boolean;
}

// Navigation params (added to ParquesStackParamList)
export type ParquesStackParamList = {
  ParksList: { parkId?: string };
  ParkDetail: { parkId: string };
  VisitPlanner: { parkId?: string; parkName?: string }; // pre-selected park
  ItineraryDetail: { itineraryId: string };
};
```

## Testing Strategy

| Layer       | What to Test                                          | Approach                                                                          |
| ----------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| Unit        | `useItineraries` CRUD operations                      | In-memory adapter + `renderHook` — follow `useFavorites.test.tsx` pattern exactly |
| Unit        | Reorder logic (move up/down, boundaries)              | Unit test hook state transitions                                                  |
| Unit        | `isAttractionInItinerary` across multiple itineraries | Hook test with pre-seeded data                                                    |
| Integration | VisitPlannerScreen create flow                        | `@testing-library/react-native` — mock `useItineraries`, verify navigation        |
| Integration | ItineraryDetailScreen view/delete                     | Mock `useItineraries`+`useParkDetail`, verify render + delete flow                |
| Integration | ParkDetailScreen "Plan visit" CTA                     | Verify CTA renders, tap navigates with parkId param                               |
| Integration | AttractionList "Add to itinerary" + indicator         | Verify button shows, disappears when added                                        |
| Integration | ProfileScreen "My Itineraries" section                | Mock `useItineraries`, verify list + empty state                                  |
| E2E         | Full create → add attraction → view on profile        | Maestro flow (new or extend existing)                                             |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. All changes are UI + local storage within the React Native app. No network requests, file system access beyond AsyncStorage, or process execution.

## Migration / Rollout

No data migration required. Feature is fully additive — no existing data schema changes. Install `@react-native-community/datetimepicker` via `npx expo install`. Dev build required for native date picker; document in PR.

## Open Questions

- [ ] Does `@react-native-community/datetimepicker` work with Expo SDK 52 managed workflow, or does it mandate a dev build?
- [ ] Should "Add to itinerary" on an already-added attraction show a "Remove" action instead of just an indicator?
- [ ] How should the park-hours display handle future dates (spec says show "hours unavailable")?
