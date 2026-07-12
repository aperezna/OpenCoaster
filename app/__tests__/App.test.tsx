import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import App from '../../App';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('App — Onboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render main app (discovery) when onboarding has been seen', async () => {
    mockGetItem.mockResolvedValue('true');

    await render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('discovery-screen')).toBeTruthy();
    });
  });

  it('should show onboarding carousel when user has not seen it', async () => {
    mockGetItem.mockResolvedValue(null);

    await render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-carousel')).toBeTruthy();
    });
  });

  it('should show loading state while checking onboarding status', async () => {
    mockGetItem.mockReturnValue(new Promise(() => {}));

    await render(<App />);

    expect(screen.getByTestId('app-loading')).toBeTruthy();
  });

  it('should export App as default', () => {
    expect(App).toBeDefined();
  });
});
