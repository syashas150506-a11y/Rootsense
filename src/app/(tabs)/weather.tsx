import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useFarm } from '../../context/FarmContext';

export default function WeatherIntelligenceScreen() {
  const { weather, waterRequirement, farmDetails, refreshing, refreshAll } = useFarm();

  const temp = weather?.temp ?? 28;
  const condition = weather?.condition || 'Partly Cloudy';
  const humidity = weather?.humidity ?? 64;
  const rainProb = weather?.rain_prob ?? 20;
  const rainMm = weather?.rain_mm ?? 2.4;
  const advice =
    waterRequirement?.advice ||
    'Rain is expected tomorrow. Consider delaying irrigation to conserve water.';

  const forecastDays =
    weather?.forecast && weather.forecast.length > 0
      ? weather.forecast
      : [
          { day: 'Tue', icon: 'partly-sunny', high: 28, low: 18 },
          { day: 'Wed', icon: 'rainy', high: 27, low: 19 },
          { day: 'Thu', icon: 'sunny', high: 26, low: 18 },
          { day: 'Fri', icon: 'sunny', high: 27, low: 19 },
          { day: 'Sat', icon: 'partly-sunny', high: 28, low: 20 },
        ];

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
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTitle}>Weather Intelligence</Text>
            <Text style={styles.locationSub}>
              {weather?.location_name || farmDetails?.location || 'Tumakuru, Karnataka'}
              {weather?.source === 'met-norway-live' ? ' · MET Norway Live' : ''}
            </Text>
          </View>
        </View>

        {/* Big Sky Blue Weather Card */}
        <View style={styles.skyCard}>
          <LinearGradient
            colors={['#74A9D8', '#99C4E9', '#BEE0FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.skyGradient}
          >
            <View style={styles.skyContent}>
              <Text style={styles.skyTemp}>{temp}°C</Text>
              <Text style={styles.skyCondition}>{condition}</Text>
            </View>

            <View style={styles.cloudIconWrapper}>
              <Ionicons name="cloud" size={82} color="rgba(255, 255, 255, 0.75)" />
            </View>
          </LinearGradient>
        </View>

        {/* 3 Metric Cards in a Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Ionicons name="water-outline" size={22} color={Colors.deepOlive} />
            <Text style={styles.metricValue}>{humidity}%</Text>
            <Text style={styles.metricLabel}>Humidity</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="umbrella-outline" size={22} color={Colors.deepOlive} />
            <Text style={styles.metricValue}>{rainProb}%</Text>
            <Text style={styles.metricLabel}>Rain Prob.</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="rainy-outline" size={22} color={Colors.deepOlive} />
            <Text style={styles.metricValue}>{rainMm} mm</Text>
            <Text style={styles.metricLabel}>Exp. Rainfall</Text>
          </View>
        </View>

        {/* 5-Day Forecast Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>5-Day Forecast</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.mutedGrey} />
        </View>

        <View style={styles.forecastRow}>
          {forecastDays.map((f, idx) => (
            <View key={idx} style={styles.forecastCard}>
              <Text style={styles.forecastDay}>{f.day}</Text>
              <Ionicons
                name={f.icon as any}
                size={22}
                color={f.icon === 'sunny' ? '#E67E22' : Colors.deepOlive}
                style={styles.forecastIcon}
              />
              <Text style={styles.forecastHigh}>{f.high}°</Text>
              <Text style={styles.forecastLow}>{f.low}°</Text>
            </View>
          ))}
        </View>

        {/* Irrigation Advice Card */}
        <View style={styles.adviceCard}>
          <View style={styles.adviceHeader}>
            <View style={styles.adviceIconCircle}>
              <Ionicons name="leaf" size={20} color={Colors.oliveGreen} />
            </View>
            <Text style={styles.adviceTitle}>Irrigation Advice</Text>
          </View>
          <Text style={styles.adviceText}>{advice}</Text>
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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  headerRow: {
    marginBottom: Spacing.md,
  },
  screenTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  locationSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
    marginTop: 2,
  },
  skyCard: {
    height: 140,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  skyGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  skyContent: {
    gap: 4,
  },
  skyTemp: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.pureWhite,
    letterSpacing: -1,
  },
  skyCondition: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  cloudIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.softCream,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    ...Shadows.soft,
  },
  metricValue: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
    marginTop: 2,
  },
  metricLabel: {
    fontSize: Typography.fontSizes.xs - 1,
    color: Colors.mutedGrey,
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  forecastCard: {
    flex: 1,
    backgroundColor: Colors.pureWhite,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    ...Shadows.soft,
  },
  forecastDay: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedGrey,
  },
  forecastIcon: {
    marginVertical: 4,
  },
  forecastHigh: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  forecastLow: {
    fontSize: 11,
    color: Colors.mutedGrey,
  },
  adviceCard: {
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  adviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceTitle: {
    fontSize: Typography.fontSizes.sm + 1,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
  adviceText: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
