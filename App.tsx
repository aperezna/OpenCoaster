import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { NavigationContainer } from '@react-navigation/native';
import { createQueryClient, createPersister } from './src/data/cache/queryClient';
import { ParkDiscoveryContextProvider } from './src/data/providers/ParkDiscoveryProviderContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { OnboardingCarousel } from './src/features/onboarding/OnboardingCarousel';
import { useHasSeenOnboarding } from './src/features/onboarding/useHasSeenOnboarding';
import ErrorBoundary from './src/components/ErrorBoundary';

// ---------------------------------------------------------------------------
// Sentry init
// ---------------------------------------------------------------------------

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({ dsn });
}

// ---------------------------------------------------------------------------
// Splash screen — prevent auto-hide until app is ready
// The native splash stays visible until hideAsync() is called, preventing
// white flash on cold start.
// ---------------------------------------------------------------------------

SplashScreen.preventAutoHideAsync().catch(() => {
  // If the native splash is already hidden, this is a no-op. Safe to ignore.
});

// ---------------------------------------------------------------------------
// Query client
// ---------------------------------------------------------------------------

const queryClient = createQueryClient();
const persister = createPersister();

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

// ---------------------------------------------------------------------------
// Inner app (after data hooks are available)
// ---------------------------------------------------------------------------

function AppInner(): React.JSX.Element {
  const { status, completeOnboarding } = useHasSeenOnboarding();

  // Hide the native splash once onboarding status is resolved (app is ready)
  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync().catch(() => {
        // Splash already hidden — safe to ignore.
      });
    }
  }, [status]);

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Wrapped app (Sentry.wrap when DSN is configured)
// ---------------------------------------------------------------------------

function AppRoot(): React.JSX.Element {
  return <AppInner />;
}

export default dsn ? Sentry.wrap(AppRoot) : AppRoot;
export { AppInner, AppRoot };
