import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { preventAutoHideAsync, hideAsync } from 'expo-splash-screen';

// ---------------------------------------------------------------------------
// Mock for AsyncStorage (needed by useHasSeenOnboarding)
// ---------------------------------------------------------------------------

const mockGetItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// ---------------------------------------------------------------------------
// Module-level import test — runs before any clearAllMocks
// ---------------------------------------------------------------------------

describe('SplashScreen — module init', () => {
  it('calls preventAutoHideAsync when App module loads', () => {
    // Import App AFTER the mocks are in place (jest.mock is hoisted,
    // but dynamic import ensures clearAllMocks hasn't reset it yet)
    const App = require('../../../App').default;
    expect(App).toBeDefined();
    expect(preventAutoHideAsync).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Runtime tests — fresh mocks each time
// ---------------------------------------------------------------------------

describe('SplashScreen — runtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls hideAsync after app is ready (onboarding resolved)', async () => {
    mockGetItem.mockResolvedValue('true');

    const App = require('../../../App').default;
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('discovery-screen')).toBeTruthy();
    });

    expect(hideAsync).toHaveBeenCalled();
  });

  it('still hides splash when onboarding is unseen', async () => {
    mockGetItem.mockResolvedValue(null);

    const App = require('../../../App').default;
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-carousel')).toBeTruthy();
    });

    expect(hideAsync).toHaveBeenCalled();
  });

  it('does not call hideAsync while app is still loading', () => {
    mockGetItem.mockReturnValue(new Promise(() => {}));

    const App = require('../../../App').default;
    render(<App />);

    expect(screen.getByTestId('app-loading')).toBeTruthy();

    // Since the promise never resolves, hideAsync should NOT be called yet
    expect(hideAsync).not.toHaveBeenCalled();
  });
});
