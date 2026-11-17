import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { SoilMoistureGauge } from '../../components/SoilMoistureGauge';
import { MoistureHistoryChart } from '../../components/MoistureHistoryChart';
import { useFarm } from '../../context/FarmContext';

export default function SoilIntelligenceScreen() {
  const router = useRouter();
  const {
    farmDetails,
    cropStress,
    timeToStress,
    soilHistory,
    heatmap,
    waterRequirement,
    refreshing,
    refreshAll,
    recordSoilReading,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<'Overview' | 'Heatmap' | 'Trends'>('Overview');
  const [loggingSample, setLoggingSample] = useState(false);

  const moisture = farmDetails?.soilMoisture ?? 38.5;
  const statusText = cropStress?.status || 'Healthy';
  const hoursUntilStress = timeToStress?.hours_to_moderate ?? farmDetails?.timeUntilStressHours ?? 12;
  const confidence = timeToStress?.confidence_pct ?? farmDetails?.confidence ?? 82;

  const chartData =
    soilHistory && soilHistory.dailySummary.length >= 2
      ? soilHistory.dailySummary.map((d) => d.avgMoisture)
      : [34, 38, 36, 42, 40, 39, moisture];
  const chartDays =
    soilHistory && soilHistory.dailySummary.length >= 2
      ? soilHistory.dailySummary.map((d) => d.dayNum)
      : ['10', '11', '12', '13', '14', '15', '16'];

  const handleLogReading = async (newMoisture: number) => {
    setLoggingSample(true);
    await recordSoilReading(newMoisture, 27.2);
    setLoggingSample(false);
  };

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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Soil Intelligence</Text>
          <TouchableOpacity
            onPress={refreshAll}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="refresh-outline" size={18} color={Colors.charcoal} />
          </TouchableOpacity>
        </View>

        {/* Segmented Filter Tabs: Overview | Heatmap | Trends */}
        <View style={styles.segmentedContainer}>
          {(['Overview', 'Heatmap', 'Trends'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.segmentButton,
                  isSelected && styles.segmentButtonActive,
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isSelected && styles.segmentTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab 1: Overview */}
        {activeTab === 'Overview' && (
          <View style={styles.tabContent}>
            {/* Hero Soil Moisture Gauge */}
            <View style={styles.gaugeCard}>
              <SoilMoistureGauge
                percentage={moisture}
                statusText={statusText}
                size={180}
              />
            </View>

            {/* Moisture History (7 Days) from SQLite */}
            <MoistureHistoryChart data={chartData} days={chartDays} />

            {/* Time Until Water Stress Card */}
            <View style={styles.stressCard}>
              <View style={styles.stressIconCircle}>
                <Ionicons name="hourglass-outline" size={24} color={Colors.deepOlive} />
              </View>
              <View style={styles.stressTextGroup}>
                <Text style={styles.stressTitle}>Time Until Water Stress</Text>
                <Text style={styles.stressValue}>
                  {timeToStress?.state === 'ALREADY_HIGH'
                    ? 'Immediate Stress'
                    : timeToStress?.state === 'ALREADY_MODERATE'
                    ? 'Moderate Stress Now'
                    : timeToStress?.state === 'WETTING'
                    ? 'Soil Wetting (Safe)'
                    : `≈ ${hoursUntilStress} hours`}
                </Text>
                <Text style={styles.stressConfidence}>
                  Confidence: {confidence}%
                </Text>
              </View>
            </View>

            {/* Water Volume Advisory from Agronomy Engine */}
            {waterRequirement && (
              <View style={styles.waterCard}>
                <View style={styles.waterHeaderRow}>
                  <Ionicons name="water" size={18} color={Colors.oliveGreen} />
                  <Text style={styles.waterTitle}>
                    Irrigation Decision: {waterRequirement.decision}
                  </Text>
                </View>
                <Text style={styles.waterAdvice}>{waterRequirement.advice}</Text>
                {waterRequirement.amount_litres && waterRequirement.amount_litres > 0 ? (
                  <Text style={styles.waterMeta}>
                    Estimated Volume: {waterRequirement.amount_mm} mm (
                    {waterRequirement.amount_litres.toLocaleString()} L)
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        )}

        {/* Tab 2: Live SQL Heatmap View */}
        {activeTab === 'Heatmap' && (
          <View style={styles.tabContent}>
            <View style={styles.heatmapCard}>
              <Text style={styles.heatmapTitle}>7-Day Diurnal Moisture Heatmap</Text>
              <Text style={styles.heatmapSub}>
                {heatmap?.insight ||
                  'Hourly IST root-zone saturation profile aggregated from SQL readings.'}
              </Text>

              <View style={styles.heatmapGrid}>
                {(heatmap?.rows && heatmap.rows.length > 0
                  ? heatmap.rows
                  : [
                      {
                        dayLabel: 'Today',
                        dateIso: '',
                        slots: [
                          { slot: '00-04', avgMoisture: null, tone: 'empty' as const },
                          { slot: '04-08', avgMoisture: 39.2, tone: 'optimal' as const },
                          { slot: '08-12', avgMoisture: 37.8, tone: 'optimal' as const },
                          { slot: '12-16', avgMoisture: 33.4, tone: 'warn' as const },
                          { slot: '16-20', avgMoisture: 35.1, tone: 'optimal' as const },
                          { slot: '20-24', avgMoisture: 38.5, tone: 'optimal' as const },
                        ],
                      },
                    ]
                ).map((row) => (
                  <View key={row.dateIso || row.dayLabel} style={styles.heatmapRow}>
                    <Text style={styles.dayLabel}>{row.dayLabel}</Text>
                    <View style={styles.cellsRow}>
                      {row.slots.map((slot, cIdx) => {
                        const bg =
                          slot.tone === 'empty'
                            ? '#F3ECE0'
                            : slot.tone === 'critical'
                            ? '#F5C6A5'
                            : slot.tone === 'warn'
                            ? '#FDE7CA'
                            : '#DCE6C6';
                        return (
                          <View
                            key={cIdx}
                            style={[styles.heatCell, { backgroundColor: bg }]}
                          >
                            <Text style={styles.cellText}>
                              {slot.avgMoisture !== null
                                ? `${Math.round(slot.avgMoisture)}%`
                                : '—'}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.heatmapLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: '#F5C6A5' }]} />
                  <Text style={styles.legendText}>
                    Stress (≤{heatmap?.high ?? 22}%)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: '#FDE7CA' }]} />
                  <Text style={styles.legendText}>
                    Warn (≤{heatmap?.moderate ?? 32}%)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: '#DCE6C6' }]} />
                  <Text style={styles.legendText}>Optimal</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Tab 3: Live OLS Trends + Telemetry Test Trigger */}
        {activeTab === 'Trends' && (
          <View style={styles.tabContent}>
            <View style={styles.trendsCard}>
              <Text style={styles.trendsTitle}>OLS Regression & Drying Trend</Text>
              <Text style={styles.trendsSub}>
                Ordinary Least Squares drying rate:{' '}
                {timeToStress?.slope_per_hour !== null &&
                timeToStress?.slope_per_hour !== undefined
                  ? `${timeToStress.slope_per_hour}% / hour`
                  : 'Stable'}
                {' · '}R² = {timeToStress?.fit_quality ?? '0.89'}
              </Text>
              <View style={styles.trendRow}>
                <Ionicons name="trending-down" size={24} color={Colors.goldenWheat} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.trendMetric}>
                    State: {timeToStress?.state || 'DRYING'} ({timeToStress?.confidence || 'HIGH'})
                  </Text>
                  <Text style={styles.trendDetail}>
                    Critical limit: {cropStress?.thresholds.lowCritical ?? 22}% · Warning limit:{' '}
                    {cropStress?.thresholds.lowWarn ?? 32}%
                  </Text>
                </View>
              </View>

              {/* Quick Telemetry Simulator -> POST /api/soil/reading into SQLite */}
              <Text style={styles.simLabel}>Test Live Database Telemetry (POST /api/soil/reading)</Text>
              <View style={styles.simButtonsRow}>
                <TouchableOpacity
                  style={styles.simButton}
                  disabled={loggingSample}
                  onPress={() => handleLogReading(42.0)}
                >
                  <Text style={styles.simButtonText}>Healthy (42%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.simButton}
                  disabled={loggingSample}
                  onPress={() => handleLogReading(30.0)}
                >
                  <Text style={styles.simButtonText}>Warn (30%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.simButton, styles.simButtonDanger]}
                  disabled={loggingSample}
                  onPress={() => handleLogReading(19.5)}
                >
                  <Text style={[styles.simButtonText, { color: Colors.error }]}>
                    Stress (19.5%)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
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
  screenTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  segmentButtonActive: {
    backgroundColor: Colors.pureWhite,
    ...Shadows.soft,
  },
  segmentText: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: '600',
    color: Colors.mutedGrey,
  },
  segmentTextActive: {
    color: Colors.charcoal,
    fontWeight: '700',
  },
  tabContent: {
    gap: Spacing.md,
  },
  gaugeCard: {
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  stressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.softCream,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.soft,
  },
  stressIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.palePeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stressTextGroup: {
    flex: 1,
  },
  stressTitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
    fontWeight: '600',
  },
  stressValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: '800',
    color: Colors.charcoal,
    marginTop: 1,
  },
  stressConfidence: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.oliveGreen,
    fontWeight: '600',
    marginTop: 2,
  },
  waterCard: {
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    ...Shadows.soft,
  },
  waterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waterTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
  waterAdvice: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  waterMeta: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: '700',
    color: Colors.oliveGreen,
    marginTop: 2,
  },
  heatmapCard: {
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  heatmapTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  heatmapSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
    marginTop: 2,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  heatmapGrid: {
    gap: 6,
  },
  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    width: 34,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.mutedGrey,
  },
  cellsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  heatCell: {
    flex: 1,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  heatmapLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: Colors.mutedGrey,
  },
  trendsCard: {
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  trendsTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  trendsSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.softCream,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  trendMetric: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
  trendDetail: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  simLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.mutedGrey,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  simButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  simButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.softCream,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  simButtonDanger: {
    backgroundColor: '#FDEAE6',
    borderColor: '#F5C6A5',
  },
  simButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
});
