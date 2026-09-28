# Licensed Park and Attraction Images

## Objective

Add reliable, license-aware park and attraction image retrieval using Wikimedia Commons first and Openverse as a fallback, while preserving attribution and graceful degradation.

## Problem

OpenCoaster currently exposes only limited park media and no attraction imagery. RCDB cannot be used without written permission because its terms restrict constructing applications from its content and its photos remain owned by their respective contributors.

## Scope

- Define image metadata with source, creator, license, attribution, and timestamps.
- Search Wikimedia Commons and Openverse using park/attraction names.
- Accept only compatible licenses: CC0, public domain, CC BY, and CC BY-SA.
- Cache image metadata and avoid API calls on every render.
- Add park and attraction image fields with fallback behavior.
- Render remote thumbnails and an accessible attribution path in the relevant UI.
- Add tests for matching, license filtering, fallback, caching, and degraded network behavior.

## Constraints

- Do not scrape or reuse RCDB content.
- Do not accept unclear, non-commercial, or all-rights-reserved images.
- Preserve source URL and license metadata for every displayed image.
- Keep all integrations zero-cost and avoid requiring secrets in the mobile client.
- Respect source API etiquette, caching, throttling, and thumbnail delivery guidance.

## Authorized Scope

- `src/data/**` image models, providers, cache, and tests.
- `src/features/discovery/**` and `src/features/park-details/**` image presentation and tests.
- `src/i18n/**` attribution/fallback strings and tests.
- Related task documentation only.

## Tasks

- [x] IMG-1: Define image metadata/domain contracts and compatible-license filtering with tests.
- [x] IMG-2: Implement Wikimedia Commons search, metadata extraction, caching, and throttling.
- [x] IMG-3: Implement Openverse fallback and deterministic provider orchestration.
- [x] IMG-4: Integrate image lookup into park/attraction data and UI with attribution/fallback states.
- [x] IMG-5: Run full validation, document source/licensing behavior, and publish the work unit.
- [x] IMG-6: Sanitize provider attribution HTML and add resilient native image loading fallback.
- [x] IMG-7: Capture the native image-loader failure and correct the provider URL shape if needed.
- [x] IMG-8: Make Wikimedia native image requests compatible with CDN hotlink policy.
- [x] IMG-9: Prefer directly loadable Openverse provider URLs when Wikimedia CDN blocks native images.
- [x] IMG-10: Version the persisted licensed-image query key after changing provider selection.

## Acceptance Criteria

- Parks and attractions can receive compatible licensed thumbnails without RCDB access.
- Every displayed image retains source, creator, license, and attribution metadata.
- Incompatible or unclear licenses are excluded.
- Network failures, missing matches, deleted images, and rate limits leave the existing UI usable.
- Repeated renders do not repeat external searches; cached results are reused.
- Focused and full repository checks pass without new errors.

## Checks

- Focused image-provider, cache, model, and UI Jest suites.
- `npm run typecheck`
- `npm run format:check`
- `npm run lint`
- `npm test -- --runInBand --detectOpenHandles`

## Progress

- Route: single-writer direct implementation on feature branch `fix/img-6-native-image-fallback`.
- Current step: IMG-10 implementation complete; the emulator was reusing a 24-hour React Query licensed-image result created before the Openverse selection change. The query key is now versioned so persisted stale Wikimedia metadata cannot mask the new provider behavior.
- Root-cause evidence: Emulator logcat continued to report HTTP 403 for `thumb.wikimedia.org` and `upload.wikimedia.org` after IMG-8. The host machine can fetch the same resources, so this is an emulator/native-CDN compatibility boundary rather than invalid metadata.
- Verification evidence: Strict TDD RED observed for both hook key assertions, followed by GREEN. Focused image/provider/UI suite: 18 suites / 134 tests passed. Full `npm test -- --runInBand --detectOpenHandles`: 54 suites / 453 tests passed. `npm run typecheck` passed. `npm run format:check` passed. The implementation commit's lint-staged checks passed; no separate lint run was required for this task. Existing React console diagnostics remain in error-path tests, and the existing Leaflet `act(...)` warning remains.
- Commit identity: `54f8f52` (`fix(images): version licensed image query keys`), following `bbc134b` (`fix(images): prefer directly loadable Openverse URLs`).
- Remaining limitation: No fresh emulator lookup was run in this work unit, so native runtime confirmation of the new cache namespace remains pending.
