# Spanish Translation Completeness

## Objective

Make the Spanish locale complete and ensure all visible OpenCoaster UI text follows the active language, with particular attention to the visit planner.

## Problem

Several screens request translation namespaces that are absent from both locale dictionaries, while other visible strings bypass i18n or ignore the active locale.

## Scope

- Align visit-planner translation keys and add a locale contract test.
- Localize remaining hardcoded UI strings and missing attraction keys.
- Localize Leaflet WebView fallback, controls, and attribution.
- Make formatters honor the active locale and explicit overrides.
- Complete Spanish onboarding copy and preserve existing behavior.

## Constraints

- Preserve all existing features and zero-cost integrations.
- Technical artifacts and source strings remain in English unless they are user-facing Spanish translations.
- Use strict TDD when adding or changing behavior; run focused checks before each work unit.
- Keep tests and implementation in the same work-unit commit.

## Authorized Scope

- `src/i18n/**`
- `src/features/visit-planner/**`
- `src/features/profile/ProfileScreen.tsx`
- `src/features/park-details/AttractionList.tsx`
- `src/features/discovery/LeafletMap.tsx`
- `src/features/discovery/DiscoveryScreen.tsx`
- `src/navigation/RootNavigator.tsx`
- Related tests and locale dictionaries only.

## Tasks

- [x] I18N-1: Align locale dictionaries with all current visit-planner and attraction translation keys; add parity/regression coverage.
- [x] I18N-2: Remove remaining hardcoded visible strings from planner, profile, attraction, and related screens.
- [x] I18N-3: Pass active-language strings through LeafletMap and localize its fallback/HTML output.
- [x] I18N-4: Make date, distance, and wait formatters honor active language and explicit locale overrides.
- [x] I18N-5: Complete Spanish onboarding copy and audit remaining locale values for untranslated English.

## Acceptance Criteria

- The complete visit-planner flow renders Spanish text without raw translation keys.
- Static production `t()` keys exist in both `en.json` and `es.json`.
- No user-visible English fallback remains when Spanish is active in the audited screens.
- Formatters use Spanish by default when the active language is Spanish and preserve explicit locale overrides.
- Focused and full repository checks pass without introducing new errors.

## Checks

- Focused i18n and visit-planner Jest suites.
- `npm run typecheck`
- `npm run format:check`
- `npm run lint`
- `npm test -- --runInBand --detectOpenHandles`

## Progress

- Route: delegated direct implementation, because the audit spans multiple non-trivial files.
- Current step: I18N-5 implemented and verified with focused i18n/onboarding Jest coverage, typecheck, and format checks.
- Next step: none.
