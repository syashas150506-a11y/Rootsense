import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { SoilMoistureGauge } from '../../components/SoilMoistureGauge';
import { useFarm } from '../../context/FarmContext';

export default function SensorStatusScreen() {
  const router = useRouter();
  const { farmDetails, device, latestReading, sensorHealth, refreshAll } = useFarm();

  const deviceId = latestReading?.device_id || device?.device_id || farmDetails?.deviceId || 'ROOTSENSE_001';
  const moisture = latestReading?.moisture ?? farmDetails?.soilMoisture ?? 38.5;
  const fieldTemp = latestReading?.soil_temp ?? 27.0;
  const fieldHumidity = latestReading?.humidity ?? 64.0;
  const signalDbm = device?.signal_dbm ?? -62;
  const ageSeconds = sensorHealth?.age_seconds;
  const lastReceivedText =
    ageSeconds === null || ageSeconds === undefined
      ? '45 seconds ago'
      : ageSeconds < 60
      ? `${ageSeconds} seconds ago`
      : `${Math.round(ageSeconds / 60)} min ago`;
  const healthLabel =
    sensorHealth?.status === 'green'
      ? 'Good'
      : sensorHealth?.status === 'yellow'
      ? 'Delayed'
      : sensorHealth?.status === 'red'
      ? 'Check Connection'
      : 'Good';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header matching Screen 11 */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
          </TouchableOpacity>
          <View>
            <Text style={styles.deviceIdText}>{deviceId}</Text>
            <View style={styles.onlineBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.actionIconButton} onPress={refreshAll}>
            <Ionicons name="refresh-outline" size={20} color={Colors.charcoal} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.charcoal} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Big Hero Circle with Plant, Soil and 38.5% */}
        <View style={styles.gaugeHeroCard}>
          <SoilMoistureGauge
            percentage={moisture}
            statusText=""
            size={220}
          />
        </View>

        {/* Status Rows Card matching Screen 11 */}
        <View style={styles.infoCardList}>
          {/* 1. Signal Strength */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="wifi" size={20} color={Colors.deepOlive} />
              </View>
              <View>
                <Text style={styles.infoTitle}>Signal Strength</Text>
                <Text style={styles.infoSubtitle}>Excellent ({signalDbm} dBm)</Text>
              </View>
            </View>

            {/* Signal Bars graphic */}
            <View style={styles.signalBars}>
              <View style={[styles.bar, { height: 8 }]} />
              <View style={[styles.bar, { height: 12 }]} />
              <View style={[styles.bar, { height: 16 }]} />
              <View style={[styles.bar, { height: 20 }]} />
            </View>
          </View>

          {/* 2. Last Data Received */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="time-outline" size={20} color={Colors.deepOlive} />
              </View>
              <View>
                <Text style={styles.infoTitle}>Last Data Received</Text>
                <Text style={styles.infoSubtitle}>{lastReceivedText}</Text>
              </View>
            </View>
          </View>

          {/* Live Field Temperature & Humidity from ESP32 */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="thermometer-outline" size={20} color={Colors.deepOlive} />
              </View>
              <View>
                <Text style={styles.infoTitle}>Field Temp &amp; Humidity</Text>
                <Text style={styles.infoSubtitle}>
                  {fieldTemp}°C · {fieldHumidity}% RH
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Sensor Health */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.deepOlive} />
              </View>
              <View>
                <Text style={styles.infoTitle}>Sensor Health</Text>
                <Text style={styles.infoSubtitle}>{healthLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick link to Soil Details */}
        <TouchableOpacity
          style={styles.soilHistoryButton}
          onPress={() => router.push('/(tabs)/soil')}
          activeOpacity={0.8}
        >
          <Text style={styles.soilHistoryText}>View Soil History & Heatmap</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.oliveGreen} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.warmIvory,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.sandBeige,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.softCream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.sandBeige,
  },
  deviceIdText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.oliveGreen,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveGreen,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  gaugeHeroCard: {
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.sandBeige,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  infoCardList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.pureWhite,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  infoCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
    fontWeight: '600',
  },
  infoSubtitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
    marginTop: 2,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: Colors.oliveGreen,
  },
  soilHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.softCream,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  soilHistoryText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
});
