import React, { useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ParkSummary } from '../../data/models/ParkSummary';

// ---------------------------------------------------------------------------
// Leaflet HTML — renders OSM tiles with marker clustering + popups
// ---------------------------------------------------------------------------

const LEAFLET_VERSION = '1.9.4';
const CLUSTER_VERSION = '1.5.3';

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
  <link rel="stylesheet" href="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@${CLUSTER_VERSION}/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@${CLUSTER_VERSION}/dist/MarkerCluster.Default.css" />
  <script src="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.markercluster@${CLUSTER_VERSION}/dist/leaflet.markercluster.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
    .park-popup .popup-name { font-size: 14px; font-weight: 600; margin-bottom: 6px; }
    .park-popup .popup-btn {
      display: inline-block;
      background: #007AFF;
      color: #fff;
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      border: none;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false,
    }).setView([${initialRegion.latitude}, ${initialRegion.longitude}], 5);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    var clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });
    map.addLayer(clusterGroup);

    var parkIndex = {};
    var userMarker = null;
    var hasBounds = false;

    function fitAllMarkers() {
      if (clusterGroup.getLayers().length === 0) return;
      var bounds = clusterGroup.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
        hasBounds = true;
      }
    }

    window.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);

        if (data.type === 'setMarkers') {
          clusterGroup.clearLayers();
          parkIndex = {};

          data.markers.forEach(function(park) {
            var marker = L.marker([park.latitude, park.longitude]);
            marker.bindPopup(
              '<div class="park-popup">' +
                '<div class="popup-name">' + park.name + '</div>' +
                '<button class="popup-btn" id="view-park-' + park.id + '">Ver m&aacute;s</button>' +
              '</div>'
            );

            marker.on('popupopen', function() {
              setTimeout(function() {
                var btn = document.getElementById('view-park-' + park.id);
                if (btn) {
                  btn.onclick = function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'markerPress',
                      parkId: park.id,
                    }));
                  };
                }
              }, 50);
            });

            clusterGroup.addLayer(marker);
            parkIndex[park.id] = park;
          });

          // Fit bounds after adding markers
          if (data.markers.length > 0) {
            fitAllMarkers();
          }
        }

        if (data.type === 'setUserLocation') {
          if (userMarker) {
            map.removeLayer(userMarker);
          }
          userMarker = L.circleMarker([data.latitude, data.longitude], {
            radius: 8,
            color: '#007AFF',
            fillColor: '#4A9EFF',
            fillOpacity: 0.8,
            weight: 2,
          }).addTo(map);

          // If no park markers yet, center on user
          if (!hasBounds) {
            map.setView([data.latitude, data.longitude], 10);
          }
        }

      } catch(e) {}
    });

    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParkMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface LeafletMapProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers: ParkSummary[];
  onMarkerPress: (parkId: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  testID?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LeafletMap({
  initialRegion,
  markers,
  onMarkerPress,
  userLocation,
  testID,
}: LeafletMapProps): React.JSX.Element {
  const webViewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);

  const sendToMap = useCallback((message: Record<string, unknown>) => {
    if (!isReadyRef.current) return;
    const payload = JSON.stringify(message);
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message', { data: ${payload} })); true;`,
    );
  }, []);

  // Send markers to the web view when they change
  useEffect(() => {
    if (markers.length === 0) return;
    const parkMarkers: ParkMarker[] = markers.map((p) => ({
      id: p.id,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
    }));
    sendToMap({ type: 'setMarkers', markers: parkMarkers });
  }, [markers, sendToMap]);

  // Send user location when it changes
  useEffect(() => {
    if (!userLocation) return;
    sendToMap({
      type: 'setUserLocation',
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    });
  }, [userLocation, sendToMap]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'markerPress') {
          onMarkerPress(data.parkId);
        } else if (data.type === 'mapReady') {
          isReadyRef.current = true;
          // Send initial markers + user location
          if (markers.length > 0) {
            const parkMarkers: ParkMarker[] = markers.map((p) => ({
              id: p.id,
              name: p.name,
              latitude: p.latitude,
              longitude: p.longitude,
            }));
            sendToMap({ type: 'setMarkers', markers: parkMarkers });
          }
          if (userLocation) {
            sendToMap({
              type: 'setUserLocation',
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            });
          }
        }
      } catch {
        // Ignore parse errors
      }
    },
    [markers, onMarkerPress, userLocation, sendToMap],
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
