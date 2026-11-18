import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { WheatStalkGraphic } from '../../components/WheatStalkGraphic';
import { useFarm } from '../../context/FarmContext';

function formatSensorAge(ageSeconds: number | null | undefined): string {
  if (ageSeconds === null || ageSeconds === undefined) return 'Waiting for sensor';
  if (ageSeconds < 60) return `Updated ${ageSeconds}s ago`;
  const mins = Math.floor(ageSeconds / 60);
  if (mins < 60) return `Updated ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `Updated ${hrs}h ago`;
}

export default function HomeDashboardScreen() {
  const router = useRouter();
  const {
    farmDetails,
    getFirstName,
    unreadAlertCount,
    weather,
    cropStress,
    waterRequirement,
    timeToStress,
    sensorSnapshot,
    sensorHealth,
    latestReading,
    refreshing,
    refreshAll,
  } = useFarm();

  const firstName = getFirstName();
  const location = farmDetails?.location || 'Tumakuru, Karnataka';

  // Live Open-Meteo outdoor weather
  const weatherTemp = weather?.temp;
  const condition = weather?.condition || 'Loading weather...';
  const weatherIconName =
    weather?.icon === 'sunny'
      ? 'sunny'
      : weather?.icon === 'rainy'
      ? 'rainy'
      : weather?.icon === 'cloudy'
      ? 'cloudy'
      : 'partly-sunny';
  const windSpeed = weather?.wind_speed;
  const rainProb = weather?.rain_prob;
  const weatherHumidity = weather?.humidity;

  // Real sensor readings collected directly from the database (no mock numbers)
  const sensorMoisture = sensorSnapshot?.moisture ?? latestReading?.moisture ?? null;
  const sensorTemperature = sensorSnapshot?.temperature ?? latestReading?.soil_temp ?? null;
  const sensorHumidity = sensorSnapshot?.humidity ?? latestReading?.humidity ?? null;
  const sensorDeviceId = sensorSnapshot?.device_id || latestReading?.device_id || 'ROOTSENSE_001';
  const sensorAgeLabel = formatSensorAge(sensorHealth?.age_seconds);
  const sensorDotColor =
    sensorHealth?.status === 'green'
      ? Colors.oliveGreen
      : sensorHealth?.status === 'yellow'
      ? '#C98A2B'
      : sensorHealth?.status === 'red'
      ? Colors.error
      : Colors.mutedGrey;

  const hoursToStress = timeToStress?.hours_to_moderate;
  const healthStatus = cropStress?.status || 'Unknown';
  const healthNote = cropStress?.note || 'Waiting for live soil sensor reading.';
  const healthColor =
    healthStatus === 'High'
      ? Colors.error
      : healthStatus === 'Moderate'
      ? '#C98A2B'
      : healthStatus === 'Healthy'
      ? Colors.oliveGreen
      : Colors.mutedGrey;

  const irrigationDecision = waterRequirement?.decision || 'UNKNOWN';

  return (
    <View style={styles.backgroundImage}>
      <Image
        source={require('../../../assets/home-bg.jpg')}
        style={styles.bgImageLayer}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[
          'rgba(253, 242, 233, 0.52)',
          'rgba(253, 242, 233, 0.25)',
          'rgba(253, 242, 233, 0.05)',
        ]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
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
          {/* Top Header: Hello, Name 👋 + Notification Bell */}
          <View style={styles.topHeaderRow}>
            <View>
              <Text style={styles.greetingText}>
                Hello, <Text style={styles.userNameHighlight}>{firstName}</Text> 👋
              </Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={14} color={Colors.deepOlive} />
                <Text style={styles.locationText}>{location}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push('/notifications')}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color={Colors.charcoal} />
              {unreadAlertCount > 0 && <View style={styles.bellBadge} />}
            </TouchableOpacity>
          </View>

          {/* Live Field Sensor Telemetry Section (Moisture, Temperature & Humidity from DB) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sensorSectionHeader}>
              <Text style={styles.sectionHeaderTitle}>Live Field Sensors</Text>
              <TouchableOpacity
                style={styles.deviceStatusChip}
                onPress={() => router.push('/device/status')}
                activeOpacity={0.75}
              >
                <View style={[styles.liveDot, { backgroundColor: sensorDotColor }]} />
                <Text style={styles.deviceChipText}>
                  {sensorDeviceId} · {sensorAgeLabel}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sensorCardsRow}>
              {/* 1. Moisture (from DB sensor) */}
              <TouchableOpacity
                style={styles.sensorCard}
                onPress={() => router.push('/(tabs)/soil')}
                activeOpacity={0.85}
              >
                <View style={styles.sensorIconCircle}>
                  <Ionicons name="water" size={18} color={Colors.oliveGreen} />
                </View>
                <Text style={styles.sensorLabel}>Moisture</Text>
                <Text style={styles.sensorValue}>
                  {sensorMoisture !== null ? `${sensorMoisture}%` : '--'}
                </Text>
                <Text style={styles.sensorSub}>
                  {sensorMoisture !== null
                    ? hoursToStress !== null && hoursToStress !== undefined
                      ? `≈ ${hoursToStress}h stress`
                      : healthStatus
                    : 'No reading'}
                </Text>
              </TouchableOpacity>

              {/* 2. Temperature (from DB sensor) */}
              <TouchableOpacity
                style={styles.sensorCard}
                onPress={() => router.push('/device/status')}
                activeOpacity={0.85}
              >
                <View style={styles.sensorIconCircle}>
                  <Ionicons name="thermometer-outline" size={18} color={Colors.deepOlive} />
                </View>
                <Text style={styles.sensorLabel}>Temperature</Text>
                <Text style={styles.sensorValue}>
                  {sensorTemperature !== null ? `${sensorTemperature}°C` : '--'}
                </Text>
                <Text style={styles.sensorSub}>
                  {sensorTemperature !== null ? 'Field probe' : 'No reading'}
                </Text>
              </TouchableOpacity>

              {/* 3. Humidity (from DB sensor) */}
              <TouchableOpacity
                style={styles.sensorCard}
                onPress={() => router.push('/device/status')}
                activeOpacity={0.85}
              >
                <View style={styles.sensorIconCircle}>
                  <Ionicons name="water-outline" size={18} color={Colors.deepOlive} />
                </View>
                <Text style={styles.sensorLabel}>Humidity</Text>
                <Text style={styles.sensorValue}>
                  {sensorHumidity !== null ? `${sensorHumidity}%` : '--'}
                </Text>
                <Text style={styles.sensorSub}>
                  {sensorHumidity !== null ? 'Field RH' : 'No reading'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Weather Card (Real-Time Open-Meteo) */}
          <TouchableOpacity
            style={styles.weatherCard}
            onPress={() => router.push('/(tabs)/weather')}
            activeOpacity={0.9}
          >
            <View style={styles.weatherHeaderRow}>
              <View style={styles.tempColumn}>
                <View style={styles.tempRow}>
                  <Text style={styles.tempText}>
                    {weatherTemp !== undefined ? `${weatherTemp}°` : '--°'}
                  </Text>
                  <Ionicons
                    name={weatherIconName as any}
                    size={28}
                    color={Colors.goldenWheat}
                    style={styles.weatherIcon}
                  />
                </View>
                <Text style={styles.conditionText}>{condition}</Text>
              </View>

              <View style={styles.wheatGraphicWrapper}>
                <WheatStalkGraphic size={86} />
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricPill}>
                <Ionicons name="water-outline" size={17} color={Colors.deepOlive} />
                <View style={styles.metricTextGroup}>
                  <Text style={styles.metricLabel}>Air Humidity</Text>
                  <Text style={styles.metricValue}>
                    {weatherHumidity !== undefined ? `${weatherHumidity}%` : '--'}
                  </Text>
                </View>
              </View>

              <View style={styles.metricPill}>
                <Ionicons name="speedometer-outline" size={17} color={Colors.deepOlive} />
                <View style={styles.metricTextGroup}>
                  <Text style={styles.metricLabel}>Wind</Text>
                  <Text style={styles.metricValue}>
                    {windSpeed !== undefined ? `${windSpeed} m/s` : '--'}
                  </Text>
                </View>
              </View>

              <View style={styles.metricPill}>
                <Ionicons name="rainy-outline" size={17} color={Colors.deepOlive} />
                <View style={styles.metricTextGroup}>
                  <Text style={styles.metricLabel}>Rain Prob.</Text>
                  <Text style={styles.metricValue}>
                    {rainProb !== undefined ? `${rainProb}%` : '--'}
                  </Text>
                </View>
              </View>

              <View style={styles.metricPill}>
                <Ionicons name="leaf-outline" size={17} color={Colors.deepOlive} />
                <View style={styles.metricTextGroup}>
                  <Text style={styles.metricLabel}>Irrigation</Text>
                  <Text style={styles.metricValue}>{irrigationDecision}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* 4-Feature Quick Hub: Sensor Data, Irrigation Advice, Time to Stress, Seed Calendar */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderTitle}>Field Intelligence</Text>
            <View style={styles.featureHubGrid}>
              {/* 1. Sensor Data */}
              <TouchableOpacity
                style={styles.featureHubCard}
                onPress={() => router.push('/sensor-data')}
                activeOpacity={0.85}
              >
                <View style={[styles.hubIconCircle, { backgroundColor: '#EBF2DB' }]}>
                  <Ionicons name="hardware-chip-outline" size={21} color={Colors.oliveGreen} />
                </View>
                <Text style={styles.hubTitle}>Sensor Data</Text>
                <Text style={styles.hubSub} numberOfLines={1}>
                  Moisture · RH · Temp
                </Text>
              </TouchableOpacity>

              {/* 2. Irrigation Advice */}
              <TouchableOpacity
                style={styles.featureHubCard}
                onPress={() => router.push('/irrigation-advice')}
                activeOpacity={0.85}
              >
                <View style={[styles.hubIconCircle, { backgroundColor: Colors.palePeach }]}>
                  <Ionicons name="water-outline" size={21} color={Colors.deepOlive} />
                </View>
                <Text style={styles.hubTitle}>Irrigation Advice</Text>
                <Text style={styles.hubSub} numberOfLines={1}>
                  Verdict: {irrigationDecision}
                </Text>
              </TouchableOpacity>

              {/* 3. Time to Stress */}
              <TouchableOpacity
                style={styles.featureHubCard}
                onPress={() => router.push('/time-to-stress')}
                activeOpacity={0.85}
              >
                <View style={[styles.hubIconCircle, { backgroundColor: '#FEF5E7' }]}>
                  <Ionicons name="hourglass-outline" size={21} color="#C98A2B" />
                </View>
                <Text style={styles.hubTitle}>Time to Stress</Text>
                <Text style={styles.hubSub} numberOfLines={1}>
                  {hoursToStress !== null && hoursToStress !== undefined
                    ? `≈ ${hoursToStress} hrs left`
                    : healthStatus}
                </Text>
              </TouchableOpacity>

              {/* 4. Seed Calendar */}
              <TouchableOpacity
                style={styles.featureHubCard}
                onPress={() => router.push('/seed-calendar')}
                activeOpacity={0.85}
              >
                <View style={[styles.hubIconCircle, { backgroundColor: Colors.lightSage }]}>
                  <Ionicons name="calendar-outline" size={21} color={Colors.deepOlive} />
                </View>
                <Text style={styles.hubTitle}>Seed Calendar</Text>
                <Text style={styles.hubSub} numberOfLines={1}>
                  Yield &amp; AI Stages
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Crop Health Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderTitle}>Crop Health</Text>

            <TouchableOpacity
              style={styles.cropHealthCard}
              onPress={() => router.push('/(tabs)/soil')}
              activeOpacity={0.85}
            >
              <View style={styles.cropHealthLeft}>
                <View style={styles.plantIconCircle}>
                  <Ionicons name="leaf" size={24} color={healthColor} />
                </View>
                <View style={styles.cropHealthTextGroup}>
                  <Text style={[styles.healthStatusTitle, { color: healthColor }]}>
                    {healthStatus}
                  </Text>
                  <Text style={styles.healthStatusDesc} numberOfLines={2}>
                    {healthNote}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.mutedGrey} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: Colors.warmIvory,
  },
  bgImageLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 96,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.charcoal,
    letterSpacing: -0.3,
  },
  userNameHighlight: {
    color: Colors.charcoal,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(252, 238, 220, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.sandBeige,
    ...Shadows.soft,
  },
  bellBadge: {
    position: 'absolute',
    top: 7,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  sectionContainer: {
    marginBottom: Spacing.md,
  },
  sensorSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  deviceStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 238, 220, 0.92)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  deviceChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
  sensorCardsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sensorCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.93)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    ...Shadows.soft,
  },
  sensorIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EBF2DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  sensorLabel: {
    fontSize: 11,
    color: Colors.mutedGrey,
    fontWeight: '600',
  },
  sensorValue: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.charcoal,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  sensorSub: {
    fontSize: 10,
    color: Colors.oliveGreen,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  weatherCard: {
    backgroundColor: 'rgba(252, 238, 220, 0.9)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  weatherHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tempColumn: {
    flex: 1,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempText: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.charcoal,
    letterSpacing: -1,
  },
  weatherIcon: {
    marginLeft: 8,
  },
  conditionText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.mutedGrey,
    fontWeight: '600',
    marginTop: 2,
  },
  wheatGraphicWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricPill: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: 9,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  metricTextGroup: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10.5,
    color: Colors.mutedGrey,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.charcoal,
    marginTop: 1,
  },
  cropHealthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
    ...Shadows.soft,
  },
  cropHealthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  plantIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropHealthTextGroup: {
    flex: 1,
    gap: 2,
  },
  healthStatusTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.oliveGreen,
  },
  healthStatusDesc: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.textSecondary,
  },
  featureHubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  featureHubCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  hubIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  hubTitle: {
    fontSize: Typography.fontSizes.sm + 1,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  hubSub: {
    fontSize: 11,
    color: Colors.oliveGreen,
    fontWeight: '600',
    marginTop: 2,
  },
});
