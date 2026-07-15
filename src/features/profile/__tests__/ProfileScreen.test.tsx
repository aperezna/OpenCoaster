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

// ---------------------------------------------------------------------------
// useItineraries mock (for "My Itineraries" section)
// ---------------------------------------------------------------------------

let mockItineraries: Array<{
  id: string;
  parkId: string;
  parkName: string;
  date?: string;
  items: Array<{ id: string; attractionId: string; name: string }>;
}> = [];

jest.mock('../../visit-planner/useItineraries', () => ({
  useItineraries: () => ({
    itineraries: mockItineraries,
    isLoading: false,
  }),
}));

type MockMonitoredEntry = {
  parkId: string;
  attractionId: string;
  attractionName: string;
  thresholdMin: number;
};

let mockMonitoredEntries: MockMonitoredEntry[] = [];
const mockRemoveThreshold = jest.fn();

jest.mock('../../notifications/useNotificationPreferences', () => {
  const React = require('react');

  return {
    useNotificationPreferences: () => {
      const [entries, setEntries] = React.useState(mockMonitoredEntries);

      return {
        preferences: {},
        isLoading: false,
        setThreshold: jest.fn(),
        getMonitored: () => entries,
        removeThreshold: async (parkId: string, attractionId: string) => {
          mockRemoveThreshold(parkId, attractionId);
          setEntries((current: MockMonitoredEntry[]) =>
            current.filter(
              (entry: MockMonitoredEntry) =>
                !(entry.parkId === parkId && entry.attractionId === attractionId),
            ),
          );
        },
      };
    },
  };
});

// ---------------------------------------------------------------------------
// useLanguage mock
// ---------------------------------------------------------------------------

const mockSetLanguage = jest.fn();
let mockLanguage: 'en' | 'es' = 'en';

jest.mock('../../../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: mockLanguage,
    setLanguage: mockSetLanguage,
    isReady: true,
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
    mockItineraries = [];
    mockMonitoredEntries = [];
    mockIsFavorite = () => false;
    mockToggleFavorite = () => {};
    mockLanguage = 'en';
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

  it('should show empty state text when there are no favorites', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('profile.noFavorites')).toBeTruthy();
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

  // ----- Dark mode toggle & language picker -----

  it('should render the dark mode toggle and language picker row in the preferences section', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('dark-mode-toggle')).toBeTruthy();
    });

    // Preferences section is visible — t() mock returns key names
    expect(screen.getByText('profile.preferences')).toBeTruthy();
    expect(screen.getByText('profile.darkMode')).toBeTruthy();
    // Language label uses t('profile.language') which mock returns as key
    expect(screen.getByText('profile.language')).toBeTruthy();
    // Current language shown (default en → English) — modal also renders, so multiple
    expect(screen.getAllByText('English').length).toBeGreaterThanOrEqual(1);
  });

  it('should show language options modal when language row is tapped', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('language-picker-row')).toBeTruthy();
    });

    // Tap the language row to open the picker
    fireEvent.press(screen.getByTestId('language-picker-row'));

    // Both options are rendered
    expect(screen.getByTestId('lang-option-en')).toBeTruthy();
    expect(screen.getByTestId('lang-option-es')).toBeTruthy();
  });

  it('should call setLanguage with es when Español is selected from picker', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('language-picker-row')).toBeTruthy();
    });

    // Tap Español (find the option by testID regardless of modal visibility in test env)
    const esOption = screen.getByTestId('lang-option-es');
    fireEvent.press(esOption);

    expect(mockSetLanguage).toHaveBeenCalledWith('es');
  });

  it('should show Español as the current language when language is es', async () => {
    mockLanguage = 'es';

    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('setting-language-value')).toBeTruthy();
    });

    // Modal also renders both options, so Español appears multiple times
    expect(screen.getAllByText('Español').length).toBeGreaterThanOrEqual(1);
  });

  // ----- My Itineraries -----

  it('should show empty state when there are no itineraries', async () => {
    mockItineraries = [];

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('profile.noItineraries')).toBeTruthy();
    });
    // Section title is visible
    expect(screen.getByText('profile.itineraries')).toBeTruthy();
  });

  it('should render itineraries with name, date, and attraction count', async () => {
    mockItineraries = [
      {
        id: 'itin-1',
        parkId: 'pk1',
        parkName: 'Magic Kingdom',
        date: '2025-06-15',
        items: [
          { id: 'i1', attractionId: 'a1', name: 'Space Mountain' },
          { id: 'i2', attractionId: 'a2', name: 'Big Thunder' },
        ],
      },
      {
        id: 'itin-2',
        parkId: 'pk2',
        parkName: 'Epcot',
        date: undefined,
        items: [
          { id: 'i3', attractionId: 'a3', name: 'Soarin' },
          { id: 'i4', attractionId: 'a4', name: 'Test Track' },
          { id: 'i5', attractionId: 'a5', name: 'Living with the Land' },
        ],
      },
    ];

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('profile.itineraries')).toBeTruthy();
    });

    // Both park names visible
    expect(screen.getByText('Magic Kingdom')).toBeTruthy();
    expect(screen.getByText('Epcot')).toBeTruthy();
    // Date display — RTL renders meta as a single Text node, use regex matching
    expect(screen.getByText(/2025-06-15/)).toBeTruthy();
    expect(screen.getByText(/Date TBD/)).toBeTruthy();
    // Attraction counts
    expect(screen.getByText(/2 attractions/)).toBeTruthy();
    expect(screen.getByText(/3 attractions/)).toBeTruthy();
  });

  it('should navigate to ItineraryDetail when an itinerary is tapped', async () => {
    mockItineraries = [
      {
        id: 'itin-1',
        parkId: 'pk1',
        parkName: 'Magic Kingdom',
        date: '2025-06-15',
        items: [{ id: 'i1', attractionId: 'a1', name: 'Space Mountain' }],
      },
    ];

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Magic Kingdom'));
    expect(mockNavigate).toHaveBeenCalledWith('Parques', {
      screen: 'ItineraryDetail',
      params: { itineraryId: 'itin-1' },
    });
  });

  it('should render monitored attractions grouped by park with thresholds', async () => {
    mockMonitoredEntries = [
      {
        parkId: 'magic-kingdom',
        attractionId: 'mk-space-mountain',
        attractionName: 'Space Mountain',
        thresholdMin: 30,
      },
      {
        parkId: 'disneyland-paris',
        attractionId: 'dlp-big-thunder',
        attractionName: 'Big Thunder Mountain',
        thresholdMin: 20,
      },
    ];

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('profile.monitoredAttractions')).toBeTruthy();
    });

    expect(screen.getByText('Magic Kingdom')).toBeTruthy();
    expect(screen.getByText('Disneyland Park')).toBeTruthy();
    expect(screen.getByText('Space Mountain')).toBeTruthy();
    expect(screen.getByText('Big Thunder Mountain')).toBeTruthy();
    expect(screen.getByTestId('monitored-threshold-mk-space-mountain')).toHaveTextContent('30 min');
    expect(screen.getByTestId('monitored-threshold-dlp-big-thunder')).toHaveTextContent('20 min');
  });

  it('should remove a monitored attraction from the section', async () => {
    mockMonitoredEntries = [
      {
        parkId: 'magic-kingdom',
        attractionId: 'mk-space-mountain',
        attractionName: 'Space Mountain',
        thresholdMin: 30,
      },
    ];

    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('monitored-remove-mk-space-mountain')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('monitored-remove-mk-space-mountain'));

    await waitFor(() => {
      expect(mockRemoveThreshold).toHaveBeenCalledWith('magic-kingdom', 'mk-space-mountain');
    });

    await waitFor(() => {
      expect(screen.queryByText('Space Mountain')).toBeNull();
    });
  });

  it('should show the monitored attractions empty state when no thresholds exist', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('profile.noMonitoredAttractions')).toBeTruthy();
    });
  });
});
