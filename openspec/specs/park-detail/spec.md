# Park Detail Screen Specification

## Purpose

Show park information and provide a favorite toggle (star) button.

## Requirements

### Requirement: Favorite Toggle

The ParkDetailScreen SHOULD render a favorite toggle button. The button MUST call `toggleFavorite` from `useFavorites` with the current park's ID and name when pressed. The button's visual state SHOULD reflect whether the park is favorited (filled star when favorited, outline when not).

#### Scenario: Toggle on adds favorite

- GIVEN the current park is not favorited
- WHEN the user presses the toggle button
- THEN the park appears in `useFavorites().favorites`
- AND the toggle visually changes to filled/active state

#### Scenario: Toggle off removes favorite

- GIVEN the current park is favorited
- WHEN the user presses the toggle button
- THEN the park is removed from `useFavorites().favorites`
- AND the toggle visually changes to outline/inactive state

#### Scenario: Visual indicator reflects state on load

- GIVEN the current park is favorited
- WHEN ParkDetailScreen renders with the park's ID
- THEN the toggle button renders in the filled/active state

### Requirement: Plan Visit CTA

The ParkDetailScreen SHOULD display a "Plan visit" call-to-action button. Tapping it MUST navigate to the Visit Planner create screen with the current park pre-selected.

#### Scenario: Navigate to planner with park pre-selected

- GIVEN the user is viewing a park detail
- WHEN the user taps "Plan visit"
- THEN the app navigates to the Visit Planner create screen
- AND the current park is pre-selected as the itinerary park

### Requirement: Add to Itinerary Button

Each attraction card on the park detail screen SHOULD display an "Add to itinerary" button. If the attraction is already in an itinerary, the card MUST show an inline indicator (e.g., checkmark or "Added").

#### Scenario: Add to existing itinerary

- GIVEN the park detail screen displays attraction cards
- AND the user has at least one itinerary
- WHEN the user taps "Add to itinerary" on an attraction
- THEN a picker shows available itineraries
- AND the attraction is added to the selected itinerary
- AND the card shows an "Added" indicator

#### Scenario: Indicator on reload

- GIVEN the user has an itinerary containing attraction A
- WHEN the park detail screen renders attraction A
- THEN the attraction card displays an "Added" indicator

#### Scenario: No itineraries fallback

- GIVEN the park detail screen displays attraction cards
- AND the user has no itineraries
- WHEN the user taps "Add to itinerary" on an attraction
- THEN the system navigates to the create itinerary flow

### Requirement: Share Park

The ParkDetailScreen SHOULD render a share button. Pressing it MUST call `Share.share()` with the park name, location, and a maps URL.

#### Scenario: Share park details

- GIVEN the user is viewing a park detail
- WHEN the user taps the share button
- THEN the native share sheet opens
- AND the message contains the park name, location, and a maps URL

#### Scenario: Share with missing location

- GIVEN the current park has no location data
- WHEN the user taps the share button
- THEN the share sheet opens with the park name and maps URL
- AND the location portion is omitted from the message

### Requirement: Busy Meter

The ParkDetailScreen MUST display a busy meter badge in the header row showing the park's current crowd level. The level MUST be computed from the average wait time of OPERATING attractions: avg < 15 min → Low (🟢), 15–30 min → Moderate (🟡), > 30 min → Busy (🔥). The badge SHOULD appear next to the park name or hours section.

#### Scenario: Shows Low for low average wait

- GIVEN park attractions have an average wait time of 8 min
- WHEN ParkDetailScreen renders the header
- THEN the busy meter shows the Low level

#### Scenario: Shows Busy for high average wait

- GIVEN park attractions have an average wait time of 45 min
- WHEN ParkDetailScreen renders the header
- THEN the busy meter shows the Busy level

### Requirement: Stale Data Indicator

When the attractions data timestamp is more than 15 minutes old, the busy meter MUST display a "cached X min ago" indicator next to the badge. The indicator MUST NOT appear when data is 15 min or fresher.

#### Scenario: Shows staleness for old data

- GIVEN attractions data was fetched 22 minutes ago
- WHEN the busy meter renders
- THEN a "cached 22 min ago" indicator is visible

#### Scenario: Hides for fresh data

- GIVEN attractions data was fetched 5 minutes ago
- WHEN the busy meter renders
- THEN no staleness indicator is shown

### Requirement: Long-Press for Notification Threshold

Each attraction row in AttractionList MUST respond to a long-press gesture by opening a modal to set a wait-time notification threshold. The modal MUST contain a slider (range 5–120 min) and a confirm button. On confirm, the preference MUST persist via `useNotificationPreferences().setThreshold`. Attraction rows with an active threshold SHOULD display a bell indicator.

#### Scenario: Set threshold via long-press

- GIVEN the user is viewing an operating attraction row
- WHEN the user long-presses the attraction
- THEN a threshold slider modal opens (5–120 min range)
- AND confirming persists the threshold

#### Scenario: Bell indicator shows active threshold

- GIVEN the user set a 30 min threshold for attraction A
- WHEN the attraction list renders attraction A
- THEN the row displays a bell indicator
