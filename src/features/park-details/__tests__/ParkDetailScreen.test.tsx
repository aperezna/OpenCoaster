import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { ParkDetailScreen } from '../ParkDetailScreen';
import { FixtureParkDiscoveryProvider } from '../../../data/providers/ParkDiscoveryProvider';

function createMockRoute(parkId: string) {
  return {
    key: 'ParkDetail',
    name: 'ParkDetail',
    params: { parkId },
  } as const;
}

describe('ParkDetailScreen', () => {
  it('should show park name and city when park exists', async () => {
    const provider = new FixtureParkDiscoveryProvider();
    await render(
      <ParkDetailScreen
        route={createMockRoute('magic-kingdom')}
        parkDiscoveryProvider={provider}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeOnTheScreen();
    });
    expect(screen.getByText(/Orlando/)).toBeOnTheScreen();
    expect(screen.getByText(/US/)).toBeOnTheScreen();
  });

  it('should render a placeholder image when park has no photoUrl', async () => {
    const provider = new FixtureParkDiscoveryProvider();
    await render(
      <ParkDetailScreen
        route={createMockRoute('efteling')}
        parkDiscoveryProvider={provider}
      />,
    );
    // Efteling has no photoUrl — should show placeholder
    await waitFor(() => {
      expect(screen.getByTestId('park-photo-placeholder')).toBeOnTheScreen();
    });
  });

  it('should show park photo when park has photoUrl', async () => {
    const provider = new FixtureParkDiscoveryProvider();
    await render(
      <ParkDetailScreen
        route={createMockRoute('magic-kingdom')}
        parkDiscoveryProvider={provider}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId('park-photo')).toBeOnTheScreen();
    });
  });

  it('should show "Park not found" for unknown parkId', async () => {
    const provider = new FixtureParkDiscoveryProvider();
    await render(
      <ParkDetailScreen
        route={createMockRoute('unknown-park-id')}
        parkDiscoveryProvider={provider}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('Park not found')).toBeOnTheScreen();
    });
  });
});
