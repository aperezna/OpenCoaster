import React from 'react';
import { View } from 'react-native';

export const Screen: React.FC<any> = ({ children, ...props }) => {
  return React.createElement(View, { ...props, testID: 'rn-screens-screen' }, children);
};

export const ScreenContainer: React.FC<any> = ({ children, ...props }) => {
  return React.createElement(View, { ...props, testID: 'screen-container' }, children);
};

export const NativeScreen: React.FC<any> = ({ children, ...props }) => {
  return React.createElement(View, { ...props, testID: 'native-screen' }, children);
};

export const NativeScreenContainer: React.FC<any> = ({ children, ...props }) => {
  return React.createElement(View, { ...props, testID: 'native-screen-container' }, children);
};

export const ScreenStack: React.FC<any> = ({ children, ...props }) => {
  return React.createElement(View, { ...props, testID: 'screen-stack' }, children);
};

export const ScreenStackHeaderConfig: React.FC<any> = () => null;
export const ScreenStackHeaderSubview: React.FC<any> = () => null;
export const SearchBar: React.FC<any> = () => null;
export const FullWindowOverlay: React.FC<any> = ({ children }) => React.createElement(React.Fragment, null, children);

export default {
  Screen,
  ScreenContainer,
  NativeScreen,
  NativeScreenContainer,
  ScreenStack,
  ScreenStackHeaderConfig,
  ScreenStackHeaderSubview,
  SearchBar,
  FullWindowOverlay,
};
