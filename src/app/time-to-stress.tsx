import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Header } from '../components/Header';
import { useFarm } from '../context/FarmContext';

export default function TimeToStressScreen() {
  const router = useRouter();
  const {
    farmDetails,
    sensorSnapshot,
    latestReading,
    timeToStress,
    cropStress,
    weather,
    refreshing,
    refreshAll,
  } = useFarm();

  const cropName = farmDetails?.cropGrown || 'Ragi';
  const soilName = farmDetails?.soilType || 'Red Loam';
  const currentMoisture =
    timeToStress?.current ?? sensorSnapshot?.moisture ?? latestReading?.moisture ?? null;
  const state = timeToStress?.state || 'INSUFFICIENT_DATA';
  const hoursMod = timeToStress?.hours_to_moderate ?? null;
  const hoursHigh = timeToStress?.hours_to_high ?? null;
  const slope = timeToStress?.slope_per_hour ?? null;
  const confidencePct = timeToStress?.confidence_pct ?? 0;
  const confidenceBadge = timeToStress?.confidence || 'LOW';
  const rSquared = timeToStress?.fit_quality ?? null;
  const readingsUsed = timeToStress?.readings_used ?? 0;
  const rainBefore = timeToStress?.rain_before ?? false;
  const projection = timeToStress?.projection || [];

  const lowWarn = cropStress?.thresholds.lowWarn ?? 32;
  const lowCritical = cropStress?.thresholds.lowCritical ?? 22;

  const getHeroDisplay = () => {
    switch (state) {
      case 'ALREADY_HIGH':
        return {
          title: 'Critical Stress Now',
          value: '0 hours',
          desc: `Moisture (${currentMoisture}%) is already below the ${lowCritical}% critical threshold. Irrigate immediately.`,
          color: Colors.error,
          bg: '#FDEAE6',
          icon: 'flame' as const,
        };
      case 'ALREADY_MODERATE':
        return {
          title: 'Moderate Stress Reached',
          value: 'Now',
          desc: `Moisture (${currentMoisture}%) is below the ${lowWarn}% warning threshold. Schedule irrigation soon.`,
          color: '#C98A2B',
          bg: '#FEF5E7',
          icon: 'warning' as const,
        };
      case 'DRYING':
        return {
          title: 'Estimated Time Until Water Stress',
          value: hoursMod !== null ? `≈ ${hoursMod} hours` : 'Drying',
          desc: `Soil is drying at ${slope}%/hr. Critical stress (${lowCritical}%) projected in ${
            hoursHigh !== null ? `≈ ${hoursHigh}h` : 'later'
          }.`,
          color: hoursMod !== null && hoursMod <= 8 ? Colors.error : Colors.deepOlive,
          bg: Colors.softCream,
          icon: 'hourglass' as const,
        };
      case 'WETTING':
        return {
          title: 'Soil Moisture Rising',
          value: 'Safe',
          desc: `Moisture is increasing (+${slope}%/hr) due to recent irrigation or rainfall. No imminent water stress.`,
          color: Colors.oliveGreen,
          bg: '#EBF2DB',
          icon: 'trending-up' as const,
        };
      case 'STABLE':
        return {
          title: 'Moisture Trend Stable',
          value: 'Safe',
          desc: `Root moisture (${currentMoisture}%) is holding steady above the ${lowWarn}% warning band.`,
          color: Colors.oliveGreen,
          bg: '#EBF2DB',
          icon: 'shield-checkmark' as const,
        };
      default:
        return {
          title: 'Gathering Telemetry Trend',
          value: '--',
          desc: 'Need at least 3 sensor readings spanning 15+ minutes to calculate linear drying regression.',
          color: Colors.mutedGrey,
          bg: Colors.softCream,
          icon: 'analytics-outline' as const,
        };
    }
  };

  const hero = getHeroDisplay();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Time to Stress"
        subtitle={`${cropName} · ${soilName} OLS Prediction`}
        onBack={() => router.back()}
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
        {/* Main Countdown Hero */}
        <View style={[styles.heroCard, { backgroundColor: hero.bg, borderColor: hero.color }]}>
          <View style={styles.heroIconWrap}>
            <Ionicons name={hero.icon} size={30} color={hero.color} />
          </View>
          <Text style={styles.heroLabel}>{hero.title}</Text>
          <Text style={[styles.heroValue, { color: hero.color }]}>{hero.value}</Text>
          <Text style={styles.heroDesc}>{hero.desc}</Text>

          <View style={styles.confBadgeRow}>
            <View style={styles.confPill}>
              <Text style={styles.confPillText}>
                Confidence: {confidenceBadge} ({confidencePct}%)
              </Text>
            </View>
            {rainBefore && (
              <View style={[styles.confPill, { backgroundColor: '#EBF5FB' }]}>
                <Ionicons name="rainy" size={12} color="#2E86C1" />
                <Text style={[styles.confPillText, { color: '#2E86C1' }]}>
                  Rain Expected Before Stress
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* OLS Regression Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricTile}>
            <Text style={styles.tileLabel}>Current Moisture</Text>
            <Text style={styles.tileValue}>
              {currentMoisture !== null ? `${currentMoisture}%` : '--'}
            </Text>
            <Text style={styles.tileSub}>Live sensor</Text>
          </View>

          <View style={styles.metricTile}>
            <Text style={styles.tileLabel}>Drying Slope</Text>
            <Text style={styles.tileValue}>
              {slope !== null ? `${slope > 0 ? '+' : ''}${slope}%/h` : '--'}
            </Text>
            <Text style={styles.tileSub}>OLS linear rate</Text>
          </View>

          <View style={styles.metricTile}>
            <Text style={styles.tileLabel}>To Moderate ({lowWarn}%)</Text>
            <Text style={styles.tileValue}>
              {hoursMod !== null ? `${hoursMod} hrs` : '--'}
            </Text>
            <Text style={styles.tileSub}>Warning band</Text>
          </View>

          <View style={styles.metricTile}>
            <Text style={styles.tileLabel}>To Critical ({lowCritical}%)</Text>
            <Text style={styles.tileValue}>
              {hoursHigh !== null ? `${hoursHigh} hrs` : '--'}
            </Text>
            <Text style={styles.tileSub}>
              R² {rSquared !== null ? rSquared : '--'} · {readingsUsed} pts
            </Text>
          </View>
        </View>

        {/* Projected Moisture Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>24-Hour Moisture Projection</Text>
          <Text style={styles.cardSub}>
            Linear projection based on current drying slope compared to {cropName} thresholds.
          </Text>

          {projection.length === 0 ? (
            <View style={styles.noProjBox}>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.oliveGreen} />
              <Text style={styles.noProjText}>
                {state === 'WETTING' || state === 'STABLE'
                  ? 'No downward stress projection — soil moisture is currently stable or rising.'
                  : 'Projection curve appears once an active drying slope is detected.'}
              </Text>
            </View>
          ) : (
            <View style={styles.projList}>
              {currentMoisture !== null && (
                <View style={styles.projRow}>
                  <Text style={styles.projTime}>Now</Text>
                  <View style={styles.projBarTrack}>
                    <View
                      style={[
                        styles.projBarFill,
                        { width: `${Math.min(100, currentMoisture)}%`, backgroundColor: Colors.oliveGreen },
                      ]}
                    />
                  </View>
                  <Text style={styles.projVal}>{currentMoisture}%</Text>
                </View>
              )}

              {projection.map((pt) => {
                const barColor =
                  pt.moisture <= lowCritical
                    ? Colors.error
                    : pt.moisture <= lowWarn
                    ? '#C98A2B'
                    : Colors.sageGreen;
                return (
                  <View key={pt.hours_ahead} style={styles.projRow}>
                    <Text style={styles.projTime}>+{pt.hours_ahead}h</Text>
                    <View style={styles.projBarTrack}>
                      <View
                        style={[
                          styles.projBarFill,
                          {
                            width: `${Math.max(4, Math.min(100, pt.moisture))}%`,
                            backgroundColor: barColor,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.projVal, { color: barColor }]}>{pt.moisture}%</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Weather Impact Strip */}
        {weather && (
          <View style={styles.weatherNoteCard}>
            <Ionicons name="partly-sunny-outline" size={20} color={Colors.deepOlive} />
            <Text style={styles.weatherNoteText}>
              Live Weather Factor: {weather.temp}°C, {weather.rain_prob}% rain prob ({weather.rain_mm}{' '}
              mm in 24h), ET₀ {weather.analysis?.evapotranspiration_mm ?? '--'} mm/day.
            </Text>
          </View>
        )}

        {/* CTA to Irrigation Advice */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/irrigation-advice')}
          activeOpacity={0.85}
        >
          <Ionicons name="water" size={18} color={Colors.pureWhite} />
          <Text style={styles.ctaButtonText}>Open Irrigation Advice</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.pureWhite} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  heroCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    ...Shadows.card,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  heroLabel: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 34,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.6,
  },
  heroDesc: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.xs + 2,
  },
  confBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.md,
  },
  confPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  confPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricTile: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  tileLabel: {
    fontSize: 11,
    color: Colors.mutedGrey,
    fontWeight: '600',
  },
  tileValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.charcoal,
    marginTop: 3,
  },
  tileSub: {
    fontSize: 10.5,
    color: Colors.oliveGreen,
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  cardTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  cardSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  noProjBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.softCream,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  noProjText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  projList: {
    gap: 10,
  },
  projRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  projTime: {
    width: 36,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  projBarTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.softCream,
    overflow: 'hidden',
  },
  projBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  projVal: {
    width: 44,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  weatherNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.softCream,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
  },
  weatherNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  ctaButton: {
    height: 50,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.oliveGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.soft,
  },
  ctaButtonText: {
    color: Colors.pureWhite,
    fontSize: Typography.fontSizes.sm + 1,
    fontWeight: '700',
  },
});
