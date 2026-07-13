# Delta for Sentry Crash Reporting

## ADDED Requirements

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
