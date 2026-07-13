# Sentry Crash Reporting Specification

## Purpose

Configure Sentry for production crash visibility with DSN loaded from environment config.

## Requirements

### Requirement: Sentry Initialization

The system MUST initialize `@sentry/react-native` with the DSN before the app renders.

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

### Requirement: DSN Not in Source

The DSN MUST be provided via environment config (`EXPO_PUBLIC_SENTRY_DSN`) and MUST NOT appear in source code.

#### Scenario: DSN absent from repo

- GIVEN the repository source code
- WHEN searching for the DSN value string
- THEN the DSN is not found in any `.ts`, `.tsx`, or `.js` file

### Requirement: Error Reporting

The system MUST report unhandled JavaScript errors to Sentry when initialized.

#### Scenario: Unhandled error captured

- GIVEN Sentry is initialized with a DSN
- WHEN an unhandled JS error occurs at runtime
- THEN Sentry captures the exception with stack trace

### Requirement: Error Boundary Wrapping

The system MUST wrap the app root in `Sentry.wrap()` to capture React render errors as managed error boundary exceptions.

#### Scenario: Render error captured by boundary

- GIVEN Sentry is initialized with a valid DSN
- WHEN a React component throws during render
- THEN the Sentry error boundary captures the error
- AND the exception payload includes the component stack trace

#### Scenario: Boundary does not intercept non-render errors

- GIVEN Sentry is initialized with a valid DSN
- WHEN an unhandled error occurs outside React rendering (e.g., timer callback)
- THEN the error boundary does NOT interfere with the global error handler
- AND Sentry still captures the exception
