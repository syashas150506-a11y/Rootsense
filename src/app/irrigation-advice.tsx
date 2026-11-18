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

export default function IrrigationAdviceScreen() {
  const router = useRouter();
  const {
    farmDetails,
    sensorSnapshot,
    latestReading,
    cropStress,
    waterRequirement,
    weather,
    refreshing,
    refreshAll,
  } = useFarm();

  const moisture = sensorSnapshot?.moisture ?? latestReading?.moisture ?? null;
  const cropName = farmDetails?.cropGrown || 'Ragi';
  const soilName = farmDetails?.soilType || 'Red Loam';
  const fieldArea = farmDetails?.fieldDimension || '2.5';
  const fieldUnit = farmDetails?.fieldUnit || 'Acres';
  const irrigationType = farmDetails?.irrigationType || 'Drip';

  const lowCritical = cropStress?.thresholds.lowCritical ?? 22;
  const lowWarn = cropStress?.thresholds.lowWarn ?? 32;
  const highWarn = cropStress?.thresholds.highWarn ?? 75;

  const rainProb = weather?.rain_prob ?? 0;
  const rainMm = weather?.rain_mm ?? 0;
  const rainLikely = rainProb >= 45 || rainMm >= 3.0;

  // Determine exact irrigation verdict directly from sensor moisture range
  type Verdict = {
    needed: 'YES' | 'WAIT' | 'NO' | 'STOP' | 'UNKNOWN';
    headline: string;
    subtext: string;
    accent: string;
    bg: string;
    icon: keyof typeof Ionicons.glyphMap;
  };

  let verdict: Verdict;
  if (moisture === null) {
    verdict = {
      needed: 'UNKNOWN',
      headline: 'Waiting for Moisture Sensor',
      subtext: 'Connect your soil moisture sensor to generate live irrigation advice.',
      accent: Colors.mutedGrey,
      bg: Colors.softCream,
      icon: 'help-circle-outline',
    };
  } else if (moisture <= lowCritical) {
    verdict = {
      needed: 'YES',
      headline: 'Irrigation Needed Immediately',
      subtext: `Soil moisture (${moisture}%) is inside the Critical Dry zone (0–${lowCritical}%). Irrigate now to prevent yield loss.`,
      accent: Colors.error,
      bg: '#FDEAE6',
      icon: 'alert-circle',
    };
  } else if (moisture <= lowWarn) {
    if (rainLikely) {
      verdict = {
        needed: 'WAIT',
        headline: 'Wait — Rain Forecast Soon',
        subtext: `Moisture (${moisture}%) is low (${lowCritical}–${lowWarn}%), but ${rainProb}% rain (~${rainMm} mm) is expected in 24h. Delay watering to conserve water.`,
        accent: '#C98A2B',
        bg: '#FEF5E7',
        icon: 'rainy',
      };
    } else {
      verdict = {
        needed: 'YES',
        headline: 'Irrigation Recommended',
        subtext: `Soil moisture (${moisture}%) has entered the Low Moisture band (${lowCritical}–${lowWarn}%) with dry weather ahead.`,
        accent: '#C98A2B',
        bg: '#FEF5E7',
        icon: 'water',
      };
    }
  } else if (moisture >= highWarn) {
    verdict = {
      needed: 'STOP',
      headline: 'Do Not Irrigate — Over-Saturated',
      subtext: `Soil moisture (${moisture}%) exceeds ${highWarn}%. Pause irrigation and ensure field drainage to prevent root rot.`,
      accent: '#2E86C1',
      bg: '#EBF5FB',
      icon: 'hand-left',
    };
  } else {
    verdict = {
      needed: 'NO',
      headline: 'No Irrigation Needed',
      subtext: `Soil moisture (${moisture}%) is comfortably inside the Optimal Range (${lowWarn}–${highWarn}%) for ${cropName} in ${soilName}.`,
      accent: Colors.oliveGreen,
      bg: '#EBF2DB',
      icon: 'checkmark-circle',
    };
  }

  // Compute recommended depth & litres if needed
  const acres =
    fieldUnit === 'Hectares'
      ? Number(fieldArea) * 2.471
      : fieldUnit === 'Gunthas'
      ? Number(fieldArea) / 40
      : Number(fieldArea) || 2.5;
  const computedMm =
    waterRequirement?.amount_mm ??
    (verdict.needed === 'YES' && moisture !== null
      ? Math.max(8, Math.min(45, Math.round((lowWarn + 10 - moisture) * 1.3)))
      : 0);
  const computedLitres =
    waterRequirement?.amount_litres ??
    (computedMm > 0 && acres > 0 ? Math.round(computedMm * acres * 4046.86) : 0);

  const rangeBands = [
    {
      name: 'Critical Dry',
      range: `0% – ${lowCritical}%`,
      action: 'Irrigate Immediately',
      color: Colors.error,
      active: moisture !== null && moisture <= lowCritical,
    },
    {
      name: 'Low / Warning',
      range: `${lowCritical}% – ${lowWarn}%`,
      action: rainLikely ? 'Wait for Rain' : 'Schedule Irrigation',
      color: '#C98A2B',
      active: moisture !== null && moisture > lowCritical && moisture <= lowWarn,
    },
    {
      name: 'Optimal Zone',
      range: `${lowWarn}% – ${highWarn}%`,
      action: 'No Irrigation Needed',
      color: Colors.oliveGreen,
      active: moisture !== null && moisture > lowWarn && moisture < highWarn,
    },
    {
      name: 'Over-Saturated',
      range: `${highWarn}% – 100%`,
      action: 'Stop Watering / Drain',
      color: '#2E86C1',
      active: moisture !== null && moisture >= highWarn,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Irrigation Advice"
        subtitle={`${cropName} · ${soilName} · ${irrigationType}`}
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
        {/* Main Verdict Banner */}
        <View style={[styles.verdictCard, { backgroundColor: verdict.bg, borderColor: verdict.accent }]}>
          <View style={styles.verdictTop}>
            <Ionicons name={verdict.icon} size={30} color={verdict.accent} />
            <View style={styles.verdictPill}>
              <Text style={[styles.verdictPillText, { color: verdict.accent }]}>
                DECISION: {verdict.needed}
              </Text>
            </View>
          </View>
          <Text style={styles.verdictHeadline}>{verdict.headline}</Text>
          <Text style={styles.verdictSub}>{verdict.subtext}</Text>
        </View>

        {/* Visual Moisture Range Gauge */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Live Moisture Range Position</Text>
            <Text style={styles.currentBadge}>
              {moisture !== null ? `${moisture}% Now` : 'No Signal'}
            </Text>
          </View>

          {/* 4-segment proportional bar */}
          <View style={styles.rangeBarContainer}>
            <View style={styles.rangeBarTrack}>
              <View style={[styles.seg, { flex: lowCritical, backgroundColor: Colors.error }]} />
              <View
                style={[styles.seg, { flex: lowWarn - lowCritical, backgroundColor: '#D6BA8C' }]}
              />
              <View
                style={[styles.seg, { flex: highWarn - lowWarn, backgroundColor: Colors.oliveGreen }]}
              />
              <View style={[styles.seg, { flex: 100 - highWarn, backgroundColor: '#5DADE2' }]} />
            </View>

            {/* Live Marker Pin */}
            {moisture !== null && (
              <View
                style={[
                  styles.markerPinWrap,
                  { left: `${Math.max(2, Math.min(96, moisture))}%` },
                ]}
              >
                <View style={styles.markerPin} />
              </View>
            )}
          </View>

          <View style={styles.axisLabelsRow}>
            <Text style={styles.axisText}>0%</Text>
            <Text style={styles.axisText}>{lowCritical}%</Text>
            <Text style={styles.axisText}>{lowWarn}%</Text>
            <Text style={styles.axisText}>{highWarn}%</Text>
            <Text style={styles.axisText}>100%</Text>
          </View>

          {/* Range Reference Table */}
          <View style={styles.bandList}>
            {rangeBands.map((b) => (
              <View
                key={b.name}
                style={[styles.bandRow, b.active && styles.bandRowActive]}
              >
                <View style={styles.bandLeft}>
                  <View style={[styles.bandDot, { backgroundColor: b.color }]} />
                  <View>
                    <Text style={styles.bandName}>
                      {b.name} {b.active ? '• CURRENT' : ''}
                    </Text>
                    <Text style={styles.bandRange}>{b.range}</Text>
                  </View>
                </View>
                <Text style={[styles.bandAction, { color: b.color }]}>{b.action}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Water Volume & Weather Factor Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Water Volume &amp; Weather Factor</Text>
          <View style={styles.volumeRow}>
            <View style={styles.volumeBox}>
              <Text style={styles.volLabel}>Recommended Depth</Text>
              <Text style={styles.volValue}>{computedMm > 0 ? `${computedMm} mm` : '0 mm'}</Text>
            </View>
            <View style={styles.volumeBox}>
              <Text style={styles.volLabel}>
                Volume ({fieldArea} {fieldUnit})
              </Text>
              <Text style={styles.volValue}>
                {computedLitres > 0 ? `${computedLitres.toLocaleString()} L` : '0 L'}
              </Text>
            </View>
          </View>

          <View style={styles.weatherStrip}>
            <Ionicons name="rainy-outline" size={18} color={Colors.deepOlive} />
            <Text style={styles.weatherStripText}>
              Live 24h Forecast: {rainProb}% rain probability ({rainMm} mm expected)
              {weather?.analysis
                ? ` · ET₀ ${weather.analysis.evapotranspiration_mm} mm/day`
                : ''}
            </Text>
          </View>
        </View>

        {/* Jump to Time to Stress */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/time-to-stress')}
          activeOpacity={0.85}
        >
          <Ionicons name="hourglass-outline" size={18} color={Colors.deepOlive} />
          <Text style={styles.secondaryBtnText}>Check Time Until Water Stress</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.deepOlive} />
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
  verdictCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    ...Shadows.card,
  },
  verdictTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  verdictPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  verdictPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verdictHeadline: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  verdictSub: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  currentBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.deepOlive,
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  rangeBarContainer: {
    position: 'relative',
    paddingVertical: 8,
  },
  rangeBarTrack: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  seg: {
    height: '100%',
  },
  markerPinWrap: {
    position: 'absolute',
    top: 2,
    marginLeft: -9,
  },
  markerPin: {
    width: 18,
    height: 26,
    borderRadius: 9,
    backgroundColor: Colors.charcoal,
    borderWidth: 3,
    borderColor: Colors.pureWhite,
    ...Shadows.soft,
  },
  axisLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  axisText: {
    fontSize: 10.5,
    color: Colors.mutedGrey,
    fontWeight: '600',
  },
  bandList: {
    gap: 8,
  },
  bandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.warmIvory,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
  },
  bandRowActive: {
    backgroundColor: Colors.palePeach,
    borderColor: Colors.oliveGreen,
    borderWidth: 1.5,
  },
  bandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bandName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  bandRange: {
    fontSize: 11,
    color: Colors.mutedGrey,
  },
  bandAction: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  volumeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  volumeBox: {
    flex: 1,
    backgroundColor: Colors.softCream,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
  },
  volLabel: {
    fontSize: 11,
    color: Colors.mutedGrey,
    fontWeight: '600',
  },
  volValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.deepOlive,
    marginTop: 2,
  },
  weatherStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warmIvory,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  weatherStripText: {
    flex: 1,
    fontSize: 11.5,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.softCream,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
});
