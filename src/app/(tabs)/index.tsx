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

  return (
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
            {unreadAlertCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadAlertCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Weather Card (Screen 3) */}
        <View style={styles.weatherCard}>
          {/* Top Row: Temp + Golden Wheat illustration */}
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

            {/* Golden Wheat illustration from design */}
            <View style={styles.wheatGraphicWrapper}>
              <WheatStalkGraphic size={90} />
            </View>
          </View>

          {/* 4 Metric Pills (2x2 Grid) */}
          <View style={styles.metricsGrid}>
            {/* 1. Soil Temp */}
            <View style={styles.metricPill}>
              <Ionicons name="thermometer-outline" size={18} color={Colors.deepOlive} />
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricLabel}>Soil Temp</Text>
                <Text style={styles.metricValue}>+{Math.round(soilTemp)} °C</Text>
              </View>
            </View>

            {/* 2. Humidity */}
            <View style={styles.metricPill}>
              <Ionicons name="water-outline" size={18} color={Colors.deepOlive} />
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricLabel}>Humidity</Text>
                <Text style={styles.metricValue}>{humidity}%</Text>
              </View>
            </View>

            {/* 3. Wind */}
            <View style={styles.metricPill}>
              <Ionicons name="speedometer-outline" size={18} color={Colors.deepOlive} />
              <View style={styles.metricTextGroup}>
                <Text style={styles.metricLabel}>Wind</Text>
                <Text style={styles.metricValue}>{windSpeed} m/s</Text>
              </View>
            </View>

            {/* 4. Rain Prob */}
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

        {/* Scenic Farm Landscape Photo Card */}
        <View style={styles.landscapePhotoCard}>
          <Image
            source={require('../../../assets/splash-crop.jpg')}
            style={styles.landscapeImage}
            resizeMode="cover"
          />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
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
    color: Colors.mutedGrey,
    fontWeight: '500',
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.softCream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.sandBeige,
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  bellBadgeText: {
    display: 'none',
  },
  weatherCard: {
    backgroundColor: Colors.softCream,
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
    backgroundColor: Colors.pureWhite,
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
    marginBottom: Spacing.lg,
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
    backgroundColor: Colors.pureWhite,
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
  landscapePhotoCard: {
    height: 140,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.sandBeige,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  landscapeImage: {
    width: '100%',
    height: '100%',
  },
});
