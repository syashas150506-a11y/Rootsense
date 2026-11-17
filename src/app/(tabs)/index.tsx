import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { WheatStalkGraphic } from '../../components/WheatStalkGraphic';
import { useFarm } from '../../context/FarmContext';

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
    soilHistory,
    refreshing,
    refreshAll,
  } = useFarm();

  const firstName = getFirstName();
  const location = farmDetails?.location || 'Tumakuru, Karnataka';
  const temp = weather?.temp ?? 32;
  const condition = weather?.condition || 'Partly Cloudy';
  const humidity = weather?.humidity ?? 64;
  const windSpeed = weather?.wind_speed ?? 7;
  const rainProb = weather?.rain_prob ?? 20;
  const moisture = farmDetails?.soilMoisture ?? 38.5;
  const hoursToStress = timeToStress?.hours_to_moderate ?? farmDetails?.timeUntilStressHours ?? 12;

  const latestReading = soilHistory?.readings?.[soilHistory.readings.length - 1];
  const soilTemp = latestReading?.soil_temp ?? 27;

  const healthStatus = cropStress?.status || 'Healthy';
  const healthNote = cropStress?.note || 'Your crop is in good condition.';
  const healthColor =
    healthStatus === 'High'
      ? Colors.error
      : healthStatus === 'Moderate'
      ? '#C98A2B'
      : Colors.oliveGreen;

  const irrigationDecision = waterRequirement?.decision || 'WAIT';

  return (
    <ImageBackground
      source={require('../../../assets/home-bg.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Subtle luminous veil so typography stays crisp while terraced fields glow below */}
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

            {/* Bell Icon with badge */}
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push('/notifications')}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color={Colors.charcoal} />
              {unreadAlertCount > 0 && <View style={styles.bellBadge} />}
            </TouchableOpacity>
          </View>

          {/* Weather Card */}
          <View style={styles.weatherCard}>
            <View style={styles.weatherHeaderRow}>
              <View style={styles.tempColumn}>
                <View style={styles.tempRow}>
                  <Text style={styles.tempText}>{temp}°</Text>
                  <Ionicons
                    name="partly-sunny"
                    size={28}
                    color={Colors.goldenWheat}
                    style={styles.weatherIcon}
                  />
                </View>
                <Text style={styles.conditionText}>{condition}</Text>
              </View>

              <View style={styles.wheatGraphicWrapper}>
                <WheatStalkGraphic size={90} />
              </View>
            </View>

            {/* 4 Metric Pills (2x2 Grid) */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricPill}>
                <Ionicons name="thermometer-outline" size={18} color={Colors.deepOlive} />
                <View style={styles.metricTextGroup}>
                  <Text style={styles.metricLabel}>Soil Temp</Text>
                  <Text style={styles.metricValue}>+{Math.round(soilTemp)} °C</Text>
                </View>
              </View>

              <View style={styles.metricPill}>
                <Ionicons name="water-outline" size={18} color={Colors.deepOlive} />
                <View style={styles.metricTextGroup}>
                  <Text style={styles.metricLabel}>Humidity</Text>
                  <Text style={styles.metricValue}>{humidity}%</Text>
                </View>
              </View>

              <View style={styles.metricPill}>
                <Ionicons name="speedometer-outline" size={18} color={Colors.deepOlive} />
                <View style={styles.metricTextGroup}>
                  <Text style={styles.metricLabel}>Wind</Text>
                  <Text style={styles.metricValue}>{windSpeed} m/s</Text>
                </View>
              </View>

              <View style={styles.metricPill}>
                <Ionicons name="rainy-outline" size={18} color={Colors.deepOlive} />
                <View style={styles.metricTextGroup}>
                  <Text style={styles.metricLabel}>Rain Prob.</Text>
                  <Text style={styles.metricValue}>{rainProb}%</Text>
                </View>
              </View>
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

          {/* Quick Live Moisture & Irrigation Glance Cards */}
          <View style={styles.quickCardsRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push('/(tabs)/soil')}
              activeOpacity={0.85}
            >
              <View style={styles.quickIconCircle}>
                <Ionicons name="water" size={18} color={Colors.oliveGreen} />
              </View>
              <Text style={styles.quickLabel}>Soil Moisture</Text>
              <Text style={styles.quickValue}>{moisture}%</Text>
              <Text style={styles.quickHint}>≈ {hoursToStress}h to stress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push('/(tabs)/weather')}
              activeOpacity={0.85}
            >
              <View style={styles.quickIconCircle}>
                <Ionicons name="rainy" size={18} color={Colors.deepOlive} />
              </View>
              <Text style={styles.quickLabel}>Irrigation</Text>
              <Text style={styles.quickValue}>{irrigationDecision}</Text>
              <Text style={styles.quickHint} numberOfLines={1}>
                {farmDetails?.cropGrown || 'Ragi'} · {farmDetails?.irrigationType || 'Drip'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: Colors.warmIvory,
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
    marginBottom: Spacing.lg,
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
  weatherCard: {
    backgroundColor: 'rgba(252, 238, 220, 0.9)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
    marginBottom: Spacing.lg,
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
    fontSize: 38,
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
    paddingVertical: 10,
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
  sectionContainer: {
    marginBottom: Spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: Spacing.sm,
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
  quickCardsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  quickCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  quickIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EBF2DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs + 2,
  },
  quickLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
    fontWeight: '600',
  },
  quickValue: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: '800',
    color: Colors.charcoal,
    marginTop: 2,
  },
  quickHint: {
    fontSize: 11,
    color: Colors.oliveGreen,
    fontWeight: '600',
    marginTop: 2,
  },
});
