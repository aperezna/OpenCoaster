# Delta for Sentry Crash Reporting

## ADDED Requirements

| ID  | Requirement           | Strength | Description                                                     |
| --- | --------------------- | -------- | --------------------------------------------------------------- |
| S1  | Sentry Initialization | MUST     | Initialize `@sentry/react-native` with DSN before app renders   |
| S2  | DSN Not in Source     | MUST     | DSN provided via `EXPO_PUBLIC_SENTRY_DSN`, never in source code |
| S3  | Error Reporting       | MUST     | Report unhandled JS errors to Sentry when initialized           |

### Requirement S1: Sentry Initialization

The system MUST call `Sentry.init()` with the DSN and wrap the app root in `Sentry.wrap()`.

#### Scenario: Normal init with DSN

- GIVEN a valid Sentry DSN is set via `EXPO_PUBLIC_SENTRY_DSN` in environment config
- WHEN the app starts
- THEN `Sentry.init()` is called with the DSN
- AND the app root is wrapped in `Sentry.wrap()`

#### Scenario: Missing DSN skips init gracefully

- GIVEN no Sentry DSN is configured
- WHEN the app starts
- THEN `Sentry.init()` MUST NOT be called
- AND the app boots normally without errors

### Requirement S2: DSN Not in Source

The DSN MUST be loaded from environment config at build time and MUST NOT appear in tracked source files.

#### Scenario: DSN absent from repo

- GIVEN the repository source code
- WHEN searching for the DSN value string
- THEN the DSN is not found in any `.ts`, `.tsx`, or `.js` file

### Requirement S3: Error Reporting

The system MUST capture unhandled JavaScript exceptions and send them to Sentry when initialized.

#### Scenario: Unhandled error captured

- GIVEN Sentry is initialized with a DSN
- WHEN an unhandled JS error occurs at runtime
- THEN Sentry captures the exception with a full stack trace
