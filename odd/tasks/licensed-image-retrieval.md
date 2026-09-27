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

- Route: delegated direct implementation; the change spans multiple non-trivial files and external-provider behavior.
- Current step: IMG-5 complete; Wikimedia Commons is primary, Openverse is a commercial-compatible fallback, and all displayed image metadata retains source, creator, license, attribution, and fetched timestamp. RCDB is intentionally excluded because its terms do not authorize constructing applications from its content without written permission.
- Verification evidence: 53 suites / 445 tests passed; typecheck passed; format check passed; lint passed with 20 existing warnings and 0 errors. Expected React console diagnostics remain in error-path tests, and one existing Leaflet `act(...)` warning remains.
- Next step: commit and publish this work unit.
