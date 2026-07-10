import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createQueryClient } from './src/data/cache/queryClient';
import { ParkDiscoveryContextProvider } from './src/data/providers/ParkDiscoveryProviderContext';
import { RootNavigator } from './src/navigation/RootNavigator';

const queryClient = createQueryClient();

export function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ParkDiscoveryContextProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ParkDiscoveryContextProvider>
    </QueryClientProvider>
  );
}

export default App;
