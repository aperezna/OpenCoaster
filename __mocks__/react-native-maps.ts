import React from 'react';

// Mock for react-native-maps MapView component
const MockMapView: React.FC<any> = ({ children, ...props }) => {
  return React.createElement('MapView', props, children);
};

export default MockMapView;
export const MapView = MockMapView;
export const Marker: React.FC<any> = (props) => {
  return React.createElement('Marker', props);
};
export const PROVIDER_GOOGLE = 'google';

export class MapUrlTile extends React.Component<any> {
  render() {
    return React.createElement('UrlTile', this.props);
  }
}
export const UrlTile = MapUrlTile;
