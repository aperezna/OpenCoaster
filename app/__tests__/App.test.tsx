import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../../App';
import { SyncPromise } from '../../test-utils/syncThenable';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Replace PersistQueryClientProvider with a plain QueryClientProvider
// to eliminate act warnings from its async persistence internals.
jest.mock('@tanstack/react-query-persist-client', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    PersistQueryClientProvider: actual.QueryClientProvider,
  };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('App — Onboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render main app (discovery) when onboarding has been seen', () => {
    mockGetItem.mockImplementation(() => SyncPromise.resolve('true') as any);

    render(<App />);

    expect(screen.getByTestId('discovery-screen')).toBeTruthy();
  });

  it('should show onboarding carousel when user has not seen it', () => {
    mockGetItem.mockImplementation(() => SyncPromise.resolve(null) as any);

    render(<App />);

    expect(screen.getByTestId('onboarding-carousel')).toBeTruthy();
  });

  it('should show loading state while checking onboarding status', () => {
    mockGetItem.mockReturnValue(new Promise(() => {}));

    render(<App />);

    expect(screen.getByTestId('app-loading')).toBeTruthy();
  });

  it('should export App as default', () => {
    expect(App).toBeDefined();
  });
});
