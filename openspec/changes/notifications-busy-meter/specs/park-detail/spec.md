# Delta for park-detail

## ADDED Requirements

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
