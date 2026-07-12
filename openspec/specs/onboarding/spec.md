# Onboarding Specification

## Purpose

Present a first-launch carousel introducing the app, then suppress it on subsequent launches.

## Requirements

### Requirement: First-Launch Detection

The system MUST detect whether the user has completed onboarding before mounting the main app.

#### Scenario: First launch shows carousel

- GIVEN the app launches for the first time
- WHEN the root component renders
- THEN the onboarding carousel is displayed instead of the main app

#### Scenario: Subsequent launch skips carousel

- GIVEN the user completed onboarding on a previous launch
- WHEN the app launches again
- THEN the main app renders directly without showing the carousel

### Requirement: AsyncStorage Persistence

The system MUST persist `hasSeenOnboarding: boolean` in AsyncStorage when onboarding completes.

#### Scenario: Completion persists flag

- GIVEN the user is viewing the final onboarding slide
- WHEN the user taps "Get Started"
- THEN `hasSeenOnboarding` is set to `true` in AsyncStorage
- AND the main app renders

#### Scenario: Corrupt stored value

- GIVEN the stored `hasSeenOnboarding` value is not a valid boolean
- WHEN the app reads AsyncStorage on launch
- THEN the system treats the user as unseen
- AND the onboarding carousel displays

### Requirement: Carousel Slides

The system MUST render 3-4 slides with title and body text, plus "Skip" and "Get Started" buttons.

#### Scenario: All slides render with navigation

- GIVEN the onboarding carousel is displayed
- WHEN the user swipes left
- THEN each slide shows a title and body text
- AND the last slide shows "Get Started" button

#### Scenario: Skip button dismisses carousel

- GIVEN the onboarding carousel is displayed
- WHEN the user taps "Skip"
- THEN `hasSeenOnboarding` is set to `true`
- AND the main app renders
