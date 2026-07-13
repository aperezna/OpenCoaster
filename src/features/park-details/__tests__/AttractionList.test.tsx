import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AttractionList } from '../AttractionList';
import type { Attraction } from '../../../data/models/Attraction';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const operatingAttraction: Attraction = {
  id: 'mk-space-mountain',
  name: 'Space Mountain',
  parkId: 'magic-kingdom',
  waitTime: 45,
  status: 'operating',
  type: 'roller_coaster',
};

const closedAttraction: Attraction = {
  id: 'mk-pirates',
  name: 'Pirates of the Caribbean',
  parkId: 'magic-kingdom',
  waitTime: 20,
  status: 'closed',
  type: 'dark_ride',
};

const attractions: Attraction[] = [operatingAttraction, closedAttraction];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AttractionList — add to itinerary', () => {
  it('should render an "Add to itinerary" button for each attraction when onAddToItinerary is provided', () => {
    render(
      <AttractionList
        attractions={attractions}
        onAddToItinerary={jest.fn()}
        isAttractionAdded={() => false}
      />,
    );

    const addButtons = screen.getAllByTestId(/^add-to-itinerary-/);
    expect(addButtons).toHaveLength(2);
  });

  it('should call onAddToItinerary with the attraction when the button is pressed', () => {
    const handleAddToItinerary = jest.fn();
    render(
      <AttractionList
        attractions={attractions}
        onAddToItinerary={handleAddToItinerary}
        isAttractionAdded={() => false}
      />,
    );

    fireEvent.press(screen.getByTestId('add-to-itinerary-mk-space-mountain'));
    expect(handleAddToItinerary).toHaveBeenCalledWith(operatingAttraction);
  });

  it('should show "Added" indicator when attraction is in an itinerary', () => {
    render(
      <AttractionList
        attractions={attractions}
        onAddToItinerary={jest.fn()}
        isAttractionAdded={(id) => id === 'mk-space-mountain'}
      />,
    );

    // Space Mountain should show "Added"
    expect(screen.getByTestId('added-indicator-mk-space-mountain')).toBeTruthy();

    // Pirates should still show "Add to itinerary"
    expect(screen.getByTestId('add-to-itinerary-mk-pirates')).toBeTruthy();
  });

  it('should hide "Add to itinerary" button when attraction is already added', () => {
    render(
      <AttractionList
        attractions={attractions}
        onAddToItinerary={jest.fn()}
        isAttractionAdded={(id) => id === 'mk-space-mountain'}
      />,
    );

    // Space Mountain should NOT have an add button
    expect(screen.queryByTestId('add-to-itinerary-mk-space-mountain')).toBeNull();
  });

  it('should not render add buttons when onAddToItinerary is not provided', () => {
    render(<AttractionList attractions={attractions} isAttractionAdded={() => false} />);

    const addButtons = screen.queryAllByTestId(/^add-to-itinerary-/);
    expect(addButtons).toHaveLength(0);
  });
});
