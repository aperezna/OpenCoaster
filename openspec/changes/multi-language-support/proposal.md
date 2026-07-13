# Proposal: Internationalization (English + Spanish)

## Intent

Zero i18n infrastructure exists. ~68 strings across ~18 components are hardcoded in mixed Spanish/English. The profile "Idioma → Español" label is non-functional — users cannot switch language; developers lack a consistent pattern for adding strings.

## Scope

### In Scope

- i18next + react-i18next with `en.json` / `es.json` locale files
- String extraction ~18 components → `t('key')` calls
- Language switcher in profile (picker + AsyncStorage persistence)
- Runtime language switch without app restart
- Locale-aware formatting (dates, distances, plurals)
- Translatable LeafletMap WebView HTML
- Tab labels decoupled from route names (localized)

### Out of Scope

- RTL layout, auto-detect from device locale, i18n of testIDs/accessibility labels, languages beyond EN/ES

## Capabilities

### New Capabilities

- `i18n-infrastructure`: i18next init, en/es locale files, `useLanguage` hook with AsyncStorage persistence, pluralization, locale-aware date/distance formatters

### Modified Capabilities

- `profile-screen`: language selector becomes functional — picker sets i18next language and persists to AsyncStorage

## Approach

1. Install i18next + react-i18next, init with en/es resources. 2. Wrap app in `I18nextProvider`. 3. `useLanguage` hook (get/set, AsyncStorage). 4. Extract ~68 strings → `t('key')`. 5. Locale-aware formatters. 6. Profile picker. 7. LeafletMap locale via WebView data. 8. Tab labels → `t()`.

## Affected Areas

| Area                                     | Impact   | Description                                           |
| ---------------------------------------- | -------- | ----------------------------------------------------- |
| `src/i18n/`                              | New      | Locale files, i18next config, useLanguage, formatters |
| `src/features/profile/ProfileScreen.tsx` | Modified | Language picker replaces static "Idioma" row          |
| `src/navigation/RootNavigator.tsx`       | Modified | Tab labels use `t()` instead of route names           |
| `src/components/` + `src/features/*/`    | Modified | ~18 components get `t()` calls                        |
| `src/components/LeafletMap.tsx`          | Modified | HTML locale strings via WebView URL/data              |
| `App.tsx`                                | Modified | `I18nextProvider` wrapper                             |

## Risks

| Risk                        | Likelihood | Mitigation                                             |
| --------------------------- | ---------- | ------------------------------------------------------ |
| Missed hardcoded strings    | Medium     | Grep + code review pass for escaped strings            |
| WebView string sync breaks  | Low        | Keep HTML template as i18n resource, inject pre-render |
| Runtime switch not reactive | Low        | react-i18next useTranslation is reactive by default    |

## Rollback Plan

`git revert` — no data migration. Restore previous `package.json` dependencies.

## Dependencies

- i18next ^24.0, react-i18next ^15.0

## Success Criteria

- [ ] EN locale renders all ~68 strings in English, ES in Spanish
- [ ] Language switch updates all visible strings immediately (no restart)
- [ ] Language choice persists across app relaunch
- [ ] Pluralization works: "1 attraction" / "N attractions" in both locales
- [ ] LeafletMap WebView shows translated action labels
- [ ] Tab bar labels update when language changes
- [ ] Grep for hardcoded display strings returns ~0 false positives
