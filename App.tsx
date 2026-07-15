import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { NavigationContainer } from '@react-navigation/native';
import i18next from 'i18next';
import { createQueryClient, createPersister } from './src/data/cache/queryClient';
import { ParkDiscoveryContextProvider } from './src/data/providers/ParkDiscoveryProviderContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { OnboardingCarousel } from './src/features/onboarding/OnboardingCarousel';
import { useHasSeenOnboarding } from './src/features/onboarding/useHasSeenOnboarding';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initI18n } from './src/i18n/config';
import { initNotifications } from './src/data/notifications/initNotifications';

// ---------------------------------------------------------------------------
// i18next init (fire-and-forget — resolves instantly for local JSON files)
// ---------------------------------------------------------------------------

initI18n().catch(() => {
  // i18next init failure is non-fatal; app runs with default 'en'
});

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
  const [i18nReady, setI18nReady] = useState(false);
  const { status, completeOnboarding } = useHasSeenOnboarding();

  // Track i18next initialization and init notifications
  useEffect(() => {
    if (i18next.isInitialized) {
      setI18nReady(true);
    } else {
      initI18n()
        .then(() => setI18nReady(true))
        .catch(() => setI18nReady(true)); // Non-fatal — proceed with English
    }

    // Fire-and-forget: init notification channels and background task
    initNotifications().catch(() => {
      // Non-fatal — app works without background notifications
    });
  }, []);

  // Hide the native splash once i18n and onboarding are resolved (app is ready)
  const appReady = i18nReady && status !== 'loading';
  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(() => {
        // Splash already hidden — safe to ignore.
      });
    }
  }, [appReady]);

  if (!i18nReady || status === 'loading') {
    return (
      <View testID="app-loading" style={loadingStyles.container}>
        <ActivityIndicator size="large" color="#4a6cf7" />
      </View>
    );
  }

  if (status === 'unseen') {
    return (
      <I18nextProvider i18n={i18next}>
        <OnboardingCarousel onComplete={completeOnboarding} />
      </I18nextProvider>
    );
  }

  return (
    <I18nextProvider i18n={i18next}>
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
    </I18nextProvider>
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
