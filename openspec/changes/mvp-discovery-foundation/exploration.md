## Exploration: OpenCoaster MVP discovery foundation

### Current State
The repository is still greenfield. The only concrete project artifacts are `openspec/config.yaml` and the empty OpenSpec scaffolding. Stack, testing, and product constraints currently come from the PRD and SDD init metadata rather than app code. That makes this exploration primarily an architecture and slice-planning exercise.

### Affected Areas
- `openspec/config.yaml` — establishes Expo/React Native, strict TDD, hybrid persistence, and review-budget constraints for the change.
- `openspec/changes/mvp-discovery-foundation/exploration.md` — captures the first change-set exploration for downstream proposal/spec/design phases.
- `app/` — planned Expo application root for navigation, map shell, query client, and screen composition.
- `src/features/discovery/` — planned feature boundary for geolocation, nearby parks lookup, manual fallback search, and map/list presentation.
- `src/features/park-details/` — future boundary for detail screen, attribution, lands/rides, and live queue rendering.
- `src/data/providers/` — planned adapters for ThemeParks.wiki and Queue-Times.com with normalization and cache policy boundaries.
- `src/data/cache/` — planned offline/cache abstractions for 5-minute queue freshness and stale-data indicators.
- `__tests__/` — planned Jest + jest-expo coverage for geolocation success, denied-permission fallback, and detail queue rendering scenarios.

### Approaches
1. **Discovery-first foundation** — bootstrap the Expo app, map shell, geolocation flow, manual search fallback, and a normalized park summary model behind provider interfaces; defer live queue integration to the next slice.
   - Pros: Smallest end-to-end slice, lowest API risk early, fits the 800-line review budget better, unlocks TDD and UI architecture before live data complexity.
   - Cons: First shipped slice will not yet prove queue-times rendering or offline stale-detail behavior against real providers.
   - Effort: Low/Medium

2. **Vertical slice with live park details** — include discovery flow plus real park detail fetches, queue-time normalization, 5-minute cache rules, and offline stale indicators in the first change.
   - Pros: Validates the most product-critical integrations immediately, covers more PRD acceptance in one pass.
   - Cons: Higher uncertainty around provider mapping, park identity reconciliation, map permissions, caching semantics, and test harness setup; likely to exceed comfortable first-PR size.
   - Effort: High

### Recommendation
Use **Discovery-first foundation** as the first SDD slice. Concretely, the first change should establish the Expo/TypeScript app shell, map screen scaffold, location permission handling, global/manual park search fallback, a provider adapter contract that returns normalized `ParkSummary` records, and fixture-backed tests for the geolocation success/denied flows. This keeps the first implementation small while preserving the architecture needed for real ThemeParks.wiki and Queue-Times integrations in follow-up slices.

Key architecture choices for that slice:
- Use **Expo + React Native + TypeScript** as planned, with **TanStack Query** for cache/state around remote park data.
- Keep a **provider boundary** from day one: `ParkDiscoveryProvider` for park summaries now, `ParkDetailProvider` / `QueueTimesProvider` later.
- Normalize external data into app-owned models early (`ParkSummary`, `ParkDetail`, `QueueSnapshot`) so provider differences do not leak into UI code.
- Treat geolocation as an **optional input**, not a hard dependency: permission denied or unavailable must route into manual/global search without blocking the session.
- Plan cache layers now even if the first slice uses fixtures: TanStack Query cache for in-memory freshness plus persisted last-known detail snapshots later for offline fallback.

Important risks and design constraints identified:
- **External API integration**: ThemeParks.wiki and Queue-Times may not share stable park IDs, naming, geography precision, status vocabularies, or operating-hours formats. A park identity reconciliation strategy will be needed before detail/queue integration.
- **Data normalization**: Hours, ride status, and queue units may differ or be partially missing; app models should support nullable/unknown states without breaking UI.
- **Map/geolocation**: `react-native-maps` inside Expo can require platform-specific setup and emulator/device testing; location permission flows must be abstracted for unit tests because Windows PowerShell cannot validate native GPS behavior alone.
- **Caching/offline**: The 5-minute freshness rule is easy in TanStack Query, but offline fallback needs persisted storage and explicit `fetchedAt` metadata so stale indicators are trustworthy.
- **Windows PowerShell testability**: Jest + `jest-expo` is the safest first runner; native map rendering should stay behind test doubles, and provider adapters should be tested as pure TypeScript modules.

### Risks
- Real provider contracts may force a second normalization layer once park identity mismatches are observed.
- Map and location behavior cannot be fully proven on Windows shell alone; emulator/device verification will still be required.
- If the first slice includes real provider calls too early, review size and failure surface will grow sharply.

### Ready for Proposal
Yes — the orchestrator should propose a first change named `mvp-discovery-foundation` focused on app bootstrap, discovery flow, provider contracts, and TDD-friendly fixture data, while explicitly deferring live queue-time detail integration to a follow-up slice.
