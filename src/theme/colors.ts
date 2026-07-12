export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  primary: string;
  accent: string;
  cardShadow: string;
  skeleton: string;
}

export const lightColors: ThemeColors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#e0e0e0',
  primary: '#007AFF',
  accent: '#4A90D9',
  cardShadow: '#000000',
  skeleton: '#e0e0e0',
};

export const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#E0E0E0',
  textSecondary: '#AAAAAA',
  textTertiary: '#888888',
  border: '#333333',
  primary: '#4A9EFF',
  accent: '#5AA0E0',
  cardShadow: '#000000',
  skeleton: '#2A2A2A',
};
