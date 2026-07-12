# Delta for Onboarding

## ADDED Requirements

| ID  | Requirement              | Strength | Description                                                         |
| --- | ------------------------ | -------- | ------------------------------------------------------------------- |
| O1  | First-Launch Detection   | MUST     | Detect if onboarding was completed before mounting main app         |
| O2  | AsyncStorage Persistence | MUST     | Persist `hasSeenOnboarding: boolean` when onboarding completes      |
| O3  | Carousel Slides          | MUST     | Render 3–4 slides with title/body, "Skip" and "Get Started" buttons |

### Requirement O1: First-Launch Detection

The system MUST check `hasSeenOnboarding` from AsyncStorage before rendering the root navigator.

#### Scenario: First launch shows carousel

- GIVEN the app launches for the first time
- WHEN the root component renders
- THEN the onboarding carousel displays instead of the main app

#### Scenario: Subsequent launch skips carousel

- GIVEN the user completed onboarding on a previous launch
- WHEN the app launches again
- THEN the main app renders directly

### Requirement O2: AsyncStorage Persistence

The system MUST persist `hasSeenOnboarding` as `true` in AsyncStorage when the user completes or skips onboarding.

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

### Requirement O3: Carousel Slides

The system MUST render a horizontally paginated carousel of slides with "Skip" (intermediate slides) and "Get Started" (final slide) affordances.

#### Scenario: Skip button dismisses carousel

- GIVEN the onboarding carousel is displayed
- WHEN the user taps "Skip" on any intermediate slide
- THEN `hasSeenOnboarding` is set to `true`
- AND the main app renders

#### Scenario: All slides render with navigation

- GIVEN the onboarding carousel is displayed
- WHEN the user swipes left through all slides
- THEN each slide shows a title and body text
- AND the last slide shows "Get Started" instead of "Skip"
