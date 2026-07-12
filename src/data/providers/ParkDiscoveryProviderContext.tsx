import React, { createContext, useContext } from 'react';
import { ThemeParksWikiProvider } from './ThemeParksWikiProvider';
import type { ParkDiscoveryProvider } from './ParkDiscoveryProvider';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ParkDiscoveryContext = createContext<ParkDiscoveryProvider | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ParkDiscoveryContextProviderProps {
  children: React.ReactNode;
  provider?: ParkDiscoveryProvider;
}

export function ParkDiscoveryContextProvider({
  children,
  provider = new ThemeParksWikiProvider(),
}: ParkDiscoveryContextProviderProps): React.JSX.Element {
  return <ParkDiscoveryContext.Provider value={provider}>{children}</ParkDiscoveryContext.Provider>;
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

export function useParkDiscoveryProvider(): ParkDiscoveryProvider {
  const provider = useContext(ParkDiscoveryContext);
  if (!provider) {
    throw new Error('useParkDiscoveryProvider must be used within a ParkDiscoveryContextProvider');
  }
  return provider;
}
