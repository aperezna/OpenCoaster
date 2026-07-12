import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FixtureParkDiscoveryProvider } from '../../../data/providers/ParkDiscoveryProvider';
import { ParkDiscoveryContextProvider } from '../../../data/providers/ParkDiscoveryProviderContext';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

let mockFavorites: Array<{ parkId: string; parkName: string; addedAt: string }> = [];
let mockIsFavorite: (id: string) => boolean = () => false;
let mockToggleFavorite: (id: string, name: string) => void = () => {};

jest.mock('../../favorites/useFavorites', () => ({
  useFavorites: () => ({
    favorites: mockFavorites,
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
    isLoading: false,
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function renderScreen() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ParkDiscoveryContextProvider provider={new FixtureParkDiscoveryProvider()}>
        <ProfileScreen />
      </ParkDiscoveryContextProvider>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProfileScreen — favorites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFavorites = [];
    mockIsFavorite = () => false;
    mockToggleFavorite = () => {};
  });

  it('should show skeleton while loading and hide it after profile loads', async () => {
    renderScreen();
    // Skeleton is visible while profile is being fetched
    expect(screen.getByTestId('profile-skeleton')).toBeOnTheScreen();

    await waitFor(() => {
      expect(screen.getByTestId('profile-username')).toBeTruthy();
    });
    // Skeleton should be gone once profile data is available
    expect(screen.queryByTestId('profile-skeleton')).toBeNull();
  });

  it('should show "No favorites yet" when there are no favorites', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('No favorites yet')).toBeTruthy();
    });
  });

  it('should render a list of favorited parks', async () => {
    mockFavorites = [
      { parkId: 'p1', parkName: 'Magic Kingdom', addedAt: '2025-01-01T00:00:00Z' },
      { parkId: 'p2', parkName: 'Disneyland Park', addedAt: '2025-01-02T00:00:00Z' },
      { parkId: 'p3', parkName: 'Efteling', addedAt: '2025-01-03T00:00:00Z' },
    ];

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeTruthy();
      expect(screen.getByText('Disneyland Park')).toBeTruthy();
      expect(screen.getByText('Efteling')).toBeTruthy();
    });
  });

  it('should navigate to park detail when a favorite is tapped', async () => {
    mockFavorites = [{ parkId: 'p1', parkName: 'Magic Kingdom', addedAt: '2025-01-01T00:00:00Z' }];

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Magic Kingdom'));
    expect(mockNavigate).toHaveBeenCalledWith('Parques', {
      screen: 'ParkDetail',
      params: { parkId: 'p1' },
    });
  });
});
