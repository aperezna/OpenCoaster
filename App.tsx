import React from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { NavigationContainer } from '@react-navigation/native';
import { createQueryClient, createPersister } from './src/data/cache/queryClient';
import { ParkDiscoveryContextProvider } from './src/data/providers/ParkDiscoveryProviderContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';

const queryClient = createQueryClient();
const persister = createPersister();

export function App(): React.JSX.Element {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        // Cache hydrated — app is ready with offline data
      }}
    >
      <ParkDiscoveryContextProvider>
        <ThemeProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </ParkDiscoveryContextProvider>
    </PersistQueryClientProvider>
  );
}

export default App;
