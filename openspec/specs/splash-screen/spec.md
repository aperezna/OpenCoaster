# Splash Screen Specification

## Purpose

Configure a native splash that stays visible until the app signals readiness, preventing a white flash on cold start.

## Requirements

### Requirement: Native Splash Configuration

The system MUST configure a native splash screen via `app.json` that stays visible until explicitly hidden.

#### Scenario: Splash shown on cold start

- GIVEN the app launches from cold start
- WHEN the native splash activates
- THEN the splash image fills the screen with the configured background color

#### Scenario: Splash hidden only after readiness

- GIVEN the splash screen is visible
- WHEN the app calls `SplashScreen.hideAsync()`
- THEN the splash fades out
- AND the first screen renders without white flash

### Requirement: Flicker Prevention on Fast Init

The system SHOULD keep the splash visible for at least 200ms after readiness to avoid flicker on fast initializations.

#### Scenario: Fast init delays hide

- GIVEN all initialization completes in under 200ms
- WHEN `SplashScreen.hideAsync()` is called
- THEN the splash remains visible at least 200ms before hiding

#### Scenario: Slow init hides immediately

- GIVEN initialization takes longer than 200ms
- WHEN initialization completes
- THEN the splash hides immediately upon `SplashScreen.hideAsync()`
