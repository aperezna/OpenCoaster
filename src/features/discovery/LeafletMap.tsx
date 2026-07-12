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
    .park-popup { min-width: 180px; }
    .park-popup .popup-name { font-size: 15px; font-weight: 700; margin-bottom: 2px; color: #222; }
    .park-popup .popup-location { font-size: 12px; color: #666; margin-bottom: 4px; }
    .park-popup .popup-distance { font-size: 12px; color: #007AFF; font-weight: 500; margin-bottom: 8px; }
    .park-popup .popup-btn {
      display: inline-block;
      background: #007AFF;
      color: #fff;
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      border: none;
      width: 100%;
      text-align: center;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false,
    }).setView([${initialRegion.latitude}, ${initialRegion.longitude}], 3);

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
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
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
            var popupHtml = '<div class="park-popup">' +
              '<div class="popup-name">' + park.name + '</div>';
            if (park.city && park.country) {
              popupHtml += '<div class="popup-location">' + park.city + ', ' + park.country + '</div>';
            }
            if (park.distanceText) {
              popupHtml += '<div class="popup-distance">' + park.distanceText + '</div>';
            }
            popupHtml += '<button class="popup-btn" id="view-park-' + park.id + '">Ver m&aacute;s</button>' +
              '</div>';
            marker.bindPopup(popupHtml);

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
// Helpers
// ---------------------------------------------------------------------------

/** Earth radius in km for Haversine distance */
const EARTH_RADIUS_KM = 6371;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParkMarker {
  id: string;
  name: string;
  city: string;
  country: string;
  distanceText?: string;
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
    const parkMarkers: ParkMarker[] = markers.map((p) => {
      const marker: ParkMarker = {
        id: p.id,
        name: p.name,
        city: p.city,
        country: p.country,
        latitude: p.latitude,
        longitude: p.longitude,
      };
      if (userLocation) {
        const dist = haversineKm(
          userLocation.latitude,
          userLocation.longitude,
          p.latitude,
          p.longitude,
        );
        marker.distanceText = formatDistance(dist);
      }
      return marker;
    });
    sendToMap({ type: 'setMarkers', markers: parkMarkers });
  }, [markers, userLocation, sendToMap]);

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
            const parkMarkers: ParkMarker[] = markers.map((p) => {
              const marker: ParkMarker = {
                id: p.id,
                name: p.name,
                city: p.city,
                country: p.country,
                latitude: p.latitude,
                longitude: p.longitude,
              };
              if (userLocation) {
                const dist = haversineKm(
                  userLocation.latitude,
                  userLocation.longitude,
                  p.latitude,
                  p.longitude,
                );
                marker.distanceText = formatDistance(dist);
              }
              return marker;
            });
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
