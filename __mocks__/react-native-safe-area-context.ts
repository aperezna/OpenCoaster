import React from 'react';
import { View } from 'react-native';

const insets = { top: 0, right: 0, bottom: 0, left: 0 };
const frame = { x: 0, y: 0, width: 390, height: 844 };

export const SafeAreaProvider: React.FC<any> = ({ children }) => {
  return React.createElement(View, { testID: 'safe-area-provider' }, children);
};

export const SafeAreaView: React.FC<any> = ({ children, ...props }) => {
  return React.createElement(View, { ...props, testID: 'safe-area-view' }, children);
};

export const SafeAreaConsumer: React.FC<{
  children: (insets: typeof insets) => React.ReactNode;
}> = ({ children }) => React.createElement(React.Fragment, null, children(insets));

export function useSafeAreaInsets() {
  return insets;
}

export function useSafeAreaFrame() {
  return frame;
}

export const SafeAreaInsetsContext = React.createContext(insets);
export const SafeAreaFrameContext = React.createContext(frame);

export const initialWindowMetrics = {
  insets,
  frame,
};

export default {
  SafeAreaProvider,
  SafeAreaView,
  SafeAreaConsumer,
  useSafeAreaInsets,
  useSafeAreaFrame,
  SafeAreaInsetsContext,
  SafeAreaFrameContext,
  initialWindowMetrics,
};
