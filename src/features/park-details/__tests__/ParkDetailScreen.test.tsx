import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { ParkDetailScreen } from '../ParkDetailScreen';
import { FixtureParkDiscoveryProvider } from '../../../data/providers/ParkDiscoveryProvider';

function createMockRoute(parkId: string) {
  return {
    key: 'Parques',
    name: 'Parques',
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

  it('should show address and phone for park with contact info', async () => {
    const provider = new FixtureParkDiscoveryProvider();
    await render(
      <ParkDetailScreen
        route={createMockRoute('magic-kingdom')}
        parkDiscoveryProvider={provider}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('1180 Seven Seas Dr, Lake Buena Vista, FL 32830')).toBeOnTheScreen();
    });
    expect(screen.getByText('+1-407-939-5277')).toBeOnTheScreen();
  });

  it('should render the directions button', async () => {
    const provider = new FixtureParkDiscoveryProvider();
    await render(
      <ParkDetailScreen
        route={createMockRoute('magic-kingdom')}
        parkDiscoveryProvider={provider}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId('directions-button')).toBeOnTheScreen();
    });
    expect(screen.getByText('Cómo llegar')).toBeOnTheScreen();
  });

  it('should show weather card for park', async () => {
    const provider = new FixtureParkDiscoveryProvider();
    await render(
      <ParkDetailScreen
        route={createMockRoute('magic-kingdom')}
        parkDiscoveryProvider={provider}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId('weather-card')).toBeOnTheScreen();
    });
    expect(screen.getByText('Clima')).toBeOnTheScreen();
  });

  it('should show hours card for park', async () => {
    const provider = new FixtureParkDiscoveryProvider();
    await render(
      <ParkDetailScreen
        route={createMockRoute('magic-kingdom')}
        parkDiscoveryProvider={provider}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId('hours-card')).toBeOnTheScreen();
    });
    expect(screen.getByText('Horario')).toBeOnTheScreen();
  });

  it('should show attractions list for park', async () => {
    const provider = new FixtureParkDiscoveryProvider();
    await render(
      <ParkDetailScreen
        route={createMockRoute('magic-kingdom')}
        parkDiscoveryProvider={provider}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId('attraction-list')).toBeOnTheScreen();
    });
    expect(screen.getByText('Atracciones')).toBeOnTheScreen();
  });

  it('should have a default parkId when none is provided', async () => {
    const provider = new FixtureParkDiscoveryProvider();
    await render(
      <ParkDetailScreen
        parkDiscoveryProvider={provider}
        selectedParkId={undefined}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('Magic Kingdom')).toBeOnTheScreen();
    });
  });

  it('should use selectedParkId prop when provided', async () => {
    const provider = new FixtureParkDiscoveryProvider();
    await render(
      <ParkDetailScreen
        parkDiscoveryProvider={provider}
        selectedParkId="efteling"
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('Efteling')).toBeOnTheScreen();
    });
  });
});
