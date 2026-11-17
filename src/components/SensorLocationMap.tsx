import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface SensorLocationMapProps {
  latitude: number;
  longitude: number;
  locationName: string;
  deviceId: string;
  moisture: number;
  status: string;
  cropName: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const SensorLocationMap: React.FC<SensorLocationMapProps> = ({
  latitude,
  longitude,
  locationName,
  deviceId,
  moisture,
  status,
  cropName,
}) => {
  const isOnline = status.toLowerCase() === 'online';
  const markerColor = isOnline ? '#647A13' : '#C65A42';

  const mapHtml = useMemo(() => {
    const safeDevice = escapeHtml(deviceId);
    const safeLocation = escapeHtml(locationName);
    const safeCrop = escapeHtml(cropName);
    const safeStatus = escapeHtml(status);

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #FCEEDC;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .leaflet-control-attribution {
        font-size: 9px !important;
        background: rgba(253, 242, 233, 0.85) !important;
        color: #77756E !important;
      }
      .sensor-pin-wrap {
        position: relative;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .sensor-pulse {
        position: absolute;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: ${markerColor};
        opacity: 0.28;
        animation: pulse 2s ease-out infinite;
      }
      .sensor-dot {
        position: relative;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: ${markerColor};
        border: 3px solid #FFFFFF;
        box-shadow: 0 2px 6px rgba(37, 37, 31, 0.35);
      }
      @keyframes pulse {
        0% { transform: scale(0.75); opacity: 0.45; }
        70% { transform: scale(1.6); opacity: 0; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      .leaflet-popup-content-wrapper {
        background: #FDF2E9;
        color: #25251F;
        border: 1px solid #ECE0C2;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(37, 37, 31, 0.14);
      }
      .leaflet-popup-tip {
        background: #FDF2E9;
      }
      .popup-title {
        font-weight: 700;
        font-size: 13px;
        color: #3E5208;
        margin-bottom: 2px;
      }
      .popup-meta {
        font-size: 11px;
        color: #77756E;
        line-height: 1.45;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var lat = ${latitude};
      var lng = ${longitude};
      var map = L.map('map', {
        center: [lat, lng],
        zoom: 13,
        zoomControl: true,
        attributionControl: true
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      L.circle([lat, lng], {
        color: '${markerColor}',
        fillColor: '${markerColor}',
        fillOpacity: 0.12,
        weight: 1.5,
        radius: 450
      }).addTo(map);

      var pinIcon = L.divIcon({
        className: '',
        html: '<div class="sensor-pin-wrap"><div class="sensor-pulse"></div><div class="sensor-dot"></div></div>',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -14]
      });

      var marker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
      marker.bindPopup(
        '<div class="popup-title">${safeDevice} &bull; ${safeStatus}</div>' +
        '<div class="popup-meta">${safeCrop} &bull; Moisture: <b>${moisture}%</b><br/>${safeLocation}</div>'
      ).openPopup();
    </script>
  </body>
</html>`;
  }, [latitude, longitude, locationName, deviceId, moisture, status, cropName, markerColor]);

  const handleOpenExternal = () => {
    const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=14/${latitude}/${longitude}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.card}>
      {/* Map Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.pinBadge}>
            <Ionicons name="location" size={16} color={Colors.oliveGreen} />
          </View>
          <View>
            <Text style={styles.title}>Sensor Field Location</Text>
            <Text style={styles.coordsText}>
              {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.openBtn}
          onPress={handleOpenExternal}
          activeOpacity={0.75}
        >
          <Ionicons name="open-outline" size={13} color={Colors.deepOlive} />
          <Text style={styles.openBtnText}>Open</Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Free OpenStreetMap + Leaflet Canvas */}
      <View style={styles.mapFrame}>
        {Platform.OS === 'web' ? (
          React.createElement('iframe', {
            srcDoc: mapHtml,
            style: {
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            },
            title: 'Root Sense Sensor Map',
            loading: 'lazy',
          })
        ) : (
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.webview}
            scrollEnabled={false}
            javaScriptEnabled
            domStorageEnabled
          />
        )}
      </View>

      {/* Footer Info Strip */}
      <View style={styles.footerRow}>
        <View style={styles.footerLeft}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? Colors.oliveGreen : Colors.error },
            ]}
          />
          <Text style={styles.footerText}>
            {deviceId} · {locationName}
          </Text>
        </View>
        <Text style={styles.moistureTag}>{moisture}% Moisture</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.softCream,
    borderBottomWidth: 1,
    borderBottomColor: Colors.sandBeige,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pinBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  coordsText: {
    fontSize: 11,
    color: Colors.mutedGrey,
    marginTop: 1,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.palePeach,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.goldenWheat,
  },
  openBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
  mapFrame: {
    width: '100%',
    height: 215,
    backgroundColor: Colors.softCream,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.softCream,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    backgroundColor: Colors.pureWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.sandBeige,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  footerText: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  moistureTag: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
});
