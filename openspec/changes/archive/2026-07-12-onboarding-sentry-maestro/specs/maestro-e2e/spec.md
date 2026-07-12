# Delta for Maestro E2E

## ADDED Requirements

| ID  | Requirement        | Strength | Description                                                        |
| --- | ------------------ | -------- | ------------------------------------------------------------------ |
| M1  | Launch Flow        | MUST     | Validate app launches and discovery screen renders                 |
| M2  | Search Flow        | MUST     | Validate text input filters search results                         |
| M3  | Detail Flow        | MUST     | Validate navigation from parks list to park detail                 |
| M4  | Flow File Location | MUST     | All Maestro flows under `.maestro/flows/` using `testID` selectors |

### Requirement M1: Launch Flow

The system MUST provide a Maestro flow at `.maestro/flows/launch.yaml` that validates the discovery screen renders after cold launch.

#### Scenario: App launches to discovery

- GIVEN the app is installed and launched via Maestro
- WHEN `maestro test .maestro/flows/launch.yaml` executes
- THEN the discovery screen (`testID: "discovery-screen"`) is visible
- AND the search input (`testID: "search-name-input"`) is visible

### Requirement M2: Search Flow

The system MUST provide a Maestro flow that validates text input filters visible results.

#### Scenario: Typing filters results

- GIVEN the discovery screen is displayed
- WHEN the user types in `search-name-input`
- THEN results matching `testID: "search-result-*"` update to show matching parks only

### Requirement M3: Detail Navigation Flow

The system MUST provide a Maestro flow that validates tap-to-detail navigation.

#### Scenario: Tap park opens detail

- GIVEN the parks list displays items (`testID: "park-item-*"`)
- WHEN the user taps a park item
- THEN the park detail screen (`testID: "park-detail-screen"`) is visible

### Requirement M4: Flow File Location

All Maestro flows MUST be stored under `.maestro/flows/` and MUST reference only existing `testID` attributes for element selectors.

#### Scenario: Flows in correct directory

- GIVEN the `.maestro/flows/` directory exists
- WHEN Maestro discovers flows
- THEN all YAML files under that directory are available for execution
