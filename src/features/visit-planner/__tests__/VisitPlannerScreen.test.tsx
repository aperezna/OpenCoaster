import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { VisitPlannerScreen } from '../VisitPlannerScreen';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = jest.fn();
const mockUseRoute = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => mockUseRoute(),
  useFocusEffect: jest.fn(),
}));

let mockItineraries: Array<{
  id: string;
  parkId: string;
  parkName: string;
  date?: string;
  items: Array<{ id: string; attractionId: string; name: string; order: number }>;
  createdAt: string;
  updatedAt: string;
}> = [];

const mockCreateItinerary = jest.fn();

jest.mock('../useItineraries', () => ({
  useItineraries: () => ({
    itineraries: mockItineraries,
    isLoading: false,
    createItinerary: mockCreateItinerary,
    deleteItinerary: jest.fn(),
    updateDate: jest.fn(),
    addAttraction: jest.fn(),
    removeAttraction: jest.fn(),
    moveItemUp: jest.fn(),
    moveItemDown: jest.fn(),
    isAttractionInItinerary: jest.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VisitPlannerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockItineraries = [];
    mockUseRoute.mockReturnValue({
      key: 'VisitPlanner',
      name: 'VisitPlanner',
      params: {},
    });
  });

  describe('empty state', () => {
    it('should show empty state when no itineraries exist', () => {
      render(<VisitPlannerScreen />);
      expect(screen.getByTestId('visit-planner-screen')).toBeOnTheScreen();
      expect(screen.getByTestId('empty-state')).toBeOnTheScreen();
    });

    it('should show create button when no itineraries exist', () => {
      render(<VisitPlannerScreen />);
      expect(screen.getByTestId('create-itinerary-button')).toBeOnTheScreen();
    });
  });

  describe('itinerary list', () => {
    beforeEach(() => {
      mockItineraries = [
        {
          id: 'itin-1',
          parkId: 'pk-1',
          parkName: 'Magic Kingdom',
          date: '2026-07-15',
          items: [
            { id: 'item-1', attractionId: 'attr-1', name: 'Coaster A', order: 0 },
            { id: 'item-2', attractionId: 'attr-2', name: 'Coaster B', order: 1 },
          ],
          createdAt: '2026-07-01T00:00:00Z',
          updatedAt: '2026-07-01T00:00:00Z',
        },
        {
          id: 'itin-2',
          parkId: 'pk-2',
          parkName: 'Efteling',
          items: [],
          createdAt: '2026-07-02T00:00:00Z',
          updatedAt: '2026-07-02T00:00:00Z',
        },
      ];
    });

    it('should render itinerary cards with park name', () => {
      render(<VisitPlannerScreen />);
      expect(screen.getByText('Magic Kingdom')).toBeTruthy();
      expect(screen.getByText('Efteling')).toBeTruthy();
    });

    it('should show date when itinerary has one', () => {
      render(<VisitPlannerScreen />);
      expect(screen.getByText(/2026-07-15/)).toBeTruthy();
    });

    it('should show "Date TBD" when itinerary has no date', () => {
      render(<VisitPlannerScreen />);
      expect(screen.getByText(/Date TBD/)).toBeTruthy();
    });

    it('should show items count for each itinerary', () => {
      render(<VisitPlannerScreen />);
      expect(screen.getByText(/2 attractions/)).toBeTruthy();
      expect(screen.getByText(/0 attractions/)).toBeTruthy();
    });

    it('should navigate to ItineraryDetail on card press', () => {
      render(<VisitPlannerScreen />);
      fireEvent.press(screen.getByTestId('itinerary-card-itin-1'));
      expect(mockNavigate).toHaveBeenCalledWith('ItineraryDetail', { itineraryId: 'itin-1' });
    });

    it('should navigate to ItineraryDetail for second card', () => {
      render(<VisitPlannerScreen />);
      fireEvent.press(screen.getByTestId('itinerary-card-itin-2'));
      expect(mockNavigate).toHaveBeenCalledWith('ItineraryDetail', { itineraryId: 'itin-2' });
    });
  });

  describe('create itinerary', () => {
    it('should open creation form when create button is pressed', () => {
      render(<VisitPlannerScreen />);
      fireEvent.press(screen.getByTestId('create-itinerary-button'));

      expect(screen.getByTestId('itinerary-park-input')).toBeOnTheScreen();
      expect(screen.getByTestId('itinerary-date-input')).toBeOnTheScreen();
      expect(screen.getByTestId('confirm-create-button')).toBeOnTheScreen();
    });

    it('should hide form when cancel is pressed', () => {
      render(<VisitPlannerScreen />);
      fireEvent.press(screen.getByTestId('create-itinerary-button'));
      expect(screen.getByTestId('itinerary-park-input')).toBeOnTheScreen();

      fireEvent.press(screen.getByTestId('cancel-create-button'));
      expect(screen.queryByTestId('itinerary-park-input')).toBeNull();
    });

    it('should pre-fill park name from navigation params', () => {
      mockUseRoute.mockReturnValue({
        key: 'VisitPlanner',
        name: 'VisitPlanner',
        params: { parkId: 'mk', parkName: 'Magic Kingdom' },
      });

      render(<VisitPlannerScreen />);
      fireEvent.press(screen.getByTestId('create-itinerary-button'));

      // Verify the input has the pre-filled value
      const parkInput = screen.getByTestId('itinerary-park-input');
      expect(parkInput.props.value).toBe('Magic Kingdom');
    });

    it('should call createItinerary with form values', () => {
      mockUseRoute.mockReturnValue({
        key: 'VisitPlanner',
        name: 'VisitPlanner',
        params: { parkId: 'mk', parkName: 'Magic Kingdom' },
      });

      render(<VisitPlannerScreen />);
      fireEvent.press(screen.getByTestId('create-itinerary-button'));

      // Set date
      const dateInput = screen.getByTestId('itinerary-date-input');
      fireEvent.changeText(dateInput, '2026-07-20');

      fireEvent.press(screen.getByTestId('confirm-create-button'));

      expect(mockCreateItinerary).toHaveBeenCalledWith('mk', 'Magic Kingdom', '2026-07-20');
    });

    it('should call createItinerary without date when date is empty', () => {
      mockUseRoute.mockReturnValue({
        key: 'VisitPlanner',
        name: 'VisitPlanner',
        params: { parkId: 'mk', parkName: 'Magic Kingdom' },
      });

      render(<VisitPlannerScreen />);
      fireEvent.press(screen.getByTestId('create-itinerary-button'));
      fireEvent.press(screen.getByTestId('confirm-create-button'));

      expect(mockCreateItinerary).toHaveBeenCalledWith('mk', 'Magic Kingdom', undefined);
    });

    it('should not call createItinerary when park name is empty', () => {
      render(<VisitPlannerScreen />);
      fireEvent.press(screen.getByTestId('create-itinerary-button'));

      // Clear the park name (already empty since no params)
      const parkInput = screen.getByTestId('itinerary-park-input');
      fireEvent.changeText(parkInput, '');

      fireEvent.press(screen.getByTestId('confirm-create-button'));
      expect(mockCreateItinerary).not.toHaveBeenCalled();
    });

    it('should close form after successful creation', () => {
      mockUseRoute.mockReturnValue({
        key: 'VisitPlanner',
        name: 'VisitPlanner',
        params: { parkId: 'mk', parkName: 'Magic Kingdom' },
      });

      render(<VisitPlannerScreen />);
      fireEvent.press(screen.getByTestId('create-itinerary-button'));
      expect(screen.getByTestId('itinerary-park-input')).toBeOnTheScreen();

      fireEvent.press(screen.getByTestId('confirm-create-button'));

      // Form should be closed
      expect(screen.queryByTestId('itinerary-park-input')).toBeNull();
    });
  });
});
