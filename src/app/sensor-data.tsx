import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Header } from '../components/Header';
import { useFarm } from '../context/FarmContext';

function formatTimestamp(iso?: string | null): string {
  if (!iso) return 'No reading received yet';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'No reading received yet';
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function SensorDataScreen() {
  const router = useRouter();
  const {
    sensorSnapshot,
    latestReading,
    sensorHealth,
    soilHistory,
    cropStress,
    fastApiConnected,
    refreshing,
    refreshAll,
  } = useFarm();

  const [fetchingNow, setFetchingNow] = useState(false);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const handleManualFetch = async () => {
    setFetchingNow(true);
    await refreshAll();
    setFetchingNow(false);
  };

  const moisture = sensorSnapshot?.moisture ?? latestReading?.moisture ?? null;
  const humidity = sensorSnapshot?.humidity ?? latestReading?.humidity ?? null;
  const soilTemp = sensorSnapshot?.temperature ?? latestReading?.soil_temp ?? null;
  const deviceId = sensorSnapshot?.device_id || latestReading?.device_id || 'ROOTSENSE_001';
  const updatedAt = sensorSnapshot?.timestamp || latestReading?.timestamp || null;

  const lowWarn = cropStress?.thresholds.lowWarn ?? 32;
  const lowCritical = cropStress?.thresholds.lowCritical ?? 22;

  const moistureStatus =
    moisture === null
      ? { label: 'Waiting for Sensor', color: Colors.mutedGrey }
      : moisture <= lowCritical
      ? { label: 'Critical Dry', color: Colors.error }
      : moisture <= lowWarn
      ? { label: 'Low Moisture', color: '#C98A2B' }
      : moisture >= 75
      ? { label: 'Over-Saturated', color: '#3498DB' }
      : { label: 'Optimal Range', color: Colors.oliveGreen };

  const humidityStatus =
    humidity === null
      ? { label: 'Waiting for Sensor', color: Colors.mutedGrey }
      : humidity >= 80
      ? { label: 'High (Fungal Watch)', color: '#C98A2B' }
      : humidity < 35
      ? { label: 'Dry Air', color: '#C98A2B' }
      : { label: 'Balanced RH', color: Colors.oliveGreen };

  const tempStatus =
    soilTemp === null
      ? { label: 'Waiting for Sensor', color: Colors.mutedGrey }
      : soilTemp >= 34
      ? { label: 'High Root Heat', color: Colors.error }
      : soilTemp < 16
      ? { label: 'Cool Soil', color: '#3498DB' }
      : { label: 'Ideal Root Temp', color: Colors.oliveGreen };

  const recentPackets = (soilHistory?.readings || []).slice(-6).reverse();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Sensor Data"
        subtitle="Live hardware readings from field"
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={handleManualFetch}
            disabled={fetchingNow}
            activeOpacity={0.75}
          >
            {fetchingNow ? (
              <ActivityIndicator size="small" color={Colors.oliveGreen} />
            ) : (
              <Ionicons name="refresh" size={18} color={Colors.deepOlive} />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshAll}
            tintColor={Colors.oliveGreen}
          />
        }
      >
        {/* Device Connection Strip */}
        <View style={styles.deviceBanner}>
          <View style={styles.deviceLeft}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    sensorHealth?.status === 'green'
                      ? Colors.oliveGreen
                      : sensorHealth?.status === 'yellow'
                      ? '#C98A2B'
                      : Colors.error,
                },
              ]}
            />
            <View>
              <Text style={styles.deviceTitle}>
                {deviceId} · {fastApiConnected ? 'FastAPI Connected' : 'Synced Cache'}
              </Text>
              <Text style={styles.deviceTime}>Last Packet: {formatTimestamp(updatedAt)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.configPill}
            onPress={() => router.push('/device/status')}
            activeOpacity={0.75}
          >
            <Text style={styles.configPillText}>Device</Text>
            <Ionicons name="chevron-forward" size={12} color={Colors.deepOlive} />
          </TouchableOpacity>
        </View>

        {/* a. MOISTURE CARD */}
        <View style={styles.metricHeroCard}>
          <View style={styles.metricTopRow}>
            <View style={styles.metricTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="water" size={22} color={Colors.oliveGreen} />
              </View>
              <View>
                <Text style={styles.metricOverline}>SENSOR A · SOIL MOISTURE</Text>
                <Text style={styles.metricBigValue}>
                  {moisture !== null ? `${moisture}%` : '--'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { borderColor: moistureStatus.color }]}>
              <Text style={[styles.statusBadgeText, { color: moistureStatus.color }]}>
                {moistureStatus.label}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${moisture !== null ? Math.max(2, Math.min(100, moisture)) : 0}%`,
                  backgroundColor: moistureStatus.color,
                },
              ]}
            />
          </View>
          <View style={styles.scaleRow}>
            <Text style={styles.scaleText}>0% Dry</Text>
            <Text style={styles.scaleText}>Warn: {lowWarn}%</Text>
            <Text style={styles.scaleText}>100% Wet</Text>
          </View>
        </View>

        {/* b. HUMIDITY CARD */}
        <View style={styles.metricHeroCard}>
          <View style={styles.metricTopRow}>
            <View style={styles.metricTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="water-outline" size={22} color={Colors.deepOlive} />
              </View>
              <View>
                <Text style={styles.metricOverline}>SENSOR B · HUMIDITY</Text>
                <Text style={styles.metricBigValue}>
                  {humidity !== null ? `${humidity}% RH` : '--'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { borderColor: humidityStatus.color }]}>
              <Text style={[styles.statusBadgeText, { color: humidityStatus.color }]}>
                {humidityStatus.label}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${humidity !== null ? Math.max(2, Math.min(100, humidity)) : 0}%`,
                  backgroundColor: humidityStatus.color,
                },
              ]}
            />
          </View>
          <View style={styles.scaleRow}>
            <Text style={styles.scaleText}>0% Arid</Text>
            <Text style={styles.scaleText}>Ideal: 45–75%</Text>
            <Text style={styles.scaleText}>100% Humid</Text>
          </View>
        </View>

        {/* c. SOIL TEMPERATURE CARD */}
        <View style={styles.metricHeroCard}>
          <View style={styles.metricTopRow}>
            <View style={styles.metricTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="thermometer-outline" size={22} color={Colors.deepOlive} />
              </View>
              <View>
                <Text style={styles.metricOverline}>SENSOR C · SOIL TEMPERATURE</Text>
                <Text style={styles.metricBigValue}>
                  {soilTemp !== null ? `${soilTemp} °C` : '--'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { borderColor: tempStatus.color }]}>
              <Text style={[styles.statusBadgeText, { color: tempStatus.color }]}>
                {tempStatus.label}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    soilTemp !== null
                      ? Math.max(2, Math.min(100, ((soilTemp - 5) / 45) * 100))
                      : 0
                  }%`,
                  backgroundColor: tempStatus.color,
                },
              ]}
            />
          </View>
          <View style={styles.scaleRow}>
            <Text style={styles.scaleText}>5 °C Cool</Text>
            <Text style={styles.scaleText}>Ideal: 20–32 °C</Text>
            <Text style={styles.scaleText}>50 °C Hot</Text>
          </View>
        </View>

        {/* Action Button to Refresh Live Sensor Data */}
        <TouchableOpacity
          style={styles.fetchButton}
          onPress={handleManualFetch}
          disabled={fetchingNow}
          activeOpacity={0.86}
        >
          <Ionicons name="sync" size={18} color={Colors.pureWhite} />
          <Text style={styles.fetchButtonText}>
            {fetchingNow ? 'Fetching Sensor Readings...' : 'Fetch Latest Sensor Data'}
          </Text>
        </TouchableOpacity>

        {/* Recent Sensor Readings Log */}
        <View style={styles.logCard}>
          <Text style={styles.logTitle}>Recent Sensor Readings</Text>
          {recentPackets.length === 0 ? (
            <Text style={styles.emptyLog}>
              No sensor readings recorded yet. Power on your ESP32 sensor or post to FastAPI.
            </Text>
          ) : (
            recentPackets.map((pkt, idx) => (
              <View
                key={`${pkt.id}-${idx}`}
                style={[
                  styles.logRow,
                  idx === recentPackets.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View>
                  <Text style={styles.logDevice}>{pkt.device_id}</Text>
                  <Text style={styles.logTime}>{formatTimestamp(pkt.timestamp)}</Text>
                </View>
                <View style={styles.logMetrics}>
                  <Text style={styles.logVal}>💧 {pkt.moisture}%</Text>
                  <Text style={styles.logVal}>🌡️ {pkt.soil_temp}°C</Text>
                  <Text style={styles.logVal}>
                    💨 {pkt.humidity !== null ? `${pkt.humidity}%` : '--'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.warmIvory,
  },
  refreshIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.softCream,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  deviceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
  },
  deviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    flex: 1,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  deviceTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  deviceTime: {
    fontSize: 11,
    color: Colors.mutedGrey,
    marginTop: 2,
  },
  configPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.palePeach,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.goldenWheat,
  },
  configPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
  metricHeroCard: {
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricOverline: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mutedGrey,
    letterSpacing: 0.6,
  },
  metricBigValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.charcoal,
    marginTop: 1,
    letterSpacing: -0.5,
  },
  statusBadge: {
    borderWidth: 1.2,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.warmIvory,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.softCream,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.sandBeige,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  scaleText: {
    fontSize: 10.5,
    color: Colors.mutedGrey,
    fontWeight: '600',
  },
  fetchButton: {
    height: 50,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.oliveGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  fetchButtonText: {
    color: Colors.pureWhite,
    fontSize: Typography.fontSizes.sm + 1,
    fontWeight: '700',
  },
  logCard: {
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  logTitle: {
    fontSize: Typography.fontSizes.sm + 1,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: Spacing.sm,
  },
  emptyLog: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.mutedGrey,
    lineHeight: 18,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.sandBeige,
  },
  logDevice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
  logTime: {
    fontSize: 10.5,
    color: Colors.mutedGrey,
    marginTop: 1,
  },
  logMetrics: {
    flexDirection: 'row',
    gap: 10,
  },
  logVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.charcoal,
  },
});
