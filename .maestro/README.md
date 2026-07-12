# Maestro E2E Tests — OpenCoaster

This directory contains [Maestro](https://maestro.mobile.dev/) end-to-end flows for the OpenCoaster app.

## Prerequisites

- [Maestro CLI](https://maestro.mobile.dev/getting-started/installing-maestro) installed
- An Android emulator or iOS simulator running
- Expo development server running (`npx expo start`)
- The Expo Go app installed on the simulator/emulator

## Running Flows

```bash
# Run all flows
maestro test .maestro/flows/

# Run a single flow
maestro test .maestro/flows/launch.yaml
maestro test .maestro/flows/search.yaml
maestro test .maestro/flows/park-detail.yaml

# Run flows with a specific app
maestro test --app-id host.exp.Exponent .maestro/flows/launch.yaml
```

## Flow Descriptions

| Flow               | What it verifies                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `launch.yaml`      | App launches, dismisses onboarding if present, renders discovery screen with search input |
| `search.yaml`      | Types a query in the search bar and verifies the input accepts text                       |
| `park-detail.yaml` | Navigates to the Parques tab, taps a park item, and opens the detail screen               |

## Test IDs

All Maestro flows use existing `testID` attributes from the app's components.
No production code changes are needed to support these flows.

## Troubleshooting

- **"Could not connect to the device"**: Make sure the emulator/simulator is running.
- **"Element not found"**: Verify the `testID` exists in the app code. Run `maestro inspector` to visually inspect the app hierarchy.
- **Onboarding appears unexpectedly**: The flows handle the onboarding carousel with `optional: true` fallbacks, but if you want to test without onboarding reset, omit `clearState: true` from the launch command.
