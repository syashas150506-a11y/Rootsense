import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useFarm } from '../../context/FarmContext';

export default function WeatherIntelligenceScreen() {
  const { weather, waterRequirement, farmDetails, loading, refreshing, refreshAll } = useFarm();

  const analysis = weather?.analysis;
  const forecastDays = weather?.forecast || [];

  const getRiskColor = (level?: string) => {
    if (level === 'High' || level === 'Avoid') return Colors.error;
    if (level === 'Moderate' || level === 'Caution') return '#C98A2B';
    return Colors.oliveGreen;
  };

  const heroIcon =
    weather?.icon === 'sunny'
      ? 'sunny'
      : weather?.icon === 'rainy'
      ? 'rainy'
      : weather?.icon === 'cloudy'
      ? 'cloudy'
      : 'partly-sunny';

  const skyColors: [string, string, string] =
    weather?.icon === 'rainy'
      ? ['#5C7C99', '#7898B5', '#9AB4CC']
      : weather?.icon === 'sunny'
      ? ['#5FA4DC', '#84BCEB', '#B8DCF8']
      : ['#74A9D8', '#99C4E9', '#BEE0FA'];

  const advice =
    waterRequirement?.advice ||
    analysis?.summary ||
    'Pull down to fetch real-time weather and irrigation analysis.';

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
            </Text>
          </View>
        </View>

        {!weather && loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.oliveGreen} />
            <Text style={styles.loadingText}>Fetching real-time weather forecast...</Text>
          </View>
        ) : (
          <>
            {/* Real-Time Sky Card */}
            <View style={styles.skyCard}>
              <LinearGradient
                colors={skyColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.skyGradient}
              >
                <View style={styles.skyContent}>
                  <Text style={styles.skyTemp}>
                    {weather ? `${weather.temp}°C` : '--°C'}
                  </Text>
                  <Text style={styles.skyCondition}>
                    {weather?.condition || 'Loading...'}
                  </Text>
                  {weather?.apparent_temp !== undefined && (
                    <Text style={styles.feelsLike}>
                      Feels like {weather.apparent_temp}°C · Wind {weather.wind_speed_kmh ?? Math.round(weather.wind_speed * 3.6)} km/h
                    </Text>
                  )}
                </View>

                <View style={styles.cloudIconWrapper}>
                  <Ionicons name={heroIcon as any} size={76} color="rgba(255, 255, 255, 0.85)" />
                </View>
              </LinearGradient>
            </View>

            {/* 3 Real-Time Weather Metric Cards */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Ionicons name="water-outline" size={22} color={Colors.deepOlive} />
                <Text style={styles.metricValue}>
                  {weather ? `${weather.humidity}%` : '--'}
                </Text>
                <Text style={styles.metricLabel}>Humidity</Text>
              </View>

              <View style={styles.metricCard}>
                <Ionicons name="umbrella-outline" size={22} color={Colors.deepOlive} />
                <Text style={styles.metricValue}>
                  {weather ? `${weather.rain_prob}%` : '--'}
                </Text>
                <Text style={styles.metricLabel}>24h Rain Prob.</Text>
              </View>

              <View style={styles.metricCard}>
                <Ionicons name="rainy-outline" size={22} color={Colors.deepOlive} />
                <Text style={styles.metricValue}>
                  {weather ? `${weather.rain_mm} mm` : '--'}
                </Text>
                <Text style={styles.metricLabel}>24h Rainfall</Text>
              </View>
            </View>

            {/* Real-Time 5-Day Forecast */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>5-Day Live Forecast</Text>
              <Text style={styles.sectionHint}>Rain % &amp; °C</Text>
            </View>

            <View style={styles.forecastRow}>
              {forecastDays.map((f, idx) => (
                <View key={f.date || idx} style={styles.forecastCard}>
                  <Text style={styles.forecastDay}>{f.day}</Text>
                  <Ionicons
                    name={f.icon as any}
                    size={22}
                    color={
                      f.icon === 'sunny'
                        ? '#E67E22'
                        : f.icon === 'rainy'
                        ? '#3498DB'
                        : Colors.deepOlive
                    }
                    style={styles.forecastIcon}
                  />
                  <Text style={styles.forecastHigh}>{f.high}°</Text>
                  <Text style={styles.forecastLow}>{f.low}°</Text>
                  <Text style={styles.forecastRain}>{f.rain_prob}%</Text>
                </View>
              ))}
            </View>

            {/* Real-Time Agronomic Weather Analysis Card */}
            {analysis && (
              <View style={styles.analysisCard}>
                <View style={styles.analysisHeader}>
                  <View style={styles.adviceIconCircle}>
                    <Ionicons name="analytics-outline" size={19} color={Colors.oliveGreen} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.adviceTitle}>Field Weather Analysis</Text>
                    <Text style={styles.analysisSub}>
                      VPD {analysis.vpd_kpa} kPa · 72h Rain {analysis.next_72h_rain_mm} mm
                    </Text>
                  </View>
                </View>

                <View style={styles.analysisGrid}>
                  <View style={styles.analysisTile}>
                    <Text style={styles.tileLabel}>Crop Water Loss (ET₀)</Text>
                    <Text style={styles.tileValue}>
                      {analysis.evapotranspiration_mm} mm/d
                    </Text>
                    <Text
                      style={[
                        styles.tileBadge,
                        { color: getRiskColor(analysis.evapotranspiration_level) },
                      ]}
                    >
                      {analysis.evapotranspiration_level} Demand
                    </Text>
                  </View>

                  <View style={styles.analysisTile}>
                    <Text style={styles.tileLabel}>Heat Stress</Text>
                    <Text
                      style={[
                        styles.tileValue,
                        { color: getRiskColor(analysis.heat_stress_risk) },
                      ]}
                    >
                      {analysis.heat_stress_risk}
                    </Text>
                    <Text style={styles.tileSub}>UV Max {weather?.uv_index ?? '--'}</Text>
                  </View>

                  <View style={styles.analysisTile}>
                    <Text style={styles.tileLabel}>Disease / Fungal</Text>
                    <Text
                      style={[
                        styles.tileValue,
                        { color: getRiskColor(analysis.fungal_disease_risk) },
                      ]}
                    >
                      {analysis.fungal_disease_risk}
                    </Text>
                    <Text style={styles.tileSub}>RH {weather?.humidity ?? '--'}%</Text>
                  </View>

                  <View style={styles.analysisTile}>
                    <Text style={styles.tileLabel}>Spray Window</Text>
                    <Text
                      style={[
                        styles.tileValue,
                        { color: getRiskColor(analysis.spray_window) },
                      ]}
                    >
                      {analysis.spray_window}
                    </Text>
                    <Text style={styles.tileSub}>
                      {weather?.wind_speed_kmh ?? '--'} km/h wind
                    </Text>
                  </View>
                </View>

                <Text style={styles.analysisSummary}>{analysis.summary}</Text>
              </View>
            )}

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
          </>
        )}
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
  loadingCard: {
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  skyCard: {
    height: 150,
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
    gap: 3,
    flex: 1,
  },
  skyTemp: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.pureWhite,
    letterSpacing: -1,
  },
  skyCondition: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.96)',
  },
  feelsLike: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginTop: 2,
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
  sectionHint: {
    fontSize: 11,
    color: Colors.mutedGrey,
    fontWeight: '600',
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
    gap: 3,
    ...Shadows.soft,
  },
  forecastDay: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.mutedGrey,
  },
  forecastIcon: {
    marginVertical: 3,
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
  forecastRain: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3498DB',
    marginTop: 2,
  },
  analysisCard: {
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadows.card,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  analysisSub: {
    fontSize: 11,
    color: Colors.mutedGrey,
    marginTop: 1,
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  analysisTile: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
  },
  tileLabel: {
    fontSize: 10.5,
    color: Colors.mutedGrey,
    fontWeight: '600',
  },
  tileValue: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '800',
    color: Colors.charcoal,
    marginTop: 2,
  },
  tileBadge: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
  },
  tileSub: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  analysisSummary: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 19,
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
