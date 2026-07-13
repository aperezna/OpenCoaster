# Delta for park-detail

## ADDED Requirements

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
