import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import type { Itinerary } from '../../../data/models/Itinerary';
import { ItineraryPickerModal } from '../ItineraryPickerModal';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockItineraries: Itinerary[] = [
  {
    id: 'it-1',
    parkId: 'magic-kingdom',
    parkName: 'Magic Kingdom',
    date: '2026-07-15',
    items: [],
    createdAt: '2026-07-13T12:00:00.000Z',
    updatedAt: '2026-07-13T12:00:00.000Z',
  },
  {
    id: 'it-2',
    parkId: 'disneyland-paris',
    parkName: 'Disneyland Paris',
    items: [],
    createdAt: '2026-07-13T13:00:00.000Z',
    updatedAt: '2026-07-13T13:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ItineraryPickerModal', () => {
  it('should render the modal when visible is true', () => {
    render(
      <ItineraryPickerModal
        visible={true}
        itineraries={mockItineraries}
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId('itinerary-picker-modal')).toBeTruthy();
  });

  it('should list all itineraries', () => {
    render(
      <ItineraryPickerModal
        visible={true}
        itineraries={mockItineraries}
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText('Magic Kingdom')).toBeTruthy();
    expect(screen.getByText('Disneyland Paris')).toBeTruthy();
  });

  it('should call onSelect when an itinerary is pressed', () => {
    const handleSelect = jest.fn();
    render(
      <ItineraryPickerModal
        visible={true}
        itineraries={mockItineraries}
        onSelect={handleSelect}
        onCreateNew={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('itinerary-pick-it-1'));
    expect(handleSelect).toHaveBeenCalledWith(mockItineraries[0]);
  });

  it('should call onCreateNew when "Create New" is pressed', () => {
    const handleCreateNew = jest.fn();
    render(
      <ItineraryPickerModal
        visible={true}
        itineraries={mockItineraries}
        onSelect={jest.fn()}
        onCreateNew={handleCreateNew}
        onClose={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('itinerary-picker-create-new'));
    expect(handleCreateNew).toHaveBeenCalled();
  });

  it('should have a translated close button label', () => {
    const handleClose = jest.fn();
    render(
      <ItineraryPickerModal
        visible={true}
        itineraries={mockItineraries}
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        onClose={handleClose}
      />,
    );

    expect(screen.getByText('common.cancel')).toBeTruthy();
  });
});
