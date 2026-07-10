import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react-native';
import { ParkDetailScreen } from '../ParkDetailScreen';
import { FixtureParkDiscoveryProvider } from '../../../data/providers/ParkDiscoveryProvider';
import { ParkDiscoveryContextProvider } from '../../../data/providers/ParkDiscoveryProviderContext';

const mockUseRoute = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: () => mockUseRoute(),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function renderWithProviders(provider = new FixtureParkDiscoveryProvider()) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ParkDiscoveryContextProvider provider={provider}>
        <ParkDetailScreen />
      </ParkDiscoveryContextProvider>
    </QueryClientProvider>,
  );
}

describe('ParkDetailScreen', () => {
  beforeEach(() => {
    mockUseRoute.mockReturnValue({
      key: 'Parques',
      name: 'Parques',
      params: { parkId: 'magic-kingdom' },
    });
  });

  it('should show park name and city when park exists', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeTruthy();
    });
    expect(screen.getByText(/Orlando/)).toBeTruthy();
    expect(screen.getByText(/US/)).toBeTruthy();
  });

  it('should render a placeholder image when park has no photoUrl', async () => {
    mockUseRoute.mockReturnValue({
      key: 'Parques',
      name: 'Parques',
      params: { parkId: 'efteling' },
    });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('park-photo-placeholder')).toBeTruthy();
    });
  });

  it('should show park photo when park has photoUrl', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('park-photo')).toBeTruthy();
    });
  });

  it('should show "Park not found" for unknown parkId', async () => {
    mockUseRoute.mockReturnValue({
      key: 'Parques',
      name: 'Parques',
      params: { parkId: 'non-existent-park' },
    });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Park not found')).toBeTruthy();
    });
  });

  it('should show address and phone for park with contact info', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText(/1180 Seven Seas/)).toBeTruthy();
    });
    expect(screen.getByText(/1-407-939/)).toBeTruthy();
  });

  it('should render the directions button', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('directions-button')).toBeTruthy();
    });
  });

  it('should show weather card for park', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('weather-card')).toBeTruthy();
    });
  });

  it('should show hours card for park', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('hours-card')).toBeTruthy();
    });
  });

  it('should show attractions list for park', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('attraction-list')).toBeTruthy();
    });
    expect(screen.getByText('Atracciones')).toBeTruthy();
  });

  it('should have a default parkId when none is provided', async () => {
    mockUseRoute.mockReturnValue({
      key: 'Parques',
      name: 'Parques',
      params: {},
    });
    // When no parkId is in route params, it falls back to DEFAULT_PARK_ID
    // (the real default is a GUID, which fixtures don't know, so it shows "Park not found")
    // This test verifies the fallback chain works without crashing
    renderWithProviders();
    await waitFor(() => {
      expect(
        screen.getByText('Park not found'),
      ).toBeTruthy();
    });
  });
});
