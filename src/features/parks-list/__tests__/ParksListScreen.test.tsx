import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';
import { ParksListScreen } from '../ParksListScreen';
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
        <ParksListScreen />
      </ParkDiscoveryContextProvider>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ParksListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Skeleton loading ---

  it('should show skeleton while loading and hide it after data loads', async () => {
    renderScreen();
    // Skeleton is visible during initial fetch
    expect(screen.getByTestId('parks-list-skeleton')).toBeOnTheScreen();

    await waitFor(() => {
      expect(screen.getByTestId('park-result-list')).toBeOnTheScreen();
    });
    // Skeleton should be gone once parks are loaded
    expect(screen.queryByTestId('parks-list-skeleton')).toBeNull();
  });

  // --- Render all parks ---

  it('should render all parks on mount', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeTruthy();
      expect(screen.getByText('Disneyland Park')).toBeTruthy();
    });
  });

  it('should render the list with park-result-list testID when parks exist', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId('park-result-list')).toBeOnTheScreen();
    });
  });

  // --- Empty state ---

  it('should show "No parks found" when no parks match', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('park-search-input')).toBeTruthy();
    });

    const searchInput = screen.getByTestId('park-search-input');
    act(() => {
      fireEvent.changeText(searchInput, 'NonExistentParkXYZ');
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('park-result-list-empty')).toBeOnTheScreen();
      },
      { timeout: 500 },
    );
  });

  // --- City input ---

  it('should render city input field alongside name input', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('park-search-input')).toBeOnTheScreen();
    });

    expect(screen.getByTestId('park-city-input')).toBeOnTheScreen();
  });

  it('should filter parks by city after debounce', async () => {
    jest.useFakeTimers();
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeTruthy();
      expect(screen.getByText('Efteling')).toBeTruthy();
    });

    const cityInput = screen.getByTestId('park-city-input');
    fireEvent.changeText(cityInput, 'Orlando');

    act(() => {
      jest.advanceTimersByTime(350);
    });

    jest.useRealTimers();

    await waitFor(
      () => {
        expect(screen.getByText('Magic Kingdom')).toBeTruthy();
        expect(screen.queryByText('Efteling')).toBeNull();
      },
      { timeout: 2000, interval: 50 },
    );
  });

  // --- Country input ---

  it('should render country input field alongside name input', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('park-search-input')).toBeOnTheScreen();
    });

    expect(screen.getByTestId('park-country-input')).toBeOnTheScreen();
  });

  it('should filter parks by country after debounce', async () => {
    jest.useFakeTimers();
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeTruthy();
      expect(screen.getByText('Efteling')).toBeTruthy();
    });

    const countryInput = screen.getByTestId('park-country-input');
    fireEvent.changeText(countryInput, 'NL');

    act(() => {
      jest.advanceTimersByTime(350);
    });

    jest.useRealTimers();

    await waitFor(
      () => {
        expect(screen.getByText('Efteling')).toBeTruthy();
        expect(screen.queryByText('Magic Kingdom')).toBeNull();
      },
      { timeout: 2000, interval: 50 },
    );
  });

  // --- Combined name + city + country ---

  it('should combine name + city + country filters', async () => {
    jest.useFakeTimers();
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeTruthy();
      expect(screen.getByText('Disneyland Park')).toBeTruthy();
    });

    const nameInput = screen.getByTestId('park-search-input');
    fireEvent.changeText(nameInput, 'Magic');

    const cityInput = screen.getByTestId('park-city-input');
    fireEvent.changeText(cityInput, 'Orlando');

    const countryInput = screen.getByTestId('park-country-input');
    fireEvent.changeText(countryInput, 'US');

    act(() => {
      jest.advanceTimersByTime(350);
    });

    jest.useRealTimers();

    await waitFor(
      () => {
        expect(screen.getByText('Magic Kingdom')).toBeTruthy();
        expect(screen.queryByText('Disneyland Park')).toBeNull();
        expect(screen.queryByText('Efteling')).toBeNull();
      },
      { timeout: 2000, interval: 50 },
    );
  });

  // --- Search filtering ---

  it('should debounce search input and filter parks by name', async () => {
    jest.useFakeTimers();
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeTruthy();
      expect(screen.getByText('Disneyland Park')).toBeTruthy();
    });

    const searchInput = screen.getByTestId('park-search-input');
    fireEvent.changeText(searchInput, 'Magic');

    // Advance past the 300ms debounce
    act(() => {
      jest.advanceTimersByTime(350);
    });

    // Use real timers for the async query resolution
    jest.useRealTimers();

    await waitFor(
      () => {
        expect(screen.queryByText('Disneyland Park')).toBeNull();
        expect(screen.getByText('Magic Kingdom')).toBeTruthy();
      },
      { timeout: 2000, interval: 50 },
    );
  });

  // --- Tap park navigates ---

  it('should navigate to ParkDetail when a park is tapped', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('park-item-magic-kingdom'));
    expect(mockNavigate).toHaveBeenCalledWith('ParkDetail', {
      parkId: 'magic-kingdom',
    });
  });
});
