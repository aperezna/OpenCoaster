import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { ParkDetailScreen } from '../ParkDetailScreen';
import { FixtureParkDiscoveryProvider } from '../../../data/providers/ParkDiscoveryProvider';
import { ParkDiscoveryContextProvider } from '../../../data/providers/ParkDiscoveryProviderContext';
import type { ParkSummary } from '../../../data/models/ParkSummary';

const mockUseRoute = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: () => mockUseRoute(),
  useNavigation: () => ({ navigate: mockNavigate }),
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

  it('should show skeleton while loading and hide it after data loads', async () => {
    renderWithProviders();
    // Skeleton is visible initially while loading
    expect(screen.getByTestId('park-detail-skeleton')).toBeOnTheScreen();

    await waitFor(() => {
      expect(screen.getByTestId('park-photo')).toBeTruthy();
    });
    // Skeleton should be gone once data is loaded
    expect(screen.queryByTestId('park-detail-skeleton')).toBeNull();
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

  it('should show "Parque no encontrado" for unknown parkId', async () => {
    mockUseRoute.mockReturnValue({
      key: 'Parques',
      name: 'Parques',
      params: { parkId: 'non-existent-park' },
    });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('parkDetail.notFound')).toBeTruthy();
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
    expect(screen.getByText('attractions.title')).toBeTruthy();
  });

  it('should have a default parkId when none is provided', async () => {
    mockUseRoute.mockReturnValue({
      key: 'Parques',
      name: 'Parques',
      params: {},
    });
    // When no parkId is in route params, it falls back to DEFAULT_PARK_ID
    // (the real default is a GUID, which fixtures don't know, so it shows error state)
    // This test verifies the fallback chain works without crashing
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('parkDetail.notFound')).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Itinerary integration tests
// ---------------------------------------------------------------------------

let mockUseItineraries = {
  itineraries: [] as Array<{
    id: string;
    parkId: string;
    parkName: string;
    date?: string;
    items: Array<{ id: string; attractionId: string; name: string; order: number }>;
    createdAt: string;
    updatedAt: string;
  }>,
  isLoading: false,
  createItinerary: jest.fn(),
  deleteItinerary: jest.fn(),
  updateDate: jest.fn(),
  addAttraction: jest.fn(),
  removeAttraction: jest.fn(),
  moveItemUp: jest.fn(),
  moveItemDown: jest.fn(),
  isAttractionInItinerary: (_id: string) => false,
};

jest.mock('../../visit-planner/useItineraries', () => ({
  useItineraries: () => mockUseItineraries,
}));

describe('ParkDetailScreen — Plan Visit CTA', () => {
  beforeEach(() => {
    mockUseRoute.mockReturnValue({
      key: 'Parques',
      name: 'Parques',
      params: { parkId: 'magic-kingdom' },
    });
    mockNavigate.mockClear();
    mockUseItineraries = {
      itineraries: [],
      isLoading: false,
      createItinerary: jest.fn(),
      deleteItinerary: jest.fn(),
      updateDate: jest.fn(),
      addAttraction: jest.fn(),
      removeAttraction: jest.fn(),
      moveItemUp: jest.fn(),
      moveItemDown: jest.fn(),
      isAttractionInItinerary: () => false,
    };
  });

  it('should render a "Plan visit" button', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('plan-visit-button')).toBeTruthy();
    });
  });

  it('should navigate to VisitPlanner with parkId and parkName when "Plan visit" is pressed', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('plan-visit-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('plan-visit-button'));
    expect(mockNavigate).toHaveBeenCalledWith('VisitPlanner', {
      parkId: 'magic-kingdom',
      parkName: 'Magic Kingdom',
    });
  });

  it('should show "Add to itinerary" button on each attraction card', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('attraction-list')).toBeTruthy();
    });

    // Each Magic Kingdom attraction should have an add-to-itinerary button
    const addButtons = screen.getAllByTestId(/^add-to-itinerary-/);
    expect(addButtons.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Share button tests
// ---------------------------------------------------------------------------

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  return {
    ...rn,
    Share: {
      share: jest.fn().mockImplementation(() => Promise.resolve()),
    },
  };
});

function getMockShare(): jest.Mock {
  const RN = jest.requireMock('react-native');
  return RN.Share.share as jest.Mock;
}

describe('ParkDetailScreen — share park', () => {
  beforeEach(() => {
    mockUseRoute.mockReturnValue({
      key: 'Parques',
      name: 'Parques',
      params: { parkId: 'magic-kingdom' },
    });
    getMockShare().mockReset();
    getMockShare().mockImplementation(() => Promise.resolve());
  });

  it('should render a share button', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('share-button')).toBeTruthy();
    });
  });

  it('should call Share.share with translated share title and maps URL', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('share-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('share-button'));

    const mockShare = getMockShare();
    expect(mockShare).toHaveBeenCalledTimes(1);
    const message = mockShare.mock.calls[0][0]?.message ?? '';
    // Uses t() for the share title (mock returns key name)
    expect(message).toContain('parkDetail.shareTitle');
    // Maps URL is still included
    expect(message).toContain('www.google.com/maps/dir/');
  });

  it('should use shareTitleNoLocation when park has no city/country', async () => {
    mockUseRoute.mockReturnValue({
      key: 'Parques',
      name: 'Parques',
      params: { parkId: 'no-location-park' },
    });

    const provider = new FixtureParkDiscoveryProvider();
    const originalGetParkById = provider.getParkById.bind(provider);
    jest.spyOn(provider, 'getParkById').mockImplementation(async (id: string) => {
      if (id === 'no-location-park') {
        return {
          id: 'no-location-park',
          name: 'Test Park No Location',
          city: '',
          country: '',
          latitude: 51.6503,
          longitude: 5.0485,
          timezone: 'Europe/Amsterdam',
        } as ParkSummary;
      }
      return originalGetParkById(id);
    });

    renderWithProviders(provider);
    await waitFor(() => {
      expect(screen.getByTestId('share-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('share-button'));

    const mockShare = getMockShare();
    expect(mockShare).toHaveBeenCalledTimes(1);
    const message = mockShare.mock.calls[0][0]?.message ?? '';
    // Uses the no-location key from t() (mock returns key name)
    expect(message).toContain('parkDetail.shareTitleNoLocation');
    // Does NOT have location separator
    expect(message).not.toContain('·');
    // Maps URL IS still included
    expect(message).toContain('www.google.com/maps/dir/');
  });

  it('should handle Share.share rejection gracefully', async () => {
    getMockShare().mockRejectedValueOnce(new Error('Share cancelled'));

    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('share-button')).toBeTruthy();
    });

    // Should not throw
    expect(() => fireEvent.press(screen.getByTestId('share-button'))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Favorites toggle tests
// ---------------------------------------------------------------------------

let mockUseFavorites = {
  favorites: [] as Array<{ parkId: string; parkName: string; addedAt: string }>,
  isFavorite: (_id: string) => false,
  toggleFavorite: (_id: string, _name: string) => {},
};

jest.mock('../../favorites/useFavorites', () => ({
  useFavorites: () => mockUseFavorites,
}));

describe('ParkDetailScreen — favorites toggle', () => {
  beforeEach(() => {
    mockUseRoute.mockReturnValue({
      key: 'Parques',
      name: 'Parques',
      params: { parkId: 'magic-kingdom' },
    });
    mockUseFavorites = {
      favorites: [],
      isFavorite: () => false,
      toggleFavorite: jest.fn(),
    };
  });

  it('should render a favorite toggle button', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('favorite-toggle')).toBeTruthy();
    });
  });

  it('should show filled star when park is favorited', async () => {
    mockUseFavorites.isFavorite = (id: string) => id === 'magic-kingdom';
    mockUseFavorites.favorites = [
      { parkId: 'magic-kingdom', parkName: 'Magic Kingdom', addedAt: '2025-01-01T00:00:00Z' },
    ];

    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('favorite-toggle-filled')).toBeTruthy();
    });
  });

  it('should show outline star when park is not favorited', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('favorite-toggle-outline')).toBeTruthy();
    });
  });

  it('should call toggleFavorite when pressed', async () => {
    const toggleFn = jest.fn();
    mockUseFavorites.toggleFavorite = toggleFn;

    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('favorite-toggle')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('favorite-toggle'));
    expect(toggleFn).toHaveBeenCalledWith('magic-kingdom', 'Magic Kingdom');
  });
});
