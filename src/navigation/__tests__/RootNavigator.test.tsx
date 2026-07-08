import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { RootNavigator, type RootStackParamList } from '../RootNavigator';

async function renderNavigator(
  initialRouteName?: keyof RootStackParamList,
) {
  return render(
    <RootNavigator initialRouteName={initialRouteName} />,
  );
}

describe('RootNavigator', () => {
  it('should render the DiscoveryScreen as the initial route', async () => {
    await renderNavigator('Discovery');
    expect(screen.getByTestId('discovery-screen')).toBeOnTheScreen();
  });

  it('should mount ParkDetailScreen when navigated with parkId param', async () => {
    await renderNavigator('ParkDetail');
    expect(screen.getByTestId('park-detail-screen')).toBeOnTheScreen();
  });
});
