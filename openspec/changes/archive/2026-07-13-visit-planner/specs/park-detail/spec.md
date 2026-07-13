# Delta for park-detail

## ADDED Requirements

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
