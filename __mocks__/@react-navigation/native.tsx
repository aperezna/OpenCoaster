import React from 'react';
import { View } from 'react-native';

// Mock for @react-navigation/native

export const NavigationContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return React.createElement(View, { testID: 'navigation-container' }, children);
};

export function useNavigation() {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
}

export function useRoute() {
  return {
    key: 'test-route',
    name: 'Discovery',
    params: {},
  };
}

export function createNavigatorFactory() {
  return () => null;
}
