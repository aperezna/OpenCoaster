import React from 'react';
import { Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ParkDiscoveryContextProvider, useParkDiscoveryProvider } from '../ParkDiscoveryProviderContext';
import { FixtureParkDiscoveryProvider } from '../ParkDiscoveryProvider';
import type { ParkDiscoveryProvider } from '../ParkDiscoveryProvider';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function TestConsumer(): React.JSX.Element {
  const provider = useParkDiscoveryProvider();
  return (
    <View testID="consumer">
      <Text testID="provider-type">{provider.constructor.name}</Text>
    </View>
  );
}

function TestConsumerOutsideProvider(): React.JSX.Element {
  // This component calls useParkDiscoveryProvider OUTSIDE the context provider
  // It should throw. We catch the error and render it to verify.
  try {
    useParkDiscoveryProvider();
    return <View testID="no-error" />;
  } catch (err) {
    return <View testID="error">{String(err)}</View>;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ParkDiscoveryProviderContext', () => {
  it('should provide the default ThemeParksWikiProvider when no provider is given', () => {
    render(
      <ParkDiscoveryContextProvider>
        <TestConsumer />
      </ParkDiscoveryContextProvider>,
    );
    expect(screen.getByTestId('provider-type')).toHaveTextContent('ThemeParksWikiProvider');
  });

  it('should provide a custom provider when one is given', () => {
    const fixture = new FixtureParkDiscoveryProvider();
    render(
      <ParkDiscoveryContextProvider provider={fixture}>
        <TestConsumer />
      </ParkDiscoveryContextProvider>,
    );
    expect(screen.getByTestId('provider-type')).toHaveTextContent('FixtureParkDiscoveryProvider');
  });

  it('should throw when useParkDiscoveryProvider is called outside ParkDiscoveryContextProvider', () => {
    expect(() => render(<TestConsumer />)).toThrow(
      'useParkDiscoveryProvider must be used within a ParkDiscoveryContextProvider',
    );
  });

  it('should render children', () => {
    render(
      <ParkDiscoveryContextProvider>
        <View testID="child" />
      </ParkDiscoveryContextProvider>,
    );
    expect(screen.getByTestId('child')).toBeOnTheScreen();
  });
});
