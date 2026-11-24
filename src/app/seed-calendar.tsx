import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { BotanicalCornerLeaves } from '../components/BotanicalCornerLeaves';
import { WheatStalkGraphic } from '../components/WheatStalkGraphic';
import { RootSenseApi, ApiSeedCalendar } from '../services/api';
import { useFarm } from '../context/FarmContext';

export type CalendarFlowView = 'landing' | 'form' | 'analyzing' | 'timeline' | 'detail';

export interface StageData {
  id: string;
  name: string;
  startDay: number;
  endDay: number;
  status: 'completed' | 'active' | 'upcoming';
  about: string;
  activities: string[];
  precautions: string[];
  aiTip: string;
  wateringCare: string;
  nutrientCare: string;
  sunlightCare: string;
  pestWatch: string;
  diseasePrevention: string;
  weatherWarning: string;
}

const CROP_OPTIONS = [
  { id: 'Ragi', label: 'Ragi (Finger Millet)', local: 'ರಾಗಿ', duration: 110 },
  { id: 'Maize', label: 'Maize (Corn)', local: 'ಮೆಕ್ಕೆಜೋಳ', duration: 105 },
  { id: 'Tomato', label: 'Tomato', local: 'ಟೊಮೆಟೊ', duration: 120 },
  { id: 'Paddy', label: 'Paddy (Rice)', local: 'ಭತ್ತ', duration: 130 },
  { id: 'Groundnut', label: 'Groundnut (Peanut)', local: 'ಶೇಂಗಾ', duration: 115 },
  { id: 'Cotton', label: 'Cotton', local: 'ಹತ್ತಿ', duration: 160 },
  { id: 'Wheat', label: 'Wheat', local: 'ಗೋಧಿ', duration: 120 },
  { id: 'Sugarcane', label: 'Sugarcane', local: 'ಕಬ್ಬು', duration: 330 },
  { id: 'Onion', label: 'Onion', local: 'ಈರುಳ್ಳಿ', duration: 100 },
  { id: 'Chilli', label: 'Chilli', local: 'ಮೆಣಸಿನಕಾಯಿ', duration: 140 },
];

const SOIL_OPTIONS = [
  { id: 'Red Loam', name: 'Red Loam (ಕಪ್ಪು ಮಿಶ್ರಿತ ಕೆಂಪು)' },
  { id: 'Black Soil', name: 'Black Soil (ಕಪ್ಪು ಮಣ್ಣು)' },
  { id: 'Sandy Loam', name: 'Sandy Loam (ಮರಳು ಮಿಶ್ರಿತ)' },
  { id: 'Clay Loam', name: 'Clay Loam (ಜಿಬ್ಬು ಮಣ್ಣು)' },
  { id: 'Alluvial Soil', name: 'Alluvial Soil (ವಂಡಲು ಮಣ್ಣು)' },
];

const DEFAULT_RAGI_STAGES: StageData[] = [
  {
    id: 's1',
    name: 'Germination',
    startDay: 1,
    endDay: 7,
    status: 'completed',
    about: 'Imbibition of water and emergence of radicle and initial shoot coleoptile.',
    activities: [
      'Ensure moist seedbed without waterlogging',
      'Check germination percentage (>85%)',
      'Protect from early bird and rodent feeding',
    ],
    precautions: [
      'Avoid deep sowing (keep within 2–3 cm depth).',
      'Prevent soil crusting on red soils.',
      'Ensure adequate surface drainage.',
    ],
    aiTip: 'Sow in lines with 22.5 to 30 cm spacing for uniform emergence.',
    wateringCare: 'Light spray or micro-sprinkler every 2 days until emergence.',
    nutrientCare: 'Basal application of well-rotted FYM (Farm Yard Manure).',
    sunlightCare: 'Open sunlight, optimal temperature 24–28°C.',
    pestWatch: 'Watch for ants and seed-carrying insects.',
    diseasePrevention: 'Seed treatment with Trichoderma viride prevents seed rot.',
    weatherWarning: 'Shield beds if unseasonal heavy downpours are forecast.',
  },
  {
    id: 's2',
    name: 'Seedling',
    startDay: 8,
    endDay: 20,
    status: 'active',
    about: 'Early plant growth and establishment of secondary root system.',
    activities: [
      'Maintain soil moisture (50 – 70%)',
      'Light weeding',
      'Check for pest/disease symptoms',
    ],
    precautions: [
      'Avoid water stagnation.',
      'Control early weeds.',
      'Monitor for leaf spot and stem borer.',
    ],
    aiTip: 'Keep the field well-drained and maintain moderate irrigation.',
    wateringCare: 'Irrigate every 4–5 days; keep root zone uniformly damp, not submerged.',
    nutrientCare: 'Apply starter dose of Phosphorus to stimulate root expansion.',
    sunlightCare: 'Full sun exposure (6+ hours daily).',
    pestWatch: 'Inspect under leaves for aphids and early stem borer pinholes.',
    diseasePrevention: 'Avoid overhead sprinkler late in the evening to reduce leaf wetness.',
    weatherWarning: 'High daytime heat (>35°C) requires afternoon soil misting.',
  },
  {
    id: 's3',
    name: 'Tillering',
    startDay: 21,
    endDay: 40,
    status: 'upcoming',
    about: 'Rapid vegetative growth and formation of productive tillers determining yield.',
    activities: [
      'Apply first top-dress Nitrogen (Urea)',
      'Mechanical hoeing / inter-cultivation',
      'Thin out overcrowded clumps to 10–12 cm spacing',
    ],
    precautions: [
      'Do not allow moisture stress during active tiller formation.',
      'Prevent stem borer damage at tillering nodes.',
      'Avoid stagnant ponding in furrow low spots.',
    ],
    aiTip: 'Inter-cultivation with a cycle hoe breaks surface crust and aerates root beds.',
    wateringCare: 'Critical watering interval: irrigate every 6–7 days.',
    nutrientCare: 'Top-dress 50% recommended Nitrogen after weeding.',
    sunlightCare: 'Requires bright, direct sunlight for photosynthetic tiller development.',
    pestWatch: 'Watch for deadhearts caused by shoot fly larvae.',
    diseasePrevention: 'Monitor for blast leaf lesions on lower foliage.',
    weatherWarning: 'Prolonged cloudy skies may slow tiller count; watch humidity.',
  },
  {
    id: 's4',
    name: 'Flowering',
    startDay: 41,
    endDay: 65,
    status: 'upcoming',
    about: 'Emergence of finger-like earheads, anthesis, and pollen fertilization.',
    activities: [
      'Ensure uninterrupted root-zone moisture',
      'Foliar spray of micronutrients (Boron & Zinc)',
      'Inspect uniform panicle exertion across field',
    ],
    precautions: [
      'CRITICAL: Moisture stress in this stage can cut grain yield by 40%.',
      'Avoid chemical pesticide sprays during morning pollination hours.',
      'Watch for neck blast and finger blast fungus.',
    ],
    aiTip: 'Do not allow soil moisture gauge to drop below 40% during flowering.',
    wateringCare: 'Most moisture-sensitive stage: irrigate every 5 days.',
    nutrientCare: 'Apply light Potash to strengthen peduncle and grain holding.',
    sunlightCare: 'Morning sunlight essential for efficient pollen viability.',
    pestWatch: 'Look for earhead bugs sucking milk from fresh spikelets.',
    diseasePrevention: 'Preventive bio-spray with Pseudomonas fluorescens.',
    weatherWarning: 'Sudden rain during peak pollen anthesis can wash away pollen.',
  },
  {
    id: 's5',
    name: 'Grain Filling',
    startDay: 66,
    endDay: 90,
    status: 'upcoming',
    about: 'Translocation of carbohydrates into developing grains (milking to dough phase).',
    activities: [
      'Provide light, steady irrigation to sustain grain filling',
      'Deploy bird scarers or reflective ribbons',
      'Prepare drying yards and storage bags',
    ],
    precautions: [
      'Avoid severe soil drying which results in chaffy grains.',
      'Prevent waterlogging which delays maturity and causes lodging.',
      'Scout for late neck blast lesions.',
    ],
    aiTip: 'One final irrigation at early dough stage maximizes 1000-grain weight.',
    wateringCare: 'Taper irrigation to once every 8–10 days as grains firm up.',
    nutrientCare: 'No soil fertilizer; ensure soil holds residual potash for grain starch.',
    sunlightCare: 'Dry, warm sunny days accelerate healthy grain hardening.',
    pestWatch: 'Protect field margins from wild birds and earhead caterpillars.',
    diseasePrevention: 'Ensure crop canopy has free air movement.',
    weatherWarning: 'High wind plus wet soil can cause stem lodging.',
  },
  {
    id: 's6',
    name: 'Maturity & Harvest',
    startDay: 91,
    endDay: 110,
    status: 'upcoming',
    about: 'Foliage turns straw-yellow and grains harden to physiological maturity.',
    activities: [
      'Stop all irrigation 10–12 days prior to harvest',
      'Harvest when 85% of earheads turn golden brown',
      'Sun-dry harvested earheads for 2–3 days before threshing',
    ],
    precautions: [
      'Harvest on time to prevent bird damage and grain shattering.',
      'Store dried grain below 12% moisture to avoid storage weevils.',
      'Clean and grade seed before storing in airtight containers.',
    ],
    aiTip: 'Harvest on a dry, clear morning. Threshing is easiest when earheads are brittle dry.',
    wateringCare: 'Zero irrigation. Allow field soil to dry completely for sickle access.',
    nutrientCare: 'Field post-harvest: incorporate crop stubble into soil for organic carbon.',
    sunlightCare: 'Direct sun for post-harvest grain drying on tarpaulin.',
    pestWatch: 'Treat storage bins with neem leaves against grain borer.',
    diseasePrevention: 'Do not stack damp earheads; avoid mold development.',
    weatherWarning: 'Check 5-day rain forecast before cutting standing crop.',
  },
];

export default function SeedCalendarScreen() {
  const router = useRouter();
  const { farmDetails } = useFarm();

  // Current view in the 5-screen flow:
  // 1: 'landing' -> 2: 'form' -> 3: 'analyzing' -> 4: 'timeline' -> 5: 'detail'
  const [currentScreen, setCurrentScreen] = useState<CalendarFlowView>('landing');

  // Form states
  const [selectedCrop, setSelectedCrop] = useState(farmDetails?.cropGrown || 'Ragi');
  const [sowingDateText, setSowingDateText] = useState('10 Nov 2026');
  const [farmLocation, setFarmLocation] = useState(farmDetails?.location || 'Tumakuru, Karnataka');
  const [soilType, setSoilType] = useState(farmDetails?.soilType || 'Red Loam');
  const [fieldArea, setFieldArea] = useState(`${farmDetails?.fieldDimension || '2.5'} acres`);

  // Modals
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [soilModalOpen, setSoilModalOpen] = useState(false);
  const [sowingModalOpen, setSowingModalOpen] = useState(false);

  // Analysis screen animation states
  const [analyzingStep, setAnalyzingStep] = useState(1);
  const radarAnim = useRef(new Animated.Value(0)).current;

  // Timeline / Detail states
  const [currentDay, setCurrentDay] = useState(24);
  const [totalDuration, setTotalDuration] = useState(110);
  const [stages, setStages] = useState<StageData[]>(DEFAULT_RAGI_STAGES);
  const [selectedStageIndex, setSelectedStageIndex] = useState(1); // default Seedling (Day 8-20)
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'care' | 'precautions'>('overview');
  const [completedActivities, setCompletedActivities] = useState<Record<string, boolean>>({
    'Maintain soil moisture (50 – 70%)': true,
  });

  // Radar pulse animation for Screen 3
  useEffect(() => {
    if (currentScreen === 'analyzing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(radarAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(radarAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [currentScreen, radarAnim]);

  // Step-by-step checklist on Screen 3
  useEffect(() => {
    if (currentScreen === 'analyzing') {
      setAnalyzingStep(1);
      const t1 = setTimeout(() => setAnalyzingStep(2), 600);
      const t2 = setTimeout(() => setAnalyzingStep(3), 1300);
      const t3 = setTimeout(() => setAnalyzingStep(4), 2000);
      const t4 = setTimeout(() => {
        setCurrentScreen('timeline');
      }, 2600);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [currentScreen]);

  // Sync stages when crop or backend data updates
  const generateStagesForCrop = useCallback((crop: string, backendData?: ApiSeedCalendar | null) => {
    const cropOpt = CROP_OPTIONS.find((c) => c.id.toLowerCase() === crop.toLowerCase());
    const dur = cropOpt?.duration || backendData?.total_days_max || 110;
    setTotalDuration(dur);

    if (backendData && Array.isArray(backendData.stages) && backendData.stages.length >= 3) {
      const mapped: StageData[] = backendData.stages.map((st, idx) => ({
        id: `gen-${idx}`,
        name: st.stage_name,
        startDay: st.day_start,
        endDay: st.day_end,
        status: currentDay > st.day_end ? 'completed' : currentDay >= st.day_start ? 'active' : 'upcoming',
        about: st.key_risk ? `${st.stage_name}: ${st.key_risk}` : `Key agronomic milestone for ${crop}.`,
        activities: [
          `Watering target: ${st.water_need || 'Regular irrigation'}`,
          'Monitor vegetative vigor & root aeration',
          'Inspect field edges for early pest detection',
        ],
        precautions: [
          st.key_risk || 'Prevent moisture stagnation.',
          'Control competing weeds early.',
          'Maintain balanced soil nutrition.',
        ],
        aiTip: st.action_tip || 'Maintain moderate soil moisture and monitor local weather.',
        wateringCare: `Recommended requirement: ${st.water_need || 'Optimal soil moisture'}.`,
        nutrientCare: 'Apply stage-specific balanced fertilization as recommended.',
        sunlightCare: 'Ensure open sun exposure and adequate row ventilation.',
        pestWatch: 'Monitor for seasonal pests common in vegetative stages.',
        diseasePrevention: 'Ensure field drainage channels remain clear.',
        weatherWarning: backendData.weather_advisory || 'Keep drainage clear during heavy rains.',
      }));
      setStages(mapped);
      const activeIdx = mapped.findIndex((s) => s.status === 'active');
      setSelectedStageIndex(activeIdx >= 0 ? activeIdx : 1);
    } else {
      setStages(DEFAULT_RAGI_STAGES);
      setSelectedStageIndex(1);
    }
  }, [currentDay]);

  const handleStartGeneration = async () => {
    setCurrentScreen('analyzing');
    try {
      const data = await RootSenseApi.getSeedCalendar(selectedCrop);
      generateStagesForCrop(selectedCrop, data);
    } catch {
      generateStagesForCrop(selectedCrop, null);
    }
  };

  const toggleActivity = (activity: string) => {
    setCompletedActivities((prev) => ({
      ...prev,
      [activity]: !prev[activity],
    }));
  };

  const activeStage = stages[selectedStageIndex] || stages[1] || stages[0];
  const progressPercent = Math.min(100, Math.round((currentDay / totalDuration) * 100));

  // =========================================================================
  // SCREEN 1: LANDING / ONBOARDING SCREEN
  // =========================================================================
  if (currentScreen === 'landing') {
    return (
      <View style={styles.container}>
        {/* Sunrise Sprout Background Photo - 100% VISIBLE */}
        <Image
          source={require('../../assets/seed-calendar-bg.jpg')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* Soft Vignette Overlay */}
        <LinearGradient
          colors={[
            'rgba(251, 248, 242, 0.40)',
            'rgba(251, 248, 242, 0.20)',
            'rgba(251, 248, 242, 0.70)',
            'rgba(251, 248, 242, 0.95)',
          ]}
          locations={[0, 0.35, 0.65, 0.95]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Top Brand Mark */}
          <View style={styles.landingTopBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.landingBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <View style={styles.brandBadge}>
              <Ionicons name="leaf" size={18} color={Colors.oliveGreen} />
              <Text style={styles.brandTitle}>Root Sense</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.landingScroll} showsVerticalScrollIndicator={false}>
            {/* Calendar Icon Badge & Title */}
            <View style={styles.landingHeaderSection}>
              <View style={styles.calendarIconCircle}>
                <Ionicons name="calendar" size={28} color="#C49A45" />
              </View>
              <Text style={styles.landingTitle}>Seed Calendar</Text>
              <Text style={styles.landingSubtitle}>
                Plan, track and manage your crop journey from sowing to harvest.
              </Text>
            </View>

            {/* Hero Sprout Window Card */}
            <View style={styles.sproutHeroCard}>
              <Image
                source={require('../../assets/seed-calendar-bg.jpg')}
                style={styles.sproutHeroImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)']}
                style={StyleSheet.absoluteFill}
              />
            </View>

            {/* Feature Checklist Pill Card */}
            <View style={styles.featurePillCard}>
              <View style={styles.featureItemRow}>
                <Ionicons name="calendar-outline" size={20} color={Colors.oliveGreen} style={styles.featureIcon} />
                <Text style={styles.featureText}>Know crop duration</Text>
              </View>
              <View style={styles.featureItemRow}>
                <Ionicons name="leaf-outline" size={20} color={Colors.oliveGreen} style={styles.featureIcon} />
                <Text style={styles.featureText}>Track growth stages</Text>
              </View>
              <View style={styles.featureItemRow}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.oliveGreen} style={styles.featureIcon} />
                <Text style={styles.featureText}>Get stage-wise precautions</Text>
              </View>
              <View style={styles.featureItemRow}>
                <Ionicons name="notifications-outline" size={20} color={Colors.oliveGreen} style={styles.featureIcon} />
                <Text style={styles.featureText}>Receive timely reminders</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.landingButtonContainer}>
              <TouchableOpacity
                style={styles.primaryPillButton}
                onPress={() => setCurrentScreen('form')}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryPillButtonText}>Create Crop Calendar</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.pureWhite} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.textLinkButton}
                onPress={() => setCurrentScreen('timeline')}
                activeOpacity={0.7}
              >
                <Text style={styles.textLinkButtonText}>My Crop Calendars</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 2: "ADD CROP DETAILS" (FORM)
  // =========================================================================
  if (currentScreen === 'form') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Top Leaf Accent in Corner */}
          <BotanicalCornerLeaves size={105} />

          {/* Navigation Bar */}
          <View style={styles.formNavBar}>
            <TouchableOpacity onPress={() => setCurrentScreen('landing')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Title Section */}
            <View style={styles.formTitleSection}>
              <Text style={styles.formHeadline}>Add Crop Details</Text>
              <Text style={styles.formSubtitle}>
                Enter your sowing details to generate a smart crop calendar.
              </Text>
            </View>

            {/* Form Fields matching Mockup */}
            <View style={styles.formFieldsBox}>
              {/* 1. Crop */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Crop</Text>
                <TouchableOpacity
                  style={styles.inputCard}
                  onPress={() => setCropModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.inputCardLeft}>
                    <Ionicons name="leaf" size={20} color={Colors.oliveGreen} style={styles.inputCardIcon} />
                    <Text style={styles.inputCardValue}>{selectedCrop}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={Colors.deepOlive} />
                </TouchableOpacity>
              </View>

              {/* 2. Sowing Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sowing Date</Text>
                <TouchableOpacity
                  style={styles.inputCard}
                  onPress={() => setSowingModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.inputCardLeft}>
                    <Ionicons name="calendar-outline" size={20} color={Colors.oliveGreen} style={styles.inputCardIcon} />
                    <Text style={styles.inputCardValue}>{sowingDateText}</Text>
                  </View>
                  <Ionicons name="calendar" size={18} color={Colors.deepOlive} />
                </TouchableOpacity>
              </View>

              {/* 3. Farm Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Farm Location</Text>
                <View style={styles.inputCard}>
                  <View style={styles.inputCardLeft}>
                    <Ionicons name="location-sharp" size={20} color={Colors.oliveGreen} style={styles.inputCardIcon} />
                    <TextInput
                      style={styles.textInputBox}
                      value={farmLocation}
                      onChangeText={setFarmLocation}
                      placeholder="Location"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>
              </View>

              {/* 4. Soil Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Soil Type</Text>
                <TouchableOpacity
                  style={styles.inputCard}
                  onPress={() => setSoilModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.inputCardLeft}>
                    <Ionicons name="layers" size={20} color={Colors.oliveGreen} style={styles.inputCardIcon} />
                    <Text style={styles.inputCardValue}>{soilType}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={Colors.deepOlive} />
                </TouchableOpacity>
              </View>

              {/* 5. Area (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Area (Optional)</Text>
                <View style={styles.inputCard}>
                  <View style={styles.inputCardLeft}>
                    <Ionicons name="crop-outline" size={20} color={Colors.oliveGreen} style={styles.inputCardIcon} />
                    <TextInput
                      style={styles.textInputBox}
                      value={fieldArea}
                      onChangeText={setFieldArea}
                      placeholder="e.g. 2.5 acres"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Generate Button */}
            <View style={styles.formBottomBar}>
              <TouchableOpacity
                style={styles.primaryPillButton}
                onPress={handleStartGeneration}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryPillButtonText}>Generate Calendar</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.pureWhite} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Crop Selection Modal */}
          <Modal visible={cropModalOpen} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCropModalOpen(false)}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitleText}>Select Crop</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  {CROP_OPTIONS.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.modalRow, selectedCrop === c.id && styles.modalRowActive]}
                      onPress={() => {
                        setSelectedCrop(c.id);
                        setCropModalOpen(false);
                      }}
                    >
                      <View>
                        <Text style={styles.modalRowMain}>{c.label}</Text>
                        <Text style={styles.modalRowSub}>{c.local} • {c.duration} days</Text>
                      </View>
                      {selectedCrop === c.id && <Ionicons name="checkmark-circle" size={20} color={Colors.oliveGreen} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Soil Selection Modal */}
          <Modal visible={soilModalOpen} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSoilModalOpen(false)}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitleText}>Select Soil Type</Text>
                {SOIL_OPTIONS.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.modalRow, soilType === s.id && styles.modalRowActive]}
                    onPress={() => {
                      setSoilType(s.id);
                      setSoilModalOpen(false);
                    }}
                  >
                    <Text style={styles.modalRowMain}>{s.name}</Text>
                    {soilType === s.id && <Ionicons name="checkmark-circle" size={20} color={Colors.oliveGreen} />}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Sowing Date Quick Selector Modal */}
          <Modal visible={sowingModalOpen} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSowingModalOpen(false)}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitleText}>Select Sowing Timing</Text>
                {[
                  { label: 'Today', text: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), day: 1 },
                  { label: '10 Days Ago', text: '14 Nov 2026', day: 10 },
                  { label: '24 Days Ago (Seedling Stage)', text: '10 Nov 2026', day: 24 },
                  { label: '45 Days Ago (Flowering Stage)', text: '10 Oct 2026', day: 45 },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.modalRow, sowingDateText === item.text && styles.modalRowActive]}
                    onPress={() => {
                      setSowingDateText(item.text);
                      setCurrentDay(item.day);
                      setSowingModalOpen(false);
                    }}
                  >
                    <View>
                      <Text style={styles.modalRowMain}>{item.text}</Text>
                      <Text style={styles.modalRowSub}>{item.label}</Text>
                    </View>
                    {sowingDateText === item.text && <Ionicons name="checkmark-circle" size={20} color={Colors.oliveGreen} />}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 3: "ANALYSING YOUR CROP..." (AI GENERATION)
  // =========================================================================
  if (currentScreen === 'analyzing') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.formNavBar}>
            <TouchableOpacity onPress={() => setCurrentScreen('form')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
          </View>

          <View style={styles.analyzingContent}>
            {/* Concentric Breathing Radar / Sprout Center */}
            <View style={styles.radarContainer}>
              <Animated.View
                style={[
                  styles.radarPulseRing,
                  {
                    transform: [
                      {
                        scale: radarAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1.25],
                        }),
                      },
                    ],
                    opacity: radarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 0.15],
                    }),
                  },
                ]}
              />
              <View style={styles.radarOuterBorder}>
                <View style={styles.radarInnerCircle}>
                  <Ionicons name="leaf" size={38} color={Colors.oliveGreen} />
                </View>
              </View>
            </View>

            {/* Headline */}
            <Text style={styles.analyzingHeadline}>Analysing your crop...</Text>
            <Text style={styles.analyzingSub}>
              Our AI is creating a personalised crop calendar with growth stages, precautions and recommendations.
            </Text>

            {/* Step-by-Step Checklist matching Screen 3 */}
            <View style={styles.checklistCard}>
              <View style={styles.checklistItem}>
                {analyzingStep >= 1 ? (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.oliveGreen} />
                ) : (
                  <View style={styles.pendingDotCircle} />
                )}
                <Text style={styles.checklistText}>Crop duration &amp; stages</Text>
              </View>

              <View style={styles.checklistItem}>
                {analyzingStep >= 2 ? (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.oliveGreen} />
                ) : (
                  <View style={styles.pendingDotCircle} />
                )}
                <Text style={styles.checklistText}>Local weather &amp; soil match</Text>
              </View>

              <View style={styles.checklistItem}>
                {analyzingStep >= 3 ? (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.oliveGreen} />
                ) : analyzingStep === 2 ? (
                  <Ionicons name="ellipse-outline" size={22} color="#C49A45" />
                ) : (
                  <View style={styles.pendingDotCircle} />
                )}
                <Text style={styles.checklistText}>Care &amp; precaution plan</Text>
              </View>

              <View style={styles.checklistItem}>
                {analyzingStep >= 4 ? (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.oliveGreen} />
                ) : (
                  <View style={styles.pendingDotCircle} />
                )}
                <Text style={styles.checklistText}>Generating your calendar...</Text>
              </View>
            </View>
          </View>

          {/* Bottom Crop Rows Landscape */}
          <View style={styles.analyzingBottomBanner}>
            <Image
              source={require('../../assets/seed-calendar-bg.jpg')}
              style={styles.bottomLandscapePhoto}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(251, 248, 242, 1)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 4: "[CROP] CROP CALENDAR" (TIMELINE OVERVIEW)
  // =========================================================================
  if (currentScreen === 'timeline') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header Row */}
          <View style={styles.timelineHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('form')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <View style={styles.timelineHeaderCenter}>
              <Text style={styles.timelineTitleText}>{selectedCrop} Crop Calendar</Text>
              <View style={styles.sownPillBadge}>
                <Ionicons name="calendar-outline" size={13} color={Colors.deepOlive} />
                <Text style={styles.sownPillText}>Sown on {sowingDateText}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setCurrentScreen('form')} style={styles.menuDotsBtn}>
              <Ionicons name="ellipsis-vertical" size={20} color={Colors.deepOlive} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.timelineScroll} showsVerticalScrollIndicator={false}>
            {/* Total Duration & Wheat Graphic Card */}
            <View style={styles.durationHeroCard}>
              <View style={styles.durationTextSide}>
                <Text style={styles.durationNumber}>≈ {totalDuration} <Text style={{ fontSize: 18 }}>days</Text></Text>
                <Text style={styles.durationLabel}>Total crop duration</Text>
              </View>
              <View style={styles.durationGraphicSide}>
                <WheatStalkGraphic size={70} />
              </View>
            </View>

            {/* Progress Bar Card: Day X of Y */}
            <View style={styles.progressCard}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressDayText}>Day {currentDay} of {totalDuration}</Text>
                <Text style={styles.progressPctText}>{progressPercent}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>

            {/* Current Stage Highlight Card (Clickable to jump to Screen 5!) */}
            <TouchableOpacity
              style={styles.currentStageCard}
              onPress={() => {
                const activeIdx = stages.findIndex((s) => s.status === 'active');
                setSelectedStageIndex(activeIdx >= 0 ? activeIdx : 1);
                setCurrentScreen('detail');
              }}
              activeOpacity={0.88}
            >
              <View style={styles.currentStageLeft}>
                <View style={styles.currentStageIconCircle}>
                  <Ionicons name="leaf" size={22} color={Colors.oliveGreen} />
                </View>
                <View>
                  <Text style={styles.currentStageSubtitle}>Current Stage</Text>
                  <Text style={styles.currentStageName}>
                    {activeStage.name} <Text style={styles.currentStageRange}>({activeStage.startDay} – {activeStage.endDay} days)</Text>
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.deepOlive} />
            </TouchableOpacity>

            {/* Crop Journey Vertical Timeline Title */}
            <Text style={styles.journeySectionTitle}>Crop Journey</Text>

            {/* Vertical Timeline Nodes */}
            <View style={styles.timelineList}>
              {stages.map((stage, idx) => {
                const isCurrent = stage.status === 'active';
                const isDone = stage.status === 'completed';
                const isLast = idx === stages.length - 1;

                return (
                  <View key={stage.id} style={styles.timelineRow}>
                    {/* Node Pillar & Bullet */}
                    <View style={styles.timelineNodeCol}>
                      <View
                        style={[
                          styles.timelineCircle,
                          isDone && styles.timelineCircleDone,
                          isCurrent && styles.timelineCircleActive,
                        ]}
                      >
                        {isDone ? (
                          <Ionicons name="checkmark" size={13} color={Colors.pureWhite} />
                        ) : isCurrent ? (
                          <View style={styles.activeInnerDot} />
                        ) : null}
                      </View>
                      {!isLast && <View style={[styles.timelineTrackLine, isDone && styles.timelineTrackDone]} />}
                    </View>

                    {/* Stage Info Card (Click to open Screen 5 Detail!) */}
                    <TouchableOpacity
                      style={[styles.stageItemCard, isCurrent && styles.stageItemCardActive]}
                      onPress={() => {
                        setSelectedStageIndex(idx);
                        setCurrentScreen('detail');
                      }}
                      activeOpacity={0.85}
                    >
                      <View style={styles.stageItemContent}>
                        <Text style={[styles.stageItemName, isCurrent && styles.stageItemNameActive]}>
                          {stage.name}
                        </Text>
                        <Text style={styles.stageItemDays}>
                          Day {stage.startDay} – {stage.endDay}
                        </Text>
                      </View>
                      {isDone && (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.oliveGreen} />
                      )}
                      {isCurrent && (
                        <View style={styles.currentPill}>
                          <Text style={styles.currentPillText}>NOW</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 5: "[STAGE NAME] STAGE" (DETAIL VIEW WITH TABS & ACTIVITIES)
  // =========================================================================
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Navigation Bar */}
        <View style={styles.detailNavBar}>
          <TouchableOpacity onPress={() => setCurrentScreen('timeline')} style={styles.circleBackBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
          {/* Header Title & Subtitle */}
          <View style={styles.detailTitleBox}>
            <Text style={styles.detailMainTitle}>{activeStage.name} Stage</Text>
            <Text style={styles.detailSubDays}>
              Day {activeStage.startDay} – {activeStage.endDay}
            </Text>
          </View>

          {/* Hero Stage Photo Banner */}
          <View style={styles.detailHeroBanner}>
            <Image
              source={require('../../assets/seed-calendar-bg.jpg')}
              style={styles.detailHeroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.4)']}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {/* Segmented Pill Tabs: [ Overview ] [ Care ] [ Precautions ] */}
          <View style={styles.segmentedTabsRow}>
            {(['overview', 'care', 'precautions'] as const).map((tab) => {
              const active = activeDetailTab === tab;
              const label = tab === 'overview' ? 'Overview' : tab === 'care' ? 'Care' : 'Precautions';
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.segmentTab, active && styles.segmentTabActive]}
                  onPress={() => setActiveDetailTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentTabText, active && styles.segmentTabTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* TAB 1: OVERVIEW */}
          {activeDetailTab === 'overview' && (
            <View style={styles.tabContentGroup}>
              {/* About this stage */}
              <View style={styles.detailSectionCard}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="leaf" size={18} color={Colors.oliveGreen} />
                  <Text style={styles.sectionHeadingTitle}>About this stage</Text>
                </View>
                <Text style={styles.sectionBodyText}>{activeStage.about}</Text>
              </View>

              {/* Key activities (Interactive checklist!) */}
              <View style={styles.detailSectionCard}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="checkmark-done" size={18} color={Colors.oliveGreen} />
                  <Text style={styles.sectionHeadingTitle}>Key activities</Text>
                </View>
                <View style={styles.checklistActivities}>
                  {activeStage.activities.map((act) => {
                    const checked = !!completedActivities[act];
                    return (
                      <TouchableOpacity
                        key={act}
                        style={styles.activityCheckRow}
                        onPress={() => toggleActivity(act)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.customCheckbox, checked && styles.customCheckboxChecked]}>
                          {checked && <Ionicons name="checkmark" size={14} color={Colors.pureWhite} />}
                        </View>
                        <Text style={[styles.activityLabel, checked && styles.activityLabelChecked]}>
                          {act}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Precautions */}
              <View style={styles.detailSectionCard}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="shield-checkmark" size={18} color={Colors.oliveGreen} />
                  <Text style={styles.sectionHeadingTitle}>Precautions</Text>
                </View>
                <View style={styles.bulletList}>
                  {activeStage.precautions.map((prec, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={styles.bulletSymbol}>•</Text>
                      <Text style={styles.bulletText}>{prec}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* AI Tip Box */}
              <View style={styles.aiTipCard}>
                <View style={styles.aiTipIconWrap}>
                  <Ionicons name="bulb" size={20} color="#D98A2C" />
                </View>
                <View style={styles.aiTipTextSide}>
                  <Text style={styles.aiTipLabel}>AI Tip</Text>
                  <Text style={styles.aiTipBody}>{activeStage.aiTip}</Text>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: CARE */}
          {activeDetailTab === 'care' && (
            <View style={styles.tabContentGroup}>
              <View style={styles.detailSectionCard}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="water" size={18} color="#3478F6" />
                  <Text style={styles.sectionHeadingTitle}>Watering &amp; Soil Moisture</Text>
                </View>
                <Text style={styles.sectionBodyText}>{activeStage.wateringCare}</Text>
              </View>

              <View style={styles.detailSectionCard}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="flask" size={18} color={Colors.oliveGreen} />
                  <Text style={styles.sectionHeadingTitle}>Nutrient Management</Text>
                </View>
                <Text style={styles.sectionBodyText}>{activeStage.nutrientCare}</Text>
              </View>

              <View style={styles.detailSectionCard}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="sunny" size={18} color="#E8982C" />
                  <Text style={styles.sectionHeadingTitle}>Sunlight &amp; Aeration</Text>
                </View>
                <Text style={styles.sectionBodyText}>{activeStage.sunlightCare}</Text>
              </View>
            </View>
          )}

          {/* TAB 3: PRECAUTIONS */}
          {activeDetailTab === 'precautions' && (
            <View style={styles.tabContentGroup}>
              <View style={styles.detailSectionCard}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="bug" size={18} color="#E0523C" />
                  <Text style={styles.sectionHeadingTitle}>Pest Watch</Text>
                </View>
                <Text style={styles.sectionBodyText}>{activeStage.pestWatch}</Text>
              </View>

              <View style={styles.detailSectionCard}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="medical" size={18} color="#E8982C" />
                  <Text style={styles.sectionHeadingTitle}>Disease Prevention</Text>
                </View>
                <Text style={styles.sectionBodyText}>{activeStage.diseasePrevention}</Text>
              </View>

              <View style={styles.detailSectionCard}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="cloud" size={18} color="#5B6E80" />
                  <Text style={styles.sectionHeadingTitle}>Weather Advisory</Text>
                </View>
                <Text style={styles.sectionBodyText}>{activeStage.weatherWarning}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// =========================================================================
// STYLES
// =========================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  safeArea: {
    flex: 1,
  },
  circleBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.6)',
    ...Shadows.soft,
  },
  primaryPillButton: {
    height: 52,
    backgroundColor: '#5F7445',
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.card,
  },
  primaryPillButtonText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.pureWhite,
    letterSpacing: 0.3,
  },

  // SCREEN 1: LANDING
  landingTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  landingBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.deepOlive,
  },
  landingScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  landingHeaderSection: {
    alignItems: 'flex-start',
    gap: 6,
  },
  calendarIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.soft,
  },
  landingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#262D1D',
    letterSpacing: -0.5,
  },
  landingSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: '#555C4C',
    lineHeight: 20,
  },
  sproutHeroCard: {
    height: 180,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  sproutHeroImage: {
    width: '100%',
    height: '100%',
  },
  featurePillCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    gap: 14,
    ...Shadows.card,
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 24,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A3122',
  },
  landingButtonContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  textLinkButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  textLinkButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.deepOlive,
  },

  // SCREEN 2: FORM
  formNavBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  formScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  formTitleSection: {
    gap: 6,
    paddingRight: 60,
  },
  formHeadline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#252C1D',
    letterSpacing: -0.4,
  },
  formSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: '#565D4D',
    lineHeight: 20,
  },
  formFieldsBox: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#343B2A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    paddingHorizontal: Spacing.md,
    minHeight: 52,
    ...Shadows.card,
  },
  inputCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputCardIcon: {
    width: 22,
  },
  inputCardValue: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: '#1A1E14',
  },
  textInputBox: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    color: '#1A1E14',
    fontWeight: '600',
    paddingVertical: Spacing.sm,
  },
  formBottomBar: {
    marginTop: Spacing.sm,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 32, 24, 0.45)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalBox: {
    backgroundColor: '#FAF7F2',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.8)',
    ...Shadows.elevated,
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#262D1D',
    marginBottom: Spacing.md,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  modalRowActive: {
    backgroundColor: 'rgba(95, 116, 69, 0.12)',
  },
  modalRowMain: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1E14',
  },
  modalRowSub: {
    fontSize: 11,
    color: '#656D5B',
    marginTop: 2,
  },

  // SCREEN 3: ANALYSING
  analyzingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    marginTop: -20,
  },
  radarContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: '#7A9A56',
    backgroundColor: 'rgba(122, 154, 86, 0.15)',
  },
  radarOuterBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: '#7A9A56',
    borderTopColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    ...Shadows.card,
  },
  radarInnerCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#F3EEDB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingHeadline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#262D1D',
    textAlign: 'center',
  },
  analyzingSub: {
    fontSize: 13.5,
    color: '#555C4C',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.sm,
  },
  checklistCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    gap: 14,
    ...Shadows.card,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingDotCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#A89E8C',
  },
  checklistText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#262D1D',
  },
  analyzingBottomBanner: {
    height: 110,
    width: '100%',
    overflow: 'hidden',
  },
  bottomLandscapePhoto: {
    width: '100%',
    height: '100%',
  },

  // SCREEN 4: TIMELINE OVERVIEW
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  timelineHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  timelineTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#252C1D',
  },
  sownPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sownPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#656D5B',
  },
  menuDotsBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  durationHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  durationTextSide: {
    gap: 2,
  },
  durationNumber: {
    fontSize: 30,
    fontWeight: '800',
    color: '#262D1D',
  },
  durationLabel: {
    fontSize: 12,
    color: '#656D5B',
    fontWeight: '600',
  },
  durationGraphicSide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    gap: 8,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#262D1D',
  },
  progressPctText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5F7445',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EAE3D5',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5F7445',
    borderRadius: 4,
  },
  currentStageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF5E8',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#748E55',
    ...Shadows.card,
  },
  currentStageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentStageIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF0DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentStageSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#656D5B',
    textTransform: 'uppercase',
  },
  currentStageName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#262D1D',
  },
  currentStageRange: {
    fontSize: 12,
    fontWeight: '600',
    color: '#656D5B',
  },
  journeySectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#252C1D',
    marginTop: 6,
  },
  timelineList: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
  },
  timelineNodeCol: {
    alignItems: 'center',
    width: 26,
  },
  timelineCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C7BFAF',
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineCircleDone: {
    backgroundColor: '#5F7445',
    borderColor: '#5F7445',
  },
  timelineCircleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderColor: '#5F7445',
    borderWidth: 2.5,
    backgroundColor: '#FAF7F2',
  },
  activeInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5F7445',
  },
  timelineTrackLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#DCD4C4',
    marginVertical: 4,
  },
  timelineTrackDone: {
    backgroundColor: '#7A9A56',
  },
  stageItemCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.6)',
    marginBottom: 10,
  },
  stageItemCardActive: {
    backgroundColor: '#FAF5E8',
    borderColor: '#748E55',
    borderWidth: 1.5,
    ...Shadows.soft,
  },
  stageItemContent: {
    gap: 2,
  },
  stageItemName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#262D1D',
  },
  stageItemNameActive: {
    color: '#262D1D',
    fontWeight: '800',
  },
  stageItemDays: {
    fontSize: 11.5,
    color: '#656D5B',
  },
  currentPill: {
    backgroundColor: '#5F7445',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  currentPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.pureWhite,
  },

  // SCREEN 5: STAGE DETAIL
  detailNavBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  detailScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  detailTitleBox: {
    gap: 2,
  },
  detailMainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#252C1D',
    letterSpacing: -0.4,
  },
  detailSubDays: {
    fontSize: 13,
    color: '#656D5B',
    fontWeight: '600',
  },
  detailHeroBanner: {
    height: 160,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  detailHeroImage: {
    width: '100%',
    height: '100%',
  },
  segmentedTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.7)',
  },
  segmentTabActive: {
    backgroundColor: '#5F7445',
    borderColor: '#5F7445',
  },
  segmentTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4A5240',
  },
  segmentTabTextActive: {
    color: Colors.pureWhite,
  },
  tabContentGroup: {
    gap: Spacing.md,
  },
  detailSectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    gap: 10,
    ...Shadows.card,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeadingTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#262D1D',
  },
  sectionBodyText: {
    fontSize: 13,
    color: '#444C3B',
    lineHeight: 19,
  },
  checklistActivities: {
    gap: 10,
  },
  activityCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#7A9A56',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCheckboxChecked: {
    backgroundColor: '#5F7445',
    borderColor: '#5F7445',
  },
  activityLabel: {
    fontSize: 13,
    color: '#262D1D',
    fontWeight: '600',
    flex: 1,
  },
  activityLabelChecked: {
    color: '#777F6E',
    textDecorationLine: 'line-through',
  },
  bulletList: {
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletSymbol: {
    fontSize: 14,
    color: '#262D1D',
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 12.5,
    color: '#444C3B',
    lineHeight: 18,
  },
  aiTipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FEF8EA',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#F3D58C',
    ...Shadows.soft,
  },
  aiTipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDF1D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiTipTextSide: {
    flex: 1,
    gap: 2,
  },
  aiTipLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B06F1B',
    textTransform: 'uppercase',
  },
  aiTipBody: {
    fontSize: 12.5,
    color: '#5C441A',
    lineHeight: 18,
    fontWeight: '500',
  },
});
