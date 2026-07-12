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
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
  }),
}));

let mockFavorites: Array<{ parkId: string; parkName: string; addedAt: string }> = [];
let mockIsFavorite: (id: string) => boolean = () => false;
let mockToggleFavorite: (id: string, name: string) => void = () => {};
const mockClearFavorites = jest.fn();

jest.mock('../../favorites/useFavorites', () => ({
  useFavorites: () => ({
    favorites: mockFavorites,
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
    clearFavorites: mockClearFavorites,
    isLoading: false,
  }),
}));

const mockAsyncStorageRemoveItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: (key: unknown) => mockAsyncStorageRemoveItem(key),
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

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFavorites = [];
    mockIsFavorite = () => false;
    mockToggleFavorite = () => {};
  });

  // ----- Loading state -----

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

  // ----- Profile info -----

  it('should render profile info (username, email, member since)', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('profile-username')).toBeTruthy();
      expect(screen.getByText('coasterfan')).toBeTruthy();
      expect(screen.getByText('coasterfan@example.com')).toBeTruthy();
      expect(screen.getByText('2025-06-01')).toBeTruthy();
    });
  });

  // ----- Favorites -----

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

  // ----- Logout -----

  it('should clear favorites, reset onboarding, and navigate to Mapa on logout', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('logout-button'));

    await waitFor(() => {
      expect(mockClearFavorites).toHaveBeenCalledTimes(1);
      expect(mockAsyncStorageRemoveItem).toHaveBeenCalledWith('opencoaster:hasSeenOnboarding');
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Mapa' }],
      });
    });
  });

  // ----- Dark mode toggle -----

  it('should render the dark mode toggle in the preferences section', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('dark-mode-toggle')).toBeTruthy();
    });

    // Preferences section is visible
    expect(screen.getByText('Preferencias')).toBeTruthy();
    expect(screen.getByText('Modo oscuro')).toBeTruthy();
    expect(screen.getByText('Idioma')).toBeTruthy();
    expect(screen.getByText('Español')).toBeTruthy();
  });
});
