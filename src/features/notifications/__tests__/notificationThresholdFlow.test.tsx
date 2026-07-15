import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { Alert, Linking } from 'react-native';
import { FixtureParkDiscoveryProvider } from '../../../data/providers/ParkDiscoveryProvider';
import { ParkDiscoveryContextProvider } from '../../../data/providers/ParkDiscoveryProviderContext';
import { ParkDetailScreen } from '../../park-details/ParkDetailScreen';
import { ProfileScreen } from '../../profile/ProfileScreen';
import { STORAGE_KEYS } from '../notificationTypes';

const mockUseRoute = jest.fn();
const mockNavigate = jest.fn();
const mockReset = jest.fn();

jest.mock('expo-notifications');

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: () => mockUseRoute(),
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
  }),
}));

jest.mock('../../favorites/useFavorites', () => ({
  useFavorites: () => ({
    favorites: [],
    clearFavorites: jest.fn(),
    isFavorite: () => false,
    toggleFavorite: jest.fn(),
    isLoading: false,
  }),
}));

jest.mock('../../visit-planner/useItineraries', () => ({
  useItineraries: () => ({
    itineraries: [],
    isLoading: false,
    addAttraction: jest.fn(),
    isAttractionInItinerary: () => false,
  }),
}));

jest.mock('../../../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    setLanguage: jest.fn(),
    isReady: true,
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <ParkDiscoveryContextProvider provider={new FixtureParkDiscoveryProvider()}>
        {ui}
      </ParkDiscoveryContextProvider>
    </QueryClientProvider>,
  );
}

describe('notification threshold integration flow', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    mockUseRoute.mockReturnValue({
      key: 'Parques',
      name: 'Parques',
      params: { parkId: 'magic-kingdom' },
    });
  });

  it('persists a threshold from park detail and reflects it in ProfileScreen', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' });

    const parkDetail = renderWithProviders(<ParkDetailScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('attraction-list')).toBeTruthy();
    });

    fireEvent(screen.getByTestId('attraction-mk-space-mountain'), 'onLongPress');

    await waitFor(() => {
      expect(screen.getByTestId('threshold-confirm')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('threshold-confirm'));

    await waitFor(() => {
      expect(screen.getByTestId('bell-indicator-mk-space-mountain')).toBeTruthy();
    });

    parkDetail.unmount();

    renderWithProviders(<ProfileScreen />);

    await waitFor(() => {
      expect(screen.getByText('profile.monitoredAttractions')).toBeTruthy();
    });

    expect(screen.getByText('Space Mountain')).toBeTruthy();
    expect(screen.getByText('Magic Kingdom')).toBeTruthy();
    expect(screen.getByTestId('monitored-threshold-mk-space-mountain')).toHaveTextContent('30 min');
  });

  it('shows a monitored bell indicator when a persisted threshold already exists', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.NOTIFICATION_PREFERENCES,
      JSON.stringify({
        'magic-kingdom': {
          'mk-space-mountain': {
            attractionName: 'Space Mountain',
            thresholdMin: 30,
          },
        },
      }),
    );
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' });

    renderWithProviders(<ParkDetailScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('bell-indicator-mk-space-mountain')).toBeTruthy();
    });
  });

  it('shows notification settings guidance when permission is denied on the first threshold set', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    const openSettingsSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);

    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'undetermined' });
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'denied' });

    renderWithProviders(<ParkDetailScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('attraction-list')).toBeTruthy();
    });

    fireEvent(screen.getByTestId('attraction-mk-space-mountain'), 'onLongPress');

    await waitFor(() => {
      expect(screen.getByTestId('threshold-confirm')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('threshold-confirm'));

    await waitFor(() => {
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });

    const buttons = alertSpy.mock.calls[0]?.[2] ?? [];
    const openSettingsButton = buttons.find(
      (button: { text?: string; onPress?: () => void }) =>
        button.text === 'notifications.openSettings',
    );

    expect(openSettingsButton).toBeTruthy();
    openSettingsButton?.onPress?.();

    await waitFor(() => {
      expect(openSettingsSpy).toHaveBeenCalledTimes(1);
      expect(openSettingsSpy).toHaveBeenCalledWith('app-settings:');
    });
  });
});
