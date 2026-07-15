import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { LeafletMap } from '../LeafletMap';

jest.mock('react-native-webview', () => {
  const React = require('react');

  const WebView = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
    React.useImperativeHandle(ref, () => ({ injectJavaScript: jest.fn() }));
    return React.createElement('WebView', props);
  });

  WebView.displayName = 'WebView';

  return { WebView };
});

const INITIAL_REGION = {
  latitude: 28.4187,
  longitude: -81.5812,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

const MARKERS = [
  {
    id: 'magic-kingdom',
    name: 'Magic Kingdom',
    city: 'Lake Buena Vista',
    country: 'USA',
    latitude: 28.4187,
    longitude: -81.5812,
  },
];

function renderMap() {
  return render(
    <LeafletMap
      testID="leaflet-map"
      initialRegion={INITIAL_REGION}
      markers={MARKERS}
      onMarkerPress={jest.fn()}
    />,
  );
}

describe('LeafletMap', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows a visible fallback when the embedded map reports a failure', () => {
    renderMap();

    fireEvent(screen.getByTestId('leaflet-map-webview'), 'message', {
      nativeEvent: {
        data: JSON.stringify({ type: 'mapError', reason: 'leafletScriptError' }),
      },
    });

    expect(screen.getByTestId('leaflet-map-fallback')).toBeTruthy();
    expect(
      screen.getByText(
        'Interactive map is unavailable right now. You can still search parks and open park details.',
      ),
    ).toBeTruthy();
  });

  it('shows a visible fallback when the map never becomes ready', () => {
    renderMap();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId('leaflet-map-fallback')).toBeTruthy();
  });

  it('does not show the fallback after the map becomes ready', () => {
    renderMap();

    fireEvent(screen.getByTestId('leaflet-map-webview'), 'message', {
      nativeEvent: {
        data: JSON.stringify({ type: 'mapReady' }),
      },
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId('leaflet-map-webview')).toBeTruthy();
    expect(screen.queryByTestId('leaflet-map-fallback')).toBeNull();
  });
});
