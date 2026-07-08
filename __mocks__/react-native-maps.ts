import React from 'react';
import { View } from 'react-native';

// Mock for react-native-maps MapView component
const MockMapView: React.FC<any> = ({ children, ...props }) => {
  return React.createElement(View, { ...props, testID: 'map-view' }, children);
};

export default MockMapView;
export const MapView = MockMapView;
export const Marker: React.FC<any> = (props) => {
  return React.createElement(View, { testID: 'map-marker', ...props });
};
export const PROVIDER_GOOGLE = 'google';
export const UrlTile: React.FC<any> = (props) => {
  return React.createElement(View, { testID: 'url-tile', ...props });
};
