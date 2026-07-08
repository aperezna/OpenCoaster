import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ParkResultList } from '../ParkResultList';
import type { ParkSummary } from '../../../data/models/ParkSummary';

const mockParks: ParkSummary[] = [
  {
    id: 'park-1',
    name: 'Magic Kingdom',
    city: 'Orlando',
    country: 'US',
    latitude: 28.4,
    longitude: -81.6,
  },
  {
    id: 'park-2',
    name: 'Efteling',
    city: 'Kaatsheuvel',
    country: 'NL',
    latitude: 51.65,
    longitude: 5.05,
  },
];

describe('ParkResultList', () => {
  it('should render a list of parks', async () => {
    await render(
      <ParkResultList parks={mockParks} onParkPress={() => {}} />,
    );
    expect(screen.getByText('Magic Kingdom')).toBeOnTheScreen();
    expect(screen.getByText('Efteling')).toBeOnTheScreen();
  });

  it('should show city and country for each park', async () => {
    await render(
      <ParkResultList parks={mockParks} onParkPress={() => {}} />,
    );
    expect(screen.getByText(/Orlando/)).toBeOnTheScreen();
    expect(screen.getByText(/Kaatsheuvel/)).toBeOnTheScreen();
    expect(screen.getByText(/US/)).toBeOnTheScreen();
    expect(screen.getByText(/NL/)).toBeOnTheScreen();
  });

  it('should call onParkPress when a park item is pressed', async () => {
    const onParkPress = jest.fn();
    await render(
      <ParkResultList parks={mockParks} onParkPress={onParkPress} />,
    );
    fireEvent.press(screen.getByText('Magic Kingdom'));
    expect(onParkPress).toHaveBeenCalledWith('park-1');
  });

  it('should show empty state when no parks', async () => {
    await render(
      <ParkResultList parks={[]} onParkPress={() => {}} />,
    );
    expect(screen.getByText('No parks found')).toBeOnTheScreen();
  });

  it('should show "No parks found" for empty search results', async () => {
    await render(
      <ParkResultList parks={[]} onParkPress={() => {}} />,
    );
    // Should be the only prominent message
    expect(screen.getByText('No parks found')).toBeOnTheScreen();
    // No items should be rendered
    expect(screen.queryByText('Magic Kingdom')).toBeNull();
  });
});
