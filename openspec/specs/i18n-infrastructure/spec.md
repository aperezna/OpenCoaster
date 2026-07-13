# i18n Infrastructure Specification

## Purpose

Provide internationalization infrastructure for OpenCoaster: locale loading, runtime language switching, AsyncStorage persistence, and locale-aware formatting for English and Spanish.

## Requirements

### Requirement: i18next Initialization

On startup, the system MUST initialize i18next with `en` and `es` JSON locale resources and wire `react-i18next` for reactive component updates. The default language MUST be `en`. If a persisted preference exists under `@opencoaster/language`, it MUST be used as the initial language.

#### Scenario: Loads locales on first launch

- GIVEN the app starts for the first time
- WHEN i18next initializes
- THEN `en` and `es` namespaces are registered
- AND the active language is `en`

#### Scenario: Restores persisted language

- GIVEN AsyncStorage contains `@opencoaster/language` = `"es"`
- WHEN the app launches
- THEN the initial language is `es`

### Requirement: Locale File Format

Locale files MUST be flat JSON under `src/i18n/locales/{lang}.json` using `section.key` dot-notation keys. The `es.json` file MUST be a complete translation of `en.json` — missing keys MUST fall back to English via i18next's fallback mechanism.

#### Scenario: Fallback for missing translations

- GIVEN the active language is `es`
- WHEN `t('untranslated.key')` is called
- THEN i18next returns the English value

### Requirement: useLanguage Hook

The system MUST export a `useLanguage()` hook returning `{ language, setLanguage, isReady }`. `setLanguage(lang)` MUST call `i18next.changeLanguage(lang)` and persist the choice to AsyncStorage key `@opencoaster/language`. Only `"en"` and `"es"` are valid values; unknown values MUST be ignored.

#### Scenario: Language change persists

- GIVEN the current language is `en`
- WHEN `setLanguage('es')` is called
- THEN i18next changes to `es`
- AND AsyncStorage stores `@opencoaster/language` = `"es"`

#### Scenario: Invalid language rejected

- GIVEN the current language is `en`
- WHEN `setLanguage('fr')` is called
- THEN language stays `en`
- AND nothing is persisted to AsyncStorage

### Requirement: Runtime Reactive Switching

Language changes MUST propagate reactively to all mounted components via `useTranslation()`. No re-mount or navigation MUST be required.

#### Scenario: All visible strings update

- GIVEN a screen renders a string via `t('common.loading')`
- WHEN language changes to `es`
- THEN the displayed text updates to the Spanish translation immediately

### Requirement: Locale-Aware Formatters

The system MUST export `formatDate(date, locale)`, `formatDistance(meters, locale)`, and `formatWait(minutes, locale)` helpers. Pluralization MUST follow locale-specific rules: `formatWait(1, 'en')` returns `"1 min"`, `formatWait(5, 'en')` returns `"5 mins"`. Formatters MUST use the active i18next language when no locale is passed.

#### Scenario: Distance formatting

- GIVEN the active language is `en`
- WHEN `formatDistance(1500)` is called
- THEN it returns a human-readable distance string

#### Scenario: Wait time pluralization

- GIVEN the active language is `en`
- WHEN `formatWait(1)` and `formatWait(5)` are called
- THEN `formatWait(1)` returns `"1 min"`
- AND `formatWait(5)` returns `"5 mins"`

### Requirement: WebView Locale Injection

The LeafletMap WebView HTML template MUST accept a locale parameter. Before rendering, the app MUST inject translated strings (action labels, tooltips) into the HTML via a serialized JSON payload in the URL or postMessage.

#### Scenario: WebView strings match active locale

- GIVEN the active language is `es`
- WHEN LeafletMap renders
- THEN the WebView HTML contains Spanish labels for all interactive UI strings
