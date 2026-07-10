import React, { useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ParkSummary } from '../../data/models/ParkSummary';

// ---------------------------------------------------------------------------
// Leaflet HTML that renders OSM tiles and handles marker interaction
// ---------------------------------------------------------------------------

const LEAFLET_VERSION = '1.9.4';

function buildMapHtml(initialRegion: {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css"
  />
  <script src="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false,
    }).setView([${initialRegion.latitude}, ${initialRegion.longitude}], 8);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    var markers = {};
    var currentZoom = 8;

    map.on('zoomend', function() {
      currentZoom = map.getZoom();
    });

    // Listen for markers from React Native
    window.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'setMarkers') {
          // Remove old markers
          Object.values(markers).forEach(function(m) { map.removeLayer(m); });
          markers = {};

          data.markers.forEach(function(park) {
            var marker = L.marker([park.latitude, park.longitude])
              .addTo(map);

            marker.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerPress',
                parkId: park.id,
              }));
            });

            markers[park.id] = marker;
          });
        }
      } catch(e) {}
    });

    // Notify RN that map is ready
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeafletMapProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers: ParkSummary[];
  onMarkerPress: (parkId: string) => void;
  testID?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LeafletMap({
  initialRegion,
  markers,
  onMarkerPress,
  testID,
}: LeafletMapProps): React.JSX.Element {
  const webViewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);

  // Send markers to the web view when they change
  useEffect(() => {
    if (!isReadyRef.current) return;
    const payload = JSON.stringify({
      type: 'setMarkers',
      markers: markers.map((p) => ({
        id: p.id,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
      })),
    });
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message', { data: ${payload} })); true;`,
    );
  }, [markers]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'markerPress') {
          onMarkerPress(data.parkId);
        } else if (data.type === 'mapReady') {
          isReadyRef.current = true;
          // Send initial markers
          const payload = JSON.stringify({
            type: 'setMarkers',
            markers: markers.map((p) => ({
              id: p.id,
              name: p.name,
              latitude: p.latitude,
              longitude: p.longitude,
            })),
          });
          webViewRef.current?.injectJavaScript(
            `window.dispatchEvent(new MessageEvent('message', { data: ${payload} })); true;`,
          );
        }
      } catch {
        // Ignore parse errors
      }
    },
    [markers, onMarkerPress],
  );

  const html = buildMapHtml(initialRegion);

  return (
    <View style={styles.container} testID={testID}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        onMessage={handleMessage}
        // Prevent WebView from scrolling independently
        overScrollMode="never"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
