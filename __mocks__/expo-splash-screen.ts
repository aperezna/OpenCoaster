// Mock for expo-splash-screen — no-op in tests with spy support

export const preventAutoHideAsync = jest.fn().mockResolvedValue(undefined);
export const hideAsync = jest.fn().mockResolvedValue(undefined);
export const setOptions = jest.fn();

const SplashScreen = {
  preventAutoHideAsync,
  hideAsync,
  setOptions,
};

export default SplashScreen;
