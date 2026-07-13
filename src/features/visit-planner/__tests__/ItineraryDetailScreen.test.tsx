import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ItineraryDetailScreen } from '../ItineraryDetailScreen';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockUseRoute = jest.fn();

// Track useFocusEffect callbacks
let focusEffectCallback: (() => void) | null = null;

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => mockUseRoute(),
  useFocusEffect: (cb: () => void) => {
    focusEffectCallback = cb;
  },
}));

const mockMoveItemUp = jest.fn();
const mockMoveItemDown = jest.fn();
const mockDeleteItinerary = jest.fn();

let mockItineraries: Array<{
  id: string;
  parkId: string;
  parkName: string;
  date?: string;
  items: Array<{ id: string; attractionId: string; name: string; order: number }>;
  createdAt: string;
  updatedAt: string;
}> = [];

jest.mock('../useItineraries', () => ({
  useItineraries: () => ({
    itineraries: mockItineraries,
    isLoading: false,
    createItinerary: jest.fn(),
    deleteItinerary: mockDeleteItinerary,
    updateDate: jest.fn(),
    addAttraction: jest.fn(),
    removeAttraction: jest.fn(),
    moveItemUp: mockMoveItemUp,
    moveItemDown: mockMoveItemDown,
    isAttractionInItinerary: jest.fn(),
  }),
}));

const mockRefetchAll = jest.fn();

jest.mock('../../../data/providers/ParkDiscoveryProviderContext', () => ({
  useParkDiscoveryProvider: () => ({}),
}));

jest.mock('../../park-details/useParkDetail', () => ({
  useParkDetail: () => ({
    attractions: [
      {
        id: 'attr-1',
        name: 'Coaster A',
        waitTime: 15,
        status: 'operating' as const,
        type: 'roller_coaster' as const,
        parkId: 'pk-1',
      },
      {
        id: 'attr-2',
        name: 'Coaster B',
        waitTime: 0,
        status: 'closed' as const,
        type: 'roller_coaster' as const,
        parkId: 'pk-1',
      },
    ],
    refetchAll: mockRefetchAll,
    isLoading: false,
    isFetching: false,
    park: null,
    weather: null,
    hours: null,
    error: null,
    isParkLoading: false,
    isWeatherLoading: false,
    isHoursLoading: false,
    isAttractionsLoading: false,
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seedItinerary(overrides: Record<string, unknown> = {}) {
  mockItineraries = [
    {
      id: 'itin-1',
      parkId: 'pk-1',
      parkName: 'Magic Kingdom',
      date: '2026-07-15',
      items: [
        { id: 'item-1', attractionId: 'attr-1', name: 'Coaster A', order: 0 },
        { id: 'item-2', attractionId: 'attr-2', name: 'Coaster B', order: 1 },
        { id: 'item-3', attractionId: 'attr-3', name: 'Coaster C', order: 2 },
      ],
      createdAt: '2026-07-01T00:00:00Z',
      updatedAt: '2026-07-01T00:00:00Z',
      ...overrides,
    },
  ];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ItineraryDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    focusEffectCallback = null;
    seedItinerary();
    mockUseRoute.mockReturnValue({
      key: 'ItineraryDetail',
      name: 'ItineraryDetail',
      params: { itineraryId: 'itin-1' },
    });
  });

  describe('itinerary display', () => {
    it('should show park name', () => {
      render(<ItineraryDetailScreen />);
      expect(screen.getByText('Magic Kingdom')).toBeTruthy();
    });

    it('should show date', () => {
      render(<ItineraryDetailScreen />);
      expect(screen.getByText(/2026-07-15/)).toBeTruthy();
    });

    it('should show translated dateTbd when itinerary has no date', () => {
      seedItinerary({ date: undefined });
      render(<ItineraryDetailScreen />);
      expect(screen.getByText(/visitPlanner\.dateTbd/)).toBeTruthy();
    });

    it('should show translated attractions count', () => {
      render(<ItineraryDetailScreen />);
      expect(screen.getByText(/visitPlanner\.attractionsCount/)).toBeTruthy();
    });

    it('should show translated not found state when itinerary does not exist', () => {
      mockUseRoute.mockReturnValue({
        key: 'ItineraryDetail',
        name: 'ItineraryDetail',
        params: { itineraryId: 'nonexistent' },
      });
      render(<ItineraryDetailScreen />);
      expect(screen.getByText('itineraryDetail.notFound')).toBeTruthy();
    });
  });

  describe('item list', () => {
    it('should render all items', () => {
      render(<ItineraryDetailScreen />);
      expect(screen.getByText('Coaster A')).toBeTruthy();
      expect(screen.getByText('Coaster B')).toBeTruthy();
      expect(screen.getByText('Coaster C')).toBeTruthy();
    });

    it('should show wait time for operating attractions', () => {
      render(<ItineraryDetailScreen />);
      expect(screen.getByText('15 min')).toBeTruthy();
    });

    it('should show translated status for closed attractions', () => {
      render(<ItineraryDetailScreen />);
      expect(screen.getByText('itineraryDetail.closed')).toBeTruthy();
    });

    it('should show dash for unknown attractions', () => {
      render(<ItineraryDetailScreen />);
      // attr-3 (Coaster C) is not in the mocked attractions (only attr-1 and attr-2)
      expect(screen.getByText('—')).toBeTruthy();
    });

    it('should have move up button on each item', () => {
      render(<ItineraryDetailScreen />);
      expect(screen.getByTestId('move-up-item-1')).toBeOnTheScreen();
      expect(screen.getByTestId('move-up-item-2')).toBeOnTheScreen();
      expect(screen.getByTestId('move-up-item-3')).toBeOnTheScreen();
    });

    it('should have move down button on each item', () => {
      render(<ItineraryDetailScreen />);
      expect(screen.getByTestId('move-down-item-1')).toBeOnTheScreen();
      expect(screen.getByTestId('move-down-item-2')).toBeOnTheScreen();
      expect(screen.getByTestId('move-down-item-3')).toBeOnTheScreen();
    });
  });

  describe('reorder', () => {
    it('should call moveItemUp when move up is pressed', () => {
      render(<ItineraryDetailScreen />);
      fireEvent.press(screen.getByTestId('move-up-item-2'));
      expect(mockMoveItemUp).toHaveBeenCalledWith('itin-1', 'attr-2');
    });

    it('should call moveItemDown when move down is pressed', () => {
      render(<ItineraryDetailScreen />);
      fireEvent.press(screen.getByTestId('move-down-item-1'));
      expect(mockMoveItemDown).toHaveBeenCalledWith('itin-1', 'attr-1');
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      jest.spyOn(Alert, 'alert');
    });

    it('should show delete button', () => {
      render(<ItineraryDetailScreen />);
      expect(screen.getByTestId('delete-itinerary-button')).toBeOnTheScreen();
    });

    it('should call Alert.alert with translated strings when delete is pressed', () => {
      render(<ItineraryDetailScreen />);
      fireEvent.press(screen.getByTestId('delete-itinerary-button'));
      expect(Alert.alert).toHaveBeenCalledWith(
        'itineraryDetail.deleteTitle',
        'itineraryDetail.deleteConfirm',
        expect.arrayContaining([
          expect.objectContaining({ text: 'common.cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'common.delete', style: 'destructive' }),
        ]),
      );
    });

    it('should call deleteItinerary and goBack when delete is confirmed', () => {
      // Mock Alert.alert to invoke the Delete button callback
      jest
        .spyOn(Alert, 'alert')
        .mockImplementation(
          (
            _title: string,
            _msg?: string,
            buttons?: Array<{ text?: string; style?: string; onPress?: () => void }>,
          ) => {
            const deleteBtn = buttons?.find((b) => b.style === 'destructive');
            if (deleteBtn?.onPress) deleteBtn.onPress();
          },
        );

      render(<ItineraryDetailScreen />);
      fireEvent.press(screen.getByTestId('delete-itinerary-button'));

      expect(mockDeleteItinerary).toHaveBeenCalledWith('itin-1');
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('wait time refresh', () => {
    it('should register useFocusEffect callback', () => {
      render(<ItineraryDetailScreen />);
      expect(focusEffectCallback).not.toBeNull();
    });

    it('should call refetchAll when screen is focused', () => {
      render(<ItineraryDetailScreen />);
      // Trigger the registered focus effect callback
      act(() => {
        focusEffectCallback!();
      });
      expect(mockRefetchAll).toHaveBeenCalled();
    });
  });
});
