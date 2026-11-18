import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Header } from '../components/Header';
import { RootSenseApi, ApiSeedCalendar } from '../services/api';
import { useFarm } from '../context/FarmContext';

const CROP_OPTIONS = [
  { id: 'Ragi', label: 'Ragi (Finger Millet)', local: 'ರಾಗಿ' },
  { id: 'Maize', label: 'Maize (Corn)', local: 'ಮೆಕ್ಕೆಜೋಳ' },
  { id: 'Tomato', label: 'Tomato', local: 'ಟೊಮೆಟೊ' },
  { id: 'Paddy', label: 'Paddy (Rice)', local: 'ಭತ್ತ' },
  { id: 'Groundnut', label: 'Groundnut (Peanut)', local: 'ಶೇಂಗಾ' },
  { id: 'Cotton', label: 'Cotton', local: 'ಹತ್ತಿ' },
  { id: 'Wheat', label: 'Wheat', local: 'ಗೋಧಿ' },
  { id: 'Sugarcane', label: 'Sugarcane', local: 'ಕಬ್ಬು' },
  { id: 'Onion', label: 'Onion', local: 'ಈರುಳ್ಳಿ' },
  { id: 'Chilli', label: 'Chilli', local: 'ಮೆಣಸಿನಕಾಯಿ' },
  { id: 'Sunflower', label: 'Sunflower', local: 'ಸೂರ್ಯಕಾಂತಿ' },
  { id: 'Soybean', label: 'Soybean', local: 'ಸೋಯಾಬೀನ್' },
];

const SOWING_PRESETS = [
  { label: 'Today', daysAgo: 0 },
  { label: '15d ago', daysAgo: 15 },
  { label: '30d ago', daysAgo: 30 },
  { label: '45d ago', daysAgo: 45 },
];

function addDaysFormatted(baseDate: Date, days: number): string {
  const dt = new Date(baseDate.getTime() + days * 86400_000);
  return dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function SeedCalendarScreen() {
  const router = useRouter();
  const { farmDetails } = useFarm();

  const [selectedCrop, setSelectedCrop] = useState(farmDetails?.cropGrown || 'Ragi');
  const [customCropInput, setCustomCropInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sowingDaysAgo, setSowingDaysAgo] = useState(0);

  const [calendar, setCalendar] = useState<ApiSeedCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sowingDate = new Date(Date.now() - sowingDaysAgo * 86400_000);

  const fetchCalendar = useCallback(async (crop: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await RootSenseApi.getSeedCalendar(crop);
      setCalendar(data);
    } catch (err) {
      setErrorMsg(`Could not fetch AI crop schedule: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCalendar(selectedCrop);
  }, [selectedCrop, fetchCalendar]);

  const handleSelectCrop = (cropId: string) => {
    setSelectedCrop(cropId);
    setDropdownOpen(false);
  };

  const handleCustomCropSubmit = () => {
    const clean = customCropInput.trim();
    if (!clean) return;
    setSelectedCrop(clean);
    setCustomCropInput('');
    setDropdownOpen(false);
  };

  const getCriticalityStyle = (level: 'CRITICAL' | 'HIGH' | 'MODERATE') => {
    if (level === 'CRITICAL') {
      return { bg: '#FDEAE6', text: Colors.error, border: '#F2B8AC' };
    }
    if (level === 'HIGH') {
      return { bg: '#FEF5E7', text: '#C98A2B', border: '#F5D6A7' };
    }
    return { bg: '#EBF2DB', text: Colors.deepOlive, border: Colors.lightSage };
  };

  const selectedOption = CROP_OPTIONS.find((c) => c.id === selectedCrop);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Seed Calendar"
        subtitle="Growth duration, yield & AI critical stages"
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Crop Selector Dropdown Card */}
        <View style={styles.selectorCard}>
          <Text style={styles.fieldLabel}>Select Crop</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setDropdownOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownLeft}>
              <View style={styles.leafBadge}>
                <Ionicons name="leaf" size={18} color={Colors.oliveGreen} />
              </View>
              <View>
                <Text style={styles.dropdownValue}>
                  {selectedOption ? selectedOption.label : selectedCrop}
                </Text>
                {selectedOption && (
                  <Text style={styles.dropdownSub}>{selectedOption.local}</Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-down" size={20} color={Colors.deepOlive} />
          </TouchableOpacity>

          {/* Sowing Date Quick Selector */}
          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Sowing Date</Text>
          <View style={styles.sowingRow}>
            {SOWING_PRESETS.map((p) => {
              const active = sowingDaysAgo === p.daysAgo;
              return (
                <TouchableOpacity
                  key={p.label}
                  style={[styles.sowingPill, active && styles.sowingPillActive]}
                  onPress={() => setSowingDaysAgo(p.daysAgo)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.sowingPillText, active && styles.sowingPillTextActive]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.oliveGreen} />
            <Text style={styles.loadingTitle}>Predicting Critical Stages...</Text>
            <Text style={styles.loadingSub}>
              Analyzing {selectedCrop} lifecycle for {farmDetails?.soilType || 'Red Loam'} soil &amp;
              live weather
            </Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={28} color={Colors.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => fetchCalendar(selectedCrop)}
            >
              <Text style={styles.retryBtnText}>Retry Prediction</Text>
            </TouchableOpacity>
          </View>
        ) : calendar ? (
          <>
            {/* Duration & Expected Yield Hero Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <Text style={styles.cropHeading}>{calendar.crop}</Text>
                <View style={styles.aiTag}>
                  <Ionicons name="sparkles" size={12} color={Colors.deepOlive} />
                  <Text style={styles.aiTagText}>
                    {calendar.source === 'gemini-ai-live' ? 'AI Predicted' : 'Agronomy Model'}
                  </Text>
                </View>
              </View>

              <View style={styles.kpiRow}>
                <View style={styles.kpiBox}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.oliveGreen} />
                  <Text style={styles.kpiLabel}>Growth Duration</Text>
                  <Text style={styles.kpiValue}>
                    {calendar.total_days_min}–{calendar.total_days_max} days
                  </Text>
                  <Text style={styles.kpiHint}>
                    Harvest ~{addDaysFormatted(sowingDate, calendar.total_days_min)} –{' '}
                    {addDaysFormatted(sowingDate, calendar.total_days_max)}
                  </Text>
                </View>

                <View style={styles.kpiBox}>
                  <Ionicons name="nutrition-outline" size={18} color={Colors.deepOlive} />
                  <Text style={styles.kpiLabel}>Expected Yield</Text>
                  <Text style={styles.kpiValueSmall}>{calendar.expected_yield}</Text>
                  <Text style={styles.kpiHint}>{calendar.water_requirement_total}</Text>
                </View>
              </View>

              <View style={styles.metaGrid}>
                <View style={styles.metaRow}>
                  <Ionicons name="sunny-outline" size={15} color={Colors.deepOlive} />
                  <Text style={styles.metaText}>
                    <Text style={styles.metaBold}>Best Sowing: </Text>
                    {calendar.sowing_window}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="thermometer-outline" size={15} color={Colors.deepOlive} />
                  <Text style={styles.metaText}>
                    <Text style={styles.metaBold}>Ideal Soil Temp: </Text>
                    {calendar.ideal_soil_temp}
                  </Text>
                </View>
              </View>

              {/* Weather Grounded Advisory */}
              <View style={styles.weatherStrip}>
                <Ionicons name="partly-sunny-outline" size={17} color={Colors.deepOlive} />
                <Text style={styles.weatherStripText}>{calendar.weather_advisory}</Text>
              </View>
            </View>

            {/* Predicted Critical Stages Timeline */}
            <View style={styles.stagesHeaderRow}>
              <Text style={styles.stagesHeading}>Predicted Critical Crop Stages</Text>
              <Text style={styles.stagesCount}>{calendar.stages.length} Stages</Text>
            </View>

            {calendar.stages.map((stage, idx) => {
              const badge = getCriticalityStyle(stage.criticality);
              const isCurrentStage =
                sowingDaysAgo >= stage.day_start - 1 && sowingDaysAgo <= stage.day_end;
              return (
                <View
                  key={`${stage.stage_name}-${idx}`}
                  style={[styles.stageCard, isCurrentStage && styles.stageCardActive]}
                >
                  <View style={styles.stageTop}>
                    <View style={styles.stageNumCircle}>
                      <Text style={styles.stageNumText}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stageName}>
                        {stage.stage_name}
                        {isCurrentStage ? '  (Current)' : ''}
                      </Text>
                      <Text style={styles.stageDays}>
                        Days {stage.day_start}–{stage.day_end} ·{' '}
                        {addDaysFormatted(sowingDate, stage.day_start - 1)} –{' '}
                        {addDaysFormatted(sowingDate, stage.day_end - 1)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.critPill,
                        { backgroundColor: badge.bg, borderColor: badge.border },
                      ]}
                    >
                      <Text style={[styles.critPillText, { color: badge.text }]}>
                        {stage.criticality}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stageDetails}>
                    <View style={styles.detailLine}>
                      <Ionicons name="water-outline" size={14} color={Colors.oliveGreen} />
                      <Text style={styles.detailText}>
                        <Text style={styles.detailBold}>Water: </Text>
                        {stage.water_need}
                      </Text>
                    </View>
                    <View style={styles.detailLine}>
                      <Ionicons name="warning-outline" size={14} color="#C98A2B" />
                      <Text style={styles.detailText}>
                        <Text style={styles.detailBold}>Risk: </Text>
                        {stage.key_risk}
                      </Text>
                    </View>
                    <View style={styles.detailLine}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={Colors.deepOlive} />
                      <Text style={styles.detailText}>
                        <Text style={styles.detailBold}>Action: </Text>
                        {stage.action_tip}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        ) : null}
      </ScrollView>

      {/* Crop Dropdown Modal */}
      <Modal visible={dropdownOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setDropdownOpen(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Crop</Text>
              <TouchableOpacity onPress={() => setDropdownOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.charcoal} />
              </TouchableOpacity>
            </View>

            {/* Custom Crop Search / Entry */}
            <View style={styles.customCropRow}>
              <TextInput
                style={styles.customCropInput}
                placeholder="Or type any other crop (e.g. Banana)..."
                placeholderTextColor={Colors.textMuted}
                value={customCropInput}
                onChangeText={setCustomCropInput}
                onSubmitEditing={handleCustomCropSubmit}
              />
              <TouchableOpacity
                style={styles.customGoBtn}
                onPress={handleCustomCropSubmit}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-forward" size={18} color={Colors.pureWhite} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {CROP_OPTIONS.map((crop) => {
                const selected = selectedCrop === crop.id;
                return (
                  <TouchableOpacity
                    key={crop.id}
                    style={[styles.modalItem, selected && styles.modalItemSelected]}
                    onPress={() => handleSelectCrop(crop.id)}
                    activeOpacity={0.75}
                  >
                    <View>
                      <Text style={styles.modalItemLabel}>{crop.label}</Text>
                      <Text style={styles.modalItemLocal}>{crop.local}</Text>
                    </View>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.oliveGreen} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  selectorCard: {
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
    ...Shadows.soft,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: Colors.oliveGreen,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leafBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EBF2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownValue: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  dropdownSub: {
    fontSize: 11,
    color: Colors.sageGreen,
    fontWeight: '600',
  },
  sowingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sowingPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.pureWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  sowingPillActive: {
    backgroundColor: Colors.oliveGreen,
    borderColor: Colors.oliveGreen,
  },
  sowingPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  sowingPillTextActive: {
    color: Colors.pureWhite,
  },
  loadingCard: {
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  loadingTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
    marginTop: 4,
  },
  loadingSub: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.mutedGrey,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FDEAE6',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F2B8AC',
  },
  errorText: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.charcoal,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.oliveGreen,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
  },
  retryBtnText: {
    color: Colors.pureWhite,
    fontSize: 12.5,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.card,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cropHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.charcoal,
    flex: 1,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  aiTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
    gap: 3,
  },
  kpiLabel: {
    fontSize: 10.5,
    color: Colors.mutedGrey,
    fontWeight: '600',
    marginTop: 2,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.deepOlive,
  },
  kpiValueSmall: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.deepOlive,
  },
  kpiHint: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  metaGrid: {
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  metaText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metaBold: {
    fontWeight: '700',
    color: Colors.charcoal,
  },
  weatherStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.warmIvory,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
  },
  weatherStripText: {
    flex: 1,
    fontSize: 11.5,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  stagesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stagesHeading: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  stagesCount: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.oliveGreen,
  },
  stageCard: {
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  stageCardActive: {
    borderColor: Colors.oliveGreen,
    borderWidth: 1.5,
    backgroundColor: '#FFFDF8',
  },
  stageTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stageNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.oliveGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNumText: {
    color: Colors.pureWhite,
    fontSize: 12,
    fontWeight: '800',
  },
  stageName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  stageDays: {
    fontSize: 11,
    color: Colors.mutedGrey,
    marginTop: 1,
  },
  critPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  critPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  stageDetails: {
    backgroundColor: Colors.warmIvory,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    gap: 5,
  },
  detailLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  detailText: {
    flex: 1,
    fontSize: 11.5,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  detailBold: {
    fontWeight: '700',
    color: Colors.charcoal,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(37, 37, 31, 0.48)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.warmIvory,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '78%',
    borderWidth: 1,
    borderColor: Colors.sandBeige,
    ...Shadows.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  customCropRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  customCropInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontSize: 13,
    color: Colors.charcoal,
  },
  customGoBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.oliveGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalList: {
    maxHeight: 340,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  modalItemSelected: {
    backgroundColor: Colors.softCream,
  },
  modalItemLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  modalItemLocal: {
    fontSize: 11,
    color: Colors.sageGreen,
    marginTop: 1,
  },
});
