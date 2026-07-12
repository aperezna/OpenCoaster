import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from './colors';
import type { ThemeColors } from './colors';

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const systemScheme = useColorScheme();
  const [manualDark, setManualDark] = useState<boolean | null>(null);

  const isDark = manualDark ?? systemScheme === 'dark';

  const toggleTheme = useCallback(() => {
    setManualDark((prev) => !(prev ?? systemScheme === 'dark'));
  }, [systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark,
      colors: isDark ? darkColors : lightColors,
      toggleTheme,
    }),
    [isDark, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
