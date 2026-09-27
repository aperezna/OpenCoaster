import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient } from '@tanstack/react-query';
import { preventAutoHideAsync, hideAsync } from 'expo-splash-screen';
import { AppInner } from '../../../App';

// The splash tests verify app readiness, not discovery data loading. Keep the
// navigator shallow so the real discovery query cannot open network handles.
jest.mock('../../navigation/RootNavigator', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    RootNavigator: () => ReactActual.createElement(View, { testID: 'discovery-screen' }),
  };
});

// ---------------------------------------------------------------------------
// Mock the persist layer: the real PersistQueryClientProvider + AsyncStorage
// persister schedule internal debounce timers that keep Jest's event loop
// open. The splash tests only exercise render timing, not cache persistence.
// ---------------------------------------------------------------------------

jest.mock('@tanstack/react-query-persist-client', () => {
  const ReactActual = require('react');
  const { QueryClientProvider } = require('@tanstack/react-query');
  return {
    PersistQueryClientProvider: ({
      client,
      children,
    }: {
      client: QueryClient;
      children: React.ReactNode;
    }) => ReactActual.createElement(QueryClientProvider, { client }, children),
  };
});

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
// Mock useSearchHistory — the real hook reads AsyncStorage via a promise that
// settles after act() and would warn when the real DiscoveryScreen mounts.
// The splash tests only assert render timing, not search history.
// ---------------------------------------------------------------------------

jest.mock('../../features/discovery/useSearchHistory', () => ({
  useSearchHistory: () => ({
    queries: [] as string[],
    add: jest.fn(),
    clear: jest.fn(),
    isLoading: false,
  }),
}));

// ---------------------------------------------------------------------------
// Test QueryClient — gcTime: 0 so React Query schedules no real GC timer that
// would keep Jest's event loop open after the suite finishes.
// ---------------------------------------------------------------------------

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

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

    const { unmount } = render(<AppInner queryClient={createTestQueryClient()} />);

    await waitFor(() => {
      expect(screen.getByTestId('discovery-screen')).toBeTruthy();
    });

    expect(hideAsync).toHaveBeenCalled();
    unmount();
  });

  it('still hides splash when onboarding is unseen', async () => {
    mockGetItem.mockResolvedValue(null);

    const { unmount } = render(<AppInner queryClient={createTestQueryClient()} />);

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-carousel')).toBeTruthy();
    });

    expect(hideAsync).toHaveBeenCalled();
    unmount();
  });

  it('does not call hideAsync while app is still loading', () => {
    // Control the storage promise so the app stays in loading while we assert,
    // then resolve it and unmount to let Jest exit cleanly.
    let resolveLoading!: (value: string | null) => void;
    mockGetItem.mockReturnValue(
      new Promise((resolve) => {
        resolveLoading = resolve;
      }),
    );

    const { unmount } = render(<AppInner queryClient={createTestQueryClient()} />);

    expect(screen.getByTestId('app-loading')).toBeTruthy();

    // Since the promise is still pending, hideAsync should NOT be called yet
    expect(hideAsync).not.toHaveBeenCalled();

    // Settle the pending storage read and clean up the mounted tree
    resolveLoading('true');
    unmount();
  });
});
