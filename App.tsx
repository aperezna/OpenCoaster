import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { NavigationContainer } from '@react-navigation/native';
import { createQueryClient, createPersister } from './src/data/cache/queryClient';
import { ParkDiscoveryContextProvider } from './src/data/providers/ParkDiscoveryProviderContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { OnboardingCarousel } from './src/features/onboarding/OnboardingCarousel';
import { useHasSeenOnboarding } from './src/features/onboarding/useHasSeenOnboarding';

// ---------------------------------------------------------------------------
// Sentry init
// ---------------------------------------------------------------------------

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({ dsn });
}

// ---------------------------------------------------------------------------
// Query client
// ---------------------------------------------------------------------------

const queryClient = createQueryClient();
const persister = createPersister();

// ---------------------------------------------------------------------------
// Inner app (after data hooks are available)
// ---------------------------------------------------------------------------

function AppInner(): React.JSX.Element {
  const { status, completeOnboarding } = useHasSeenOnboarding();

  if (status === 'loading') {
    return (
      <View testID="app-loading" style={loadingStyles.container}>
        <ActivityIndicator size="large" color="#4a6cf7" />
      </View>
    );
  }

  if (status === 'unseen') {
    return <OnboardingCarousel onComplete={completeOnboarding} />;
  }

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

// ---------------------------------------------------------------------------
// Wrapped app (Sentry.wrap when DSN is configured)
// ---------------------------------------------------------------------------

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

function AppRoot(): React.JSX.Element {
  return <AppInner />;
}

export default dsn ? Sentry.wrap(AppRoot) : AppRoot;
export { AppInner, AppRoot };
