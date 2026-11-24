import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { BotanicalCornerLeaves } from '../../components/BotanicalCornerLeaves';
import { useFarm } from '../../context/FarmContext';

export type WeatherScreenView =
  | 'landing'
  | 'dashboard'
  | 'forecast'
  | 'crop-impact'
  | 'insights'
  | 'alerts'
  | 'map'
  | 'monthly'
  | 'all-set';

// =========================================================================
// SVG GRAPHICS (3D Cloud & Sun, Aerial Farm Map, Spline Chart, Calendars)
// =========================================================================

/** 3D Sun behind Cloud Graphic matching the new UI */
function SunCloud3DGraphic({ size = 115 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.85} viewBox="0 0 115 95">
      <Defs>
        <SvgGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFE066" />
          <Stop offset="55%" stopColor="#F5B025" />
          <Stop offset="100%" stopColor="#E67E22" />
        </SvgGradient>
        <SvgGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="45%" stopColor="#EFF5FA" />
          <Stop offset="100%" stopColor="#C2DAEE" />
        </SvgGradient>
        <SvgGradient id="cloudShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="rgba(80, 120, 160, 0.22)" />
          <Stop offset="100%" stopColor="rgba(80, 120, 160, 0.04)" />
        </SvgGradient>
      </Defs>

      {/* Sun Rays */}
      <Path
        d="M 72 10 L 72 3 M 94 20 L 99 15 M 102 42 L 109 42 M 93 63 L 98 68 M 52 18 L 47 13"
        stroke="#F5B025"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Golden Glowing Sun */}
      <Circle cx="72" cy="40" r="23" fill="url(#sunGrad)" />

      {/* Soft Ambient Shadow under Cloud */}
      <Path
        d="M 24 76 C 12 76, 5 65, 14 53 C 16 37, 34 31, 46 39 C 52 25, 74 25, 82 39 C 94 38, 104 47, 102 61 C 100 73, 88 76, 80 76 Z"
        fill="url(#cloudShadow)"
        transform="translate(0, 3)"
      />

      {/* Fluffy 3D Cloud */}
      <Path
        d="M 24 73 C 12 73, 5 62, 14 50 C 16 34, 34 28, 46 36 C 52 22, 74 22, 82 36 C 94 35, 104 44, 102 58 C 100 70, 88 73, 80 73 Z"
        fill="url(#cloudGrad)"
      />
      {/* High-light gloss */}
      <Circle cx="46" cy="39" r="14" fill="#FFFFFF" fillOpacity="0.6" />
      <Circle cx="66" cy="35" r="16" fill="#FFFFFF" fillOpacity="0.45" />
    </Svg>
  );
}

/** 7-Day Connected Spline Temperature Chart matching Screen 3 */
function SevenDaySplineChart({ activeIndex = 0 }: { activeIndex?: number }) {
  const points = [
    { x: 26, y: 35, temp: 32 },
    { x: 74, y: 44, temp: 31 },
    { x: 122, y: 62, temp: 29 },
    { x: 170, y: 70, temp: 28 },
    { x: 218, y: 53, temp: 30 },
    { x: 266, y: 44, temp: 31 },
  ];

  return (
    <View style={styles.splineChartWrapper}>
      <Svg width="100%" height={120} viewBox="0 0 292 120">
        <Defs>
          <SvgGradient id="splineStrokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#C6922C" />
            <Stop offset="50%" stopColor="#D9A83E" />
            <Stop offset="100%" stopColor="#C6922C" />
          </SvgGradient>
          <SvgGradient id="splineAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#EFC568" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#FAF7F2" stopOpacity={0.0} />
          </SvgGradient>
        </Defs>

        {/* Soft Area fill */}
        <Path
          d="M 26 35 C 50 35, 54 44, 74 44 C 98 44, 102 62, 122 62 C 146 62, 150 70, 170 70 C 194 70, 198 53, 218 53 C 242 53, 246 44, 266 44 L 266 120 L 26 120 Z"
          fill="url(#splineAreaGrad)"
        />

        {/* Spline curve stroke */}
        <Path
          d="M 26 35 C 50 35, 54 44, 74 44 C 98 44, 102 62, 122 62 C 146 62, 150 70, 170 70 C 194 70, 198 53, 218 53 C 242 53, 246 44, 266 44"
          stroke="url(#splineStrokeGrad)"
          strokeWidth="2.8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Data points */}
        {points.map((p, idx) => {
          const isSelected = idx === activeIndex;
          return (
            <React.Fragment key={idx}>
              <Circle
                cx={p.x}
                cy={p.y}
                r={isSelected ? 6 : 4}
                fill="#FFFFFF"
                stroke={isSelected ? '#5F7445' : '#C6922C'}
                strokeWidth={isSelected ? 3 : 2}
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

/** Aerial Farm Field Map Graphic matching Screen 7 */
function AerialFarmFieldMapGraphic() {
  return (
    <View style={styles.aerialMapWrapper}>
      <Image
        source={require('../../../assets/home-bg.jpg')}
        style={styles.aerialMapBasePhoto}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(25, 45, 15, 0.2)', 'rgba(25, 45, 15, 0.5)']}
        style={StyleSheet.absoluteFill}
      />

      {/* SVG Parcel Boundaries & Doppler Heatmap Overlay */}
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 340 380">
        <Defs>
          <SvgGradient id="radarHeatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(76, 175, 80, 0.45)" />
            <Stop offset="50%" stopColor="rgba(255, 193, 7, 0.35)" />
            <Stop offset="100%" stopColor="rgba(76, 175, 80, 0.3)" />
          </SvgGradient>
        </Defs>

        {/* Doppler Radar overlay swath */}
        <Path
          d="M 20 80 Q 140 40 280 90 Q 320 200 240 290 Q 100 320 30 220 Z"
          fill="url(#radarHeatGrad)"
        />

        {/* Farm Parcel Boundary Polygon */}
        <Path
          d="M 120 180 L 220 160 L 240 230 L 140 250 Z"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          fill="rgba(255, 255, 255, 0.22)"
          strokeDasharray="4 3"
        />

        {/* Central Farm Pin Circle */}
        <Circle cx="175" cy="205" r="16" fill="rgba(245, 176, 37, 0.4)" />
        <Circle cx="175" cy="205" r="8" fill="#F5B025" stroke="#FFFFFF" strokeWidth="2" />
      </Svg>

      {/* Pinned Floating Weather Pill over the farm field */}
      <View style={styles.pinnedWeatherPill}>
        <Ionicons name="partly-sunny" size={20} color="#F5B025" />
        <View>
          <Text style={styles.pinnedTempText}>28°C</Text>
          <Text style={styles.pinnedCondText}>Partly Cloudy</Text>
        </View>
      </View>
    </View>
  );
}

// =========================================================================
// MAIN COMPONENT
// =========================================================================

export default function WeatherIntelligenceScreen() {
  const { farmDetails, weather } = useFarm();

  // Current screen in the 9-screen flow:
  // 'landing' -> 'dashboard' -> 'forecast' -> 'crop-impact' -> 'insights'
  // 'alerts' -> 'map' -> 'monthly' -> 'all-set'
  const [currentScreen, setCurrentScreen] = useState<WeatherScreenView>('landing');

  // Forecast active day tab index (0: Thu 27, 1: Fri 28, etc.)
  const [forecastActiveDay, setForecastActiveDay] = useState(0);

  // Location selector modal state
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(
    farmDetails?.location || weather?.location_name || 'Tumakuru'
  );

  // Screen 6: Alerts toggles
  const [rainAlerts, setRainAlerts] = useState(true);
  const [tempAlerts, setTempAlerts] = useState(true);
  const [cropStageReminders, setCropStageReminders] = useState(true);

  // Screen 8: Calendar selected day
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(27);

  // Dynamic user crop data
  const userCrop = farmDetails?.cropGrown || 'Ragi';
  const cropStage = (farmDetails as any)?.growthStage || 'Seedling';
  const currentTemp = weather?.temp ?? 28;
  const currentHumidity = weather?.humidity ?? 62;
  const currentWind = weather?.wind_speed_kmh ?? 12;

  const LOCATION_OPTIONS = [
    'Tumakuru',
    'Koratagere',
    'Gubbi',
    'Sira',
    'Madhugiri',
    'Tiptur',
    'Kunigal',
    'Pavagada',
  ];

  const SEVEN_DAYS = [
    { day: 'Thu', date: 27, icon: 'sunny', high: 32, low: 21, color: '#F39C12' },
    { day: 'Fri', date: 28, icon: 'partly-sunny', high: 31, low: 20, color: '#F39C12' },
    { day: 'Sat', date: 29, icon: 'partly-sunny', high: 29, low: 19, color: '#F39C12' },
    { day: 'Sun', date: 30, icon: 'partly-sunny', high: 28, low: 19, color: '#F39C12' },
    { day: 'Mon', date: 1, icon: 'rainy', high: 30, low: 20, color: '#3498DB' },
    { day: 'Tue', date: 2, icon: 'partly-sunny', high: 31, low: 21, color: '#F39C12' },
  ];

  // =========================================================================
  // SCREEN 1: LANDING SCREEN
  // =========================================================================
  if (currentScreen === 'landing') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Top Brand Mark */}
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Ionicons name="leaf" size={18} color={Colors.oliveGreen} />
              <Text style={styles.brandTitle}>Root Sense</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.landingScroll} showsVerticalScrollIndicator={false}>
            {/* Title & Subtitle */}
            <View style={styles.landingHeader}>
              <Text style={styles.landingHeadline}>Weather{'\n'}Intelligence</Text>
              <Text style={styles.landingSub}>
                Get smart insights on{'\n'}weather and its impact{'\n'}on your crops.
              </Text>
            </View>

            {/* Hero Card: Golden Sunrise Rows of Crops */}
            <View style={styles.landingHeroCard}>
              <Image
                source={require('../../../assets/home-bg.jpg')}
                style={styles.landingHeroPhoto}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(250, 247, 242, 0.3)', 'rgba(250, 247, 242, 0.9)']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
            </View>

            {/* Bottom Button: "Explore Weather →" */}
            <TouchableOpacity
              style={styles.primaryPillButton}
              onPress={() => setCurrentScreen('dashboard')}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryPillButtonText}>Explore Weather</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.pureWhite} />
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 3: 7-DAY FORECAST
  // =========================================================================
  if (currentScreen === 'forecast') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>7-Day Forecast</Text>
            <View style={{ width: 42 }} />
          </View>

          <ScrollView contentContainerStyle={styles.forecastScroll} showsVerticalScrollIndicator={false}>
            {/* Horizontal Day Tabs matching Screen 3 */}
            <View style={styles.forecastDaysRow}>
              {SEVEN_DAYS.map((item, idx) => {
                const isActive = idx === forecastActiveDay;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.forecastDayCol}
                    onPress={() => setForecastActiveDay(idx)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.dayHeaderPill, isActive && styles.dayHeaderPillActive]}>
                      <Text style={[styles.dayHeaderText, isActive && styles.dayHeaderTextActive]}>
                        {item.day}
                      </Text>
                      <Text style={[styles.dateNumberText, isActive && styles.dateNumberTextActive]}>
                        {item.date}
                      </Text>
                    </View>

                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.color}
                      style={{ marginVertical: 8 }}
                    />

                    <Text style={styles.dayHighTemp}>{item.high}°</Text>
                    <Text style={styles.dayLowTemp}>{item.low}°</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Connected Spline Temperature Chart Card */}
            <View style={styles.chartCardWrapper}>
              <SevenDaySplineChart activeIndex={forecastActiveDay} />
            </View>

            {/* Weather Trends Section Header */}
            <View style={styles.trendsHeaderRow}>
              <View style={styles.trendsLeftHeading}>
                <Ionicons name="bar-chart" size={17} color={Colors.oliveGreen} />
                <Text style={styles.trendsTitleText}>Weather Trends</Text>
              </View>
              <View style={styles.trendsDropdownPill}>
                <Text style={styles.trendsDropdownText}>Next 7 days</Text>
                <Ionicons name="chevron-down" size={14} color={Colors.deepOlive} />
              </View>
            </View>

            {/* 3 Trend Cards in Row: Mostly Sunny | Light Rain | Rising Temp */}
            <View style={styles.trendCardsRow}>
              <View style={styles.trendCard}>
                <Ionicons name="sunny" size={24} color="#F39C12" />
                <Text style={styles.trendCardLabel}>Mostly{'\n'}Sunny</Text>
              </View>

              <View style={styles.trendCard}>
                <Ionicons name="water" size={24} color="#3498DB" />
                <Text style={styles.trendCardLabel}>Light{'\n'}Rain</Text>
              </View>

              <View style={styles.trendCard}>
                <Ionicons name="thermometer" size={24} color="#E74C3C" />
                <Text style={styles.trendCardLabel}>Rising{'\n'}Temp</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 4: CROP IMPACT
  // =========================================================================
  if (currentScreen === 'crop-impact') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>Crop Impact</Text>
            <View style={{ width: 42 }} />
          </View>

          <ScrollView contentContainerStyle={styles.cropImpactScroll} showsVerticalScrollIndicator={false}>
            {/* Crop Hero Card */}
            <View style={styles.cropProfileCard}>
              <View style={styles.cropProfileThumbBox}>
                <Image
                  source={require('../../../assets/seed-calendar-bg.jpg')}
                  style={styles.cropProfileThumbPhoto}
                />
              </View>
              <View style={styles.cropProfileText}>
                <Text style={styles.cropProfileName}>{userCrop}</Text>
                <Text style={styles.cropProfileStage}>Growth Stage: {cropStage}</Text>
              </View>
            </View>

            {/* Impact Overview Section */}
            <View style={styles.impactOverviewBox}>
              <Text style={styles.impactOverviewTitle}>Impact Overview</Text>

              {/* Favorable Conditions Status Banner */}
              <View style={styles.favorableCard}>
                <View style={styles.favorableIconWrap}>
                  <Ionicons name="checkmark-circle" size={22} color={Colors.oliveGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.favorableHeading}>Favorable Conditions</Text>
                  <Text style={styles.favorableSub}>Weather is suitable for your crop.</Text>
                </View>
              </View>

              {/* Parameter Rows with Green Checkmarks on the right */}
              <View style={styles.impactParamsCard}>
                {/* 1. Temperature */}
                <View style={styles.paramRow}>
                  <View style={styles.paramLeft}>
                    <Ionicons name="thermometer-outline" size={22} color="#D98A2C" />
                    <View>
                      <Text style={styles.paramLabel}>Temperature</Text>
                      <Text style={styles.paramValue}>22° – 30°C</Text>
                    </View>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.oliveGreen} />
                </View>

                <View style={styles.paramDivider} />

                {/* 2. Humidity */}
                <View style={styles.paramRow}>
                  <View style={styles.paramLeft}>
                    <Ionicons name="water-outline" size={22} color="#3498DB" />
                    <View>
                      <Text style={styles.paramLabel}>Humidity</Text>
                      <Text style={styles.paramValue}>60% – 70%</Text>
                    </View>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.oliveGreen} />
                </View>

                <View style={styles.paramDivider} />

                {/* 3. Rainfall */}
                <View style={styles.paramRow}>
                  <View style={styles.paramLeft}>
                    <Ionicons name="rainy-outline" size={22} color="#5DADE2" />
                    <View>
                      <Text style={styles.paramLabel}>Rainfall</Text>
                      <Text style={styles.paramValue}>Low chance (5%)</Text>
                    </View>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.oliveGreen} />
                </View>
              </View>
            </View>

            {/* Farmer Tip Card with Sprout Graphic */}
            <View style={styles.farmerTipCard}>
              <View style={styles.farmerTipTextCol}>
                <View style={styles.farmerTipHeadingRow}>
                  <Ionicons name="bulb-outline" size={18} color="#D98A2C" />
                  <Text style={styles.farmerTipTitle}>Farmer Tip</Text>
                </View>
                <Text style={styles.farmerTipBody}>
                  Maintain soil moisture for healthy seedling growth.
                </Text>
              </View>
              <Image
                source={require('../../../assets/seed-calendar-bg.jpg')}
                style={styles.farmerTipSproutImage}
                resizeMode="cover"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 5: AI INSIGHTS
  // =========================================================================
  if (currentScreen === 'insights') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>AI Insights</Text>
            <View style={{ width: 42 }} />
          </View>

          <ScrollView contentContainerStyle={styles.insightsScroll} showsVerticalScrollIndicator={false}>
            {/* Top AI Insights Banner */}
            <View style={styles.aiInsightsTopBanner}>
              <View style={styles.aiBannerSparkleRow}>
                <Ionicons name="sparkles" size={17} color="#2A3122" />
                <Text style={styles.aiBannerHeadline}>AI Insights</Text>
              </View>
              <Text style={styles.aiBannerSub}>
                Based on current and upcoming weather conditions for {userCrop}...
              </Text>
            </View>

            {/* 3 Insight Cards */}
            {/* 1. Growth Boost */}
            <View style={styles.insightCardRow}>
              <View style={[styles.insightCardIconBox, { backgroundColor: '#EAF2E8' }]}>
                <Ionicons name="leaf" size={20} color={Colors.oliveGreen} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.insightCardTitle}>Growth Boost</Text>
                <Text style={styles.insightCardBody}>
                  The next 2 days are ideal for plant development.
                </Text>
              </View>
            </View>

            {/* 2. Watch Out */}
            <View style={styles.insightCardRow}>
              <View style={[styles.insightCardIconBox, { backgroundColor: '#FDEBD0' }]}>
                <Ionicons name="warning" size={20} color="#E67E22" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.insightCardTitle}>Watch Out</Text>
                <Text style={styles.insightCardBody}>
                  Rain expected on Sat. Consider adjusting irrigation.
                </Text>
              </View>
            </View>

            {/* 3. Disease Risk */}
            <View style={styles.insightCardRow}>
              <View style={[styles.insightCardIconBox, { backgroundColor: '#EAF2E8' }]}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.oliveGreen} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.insightCardTitle}>Disease Risk</Text>
                <Text style={styles.insightCardBody}>
                  Humidity may increase fungal diseases. Keep an eye on leaves.
                </Text>
              </View>
            </View>

            {/* Quick Actions Section */}
            <View style={styles.quickActionsBox}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>

              <TouchableOpacity
                style={styles.quickActionPillRow}
                onPress={() => setCurrentScreen('crop-impact')}
                activeOpacity={0.8}
              >
                <Ionicons name="water" size={18} color="#3498DB" />
                <Text style={styles.quickActionText}>Check Soil Moisture</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionPillRow}
                onPress={() => setCurrentScreen('crop-impact')}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark" size={18} color={Colors.oliveGreen} />
                <Text style={styles.quickActionText}>Inspect for Pests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionPillRow}
                onPress={() => setCurrentScreen('forecast')}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar" size={18} color="#D98A2C" />
                <Text style={styles.quickActionText}>Plan Irrigation</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 6: ALERTS & NOTIFICATIONS
  // =========================================================================
  if (currentScreen === 'alerts') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>Alerts &amp; Notifications</Text>
            <View style={{ width: 42 }} />
          </View>

          <ScrollView contentContainerStyle={styles.alertsScroll} showsVerticalScrollIndicator={false}>
            {/* Center Bell Icon in soft green circle */}
            <View style={styles.alertBellCircle}>
              <Ionicons name="notifications" size={32} color={Colors.oliveGreen} />
            </View>

            <Text style={styles.stayAheadTitle}>Stay Ahead</Text>
            <Text style={styles.stayAheadSub}>
              Get notified about important{'\n'}weather updates and crop alerts.
            </Text>

            {/* 3 Toggle Cards matching Screen 6 */}
            <View style={styles.alertTogglesBox}>
              {/* 1. Rain Alerts */}
              <View style={styles.alertToggleRow}>
                <View style={styles.alertToggleLeft}>
                  <Ionicons name="rainy-outline" size={22} color="#3498DB" />
                  <Text style={styles.alertToggleText}>Rain Alerts</Text>
                </View>
                <Switch
                  value={rainAlerts}
                  onValueChange={setRainAlerts}
                  trackColor={{ false: '#D5D0C5', true: '#7E9F56' }}
                  thumbColor={Colors.pureWhite}
                />
              </View>

              <View style={styles.paramDivider} />

              {/* 2. Temperature Alerts */}
              <View style={styles.alertToggleRow}>
                <View style={styles.alertToggleLeft}>
                  <Ionicons name="thermometer-outline" size={22} color="#D98A2C" />
                  <Text style={styles.alertToggleText}>Temperature Alerts</Text>
                </View>
                <Switch
                  value={tempAlerts}
                  onValueChange={setTempAlerts}
                  trackColor={{ false: '#D5D0C5', true: '#7E9F56' }}
                  thumbColor={Colors.pureWhite}
                />
              </View>

              <View style={styles.paramDivider} />

              {/* 3. Crop Stage Reminders */}
              <View style={styles.alertToggleRow}>
                <View style={styles.alertToggleLeft}>
                  <Ionicons name="leaf-outline" size={22} color={Colors.oliveGreen} />
                  <Text style={styles.alertToggleText}>Crop Stage Reminders</Text>
                </View>
                <Switch
                  value={cropStageReminders}
                  onValueChange={setCropStageReminders}
                  trackColor={{ false: '#D5D0C5', true: '#7E9F56' }}
                  thumbColor={Colors.pureWhite}
                />
              </View>
            </View>

            {/* Bottom Button: Save Preferences -> transitions to "All Set!" */}
            <TouchableOpacity
              style={[styles.primaryPillButton, { marginTop: Spacing.xl }]}
              onPress={() => setCurrentScreen('all-set')}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryPillButtonText}>Save Preferences</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 7: WEATHER MAP
  // =========================================================================
  if (currentScreen === 'map') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>Weather Map</Text>
            <View style={{ width: 42 }} />
          </View>

          <View style={styles.mapScreenContent}>
            {/* Aerial Drone Farm Parcel View with pinned weather tag */}
            <AerialFarmFieldMapGraphic />

            {/* Botanical corner accent leaves */}
            <BotanicalCornerLeaves size={95} />

            {/* Bottom Doppler Radar Intensity Legend */}
            <View style={styles.mapLegendPill}>
              <View style={styles.legendDotItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Light</Text>
              </View>
              <View style={styles.legendDotItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.legendText}>Moderate</Text>
              </View>
              <View style={styles.legendDotItem}>
                <View style={[styles.legendDot, { backgroundColor: '#E53935' }]} />
                <Text style={styles.legendText}>Heavy</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 8: MONTHLY OVERVIEW
  // =========================================================================
  if (currentScreen === 'monthly') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>Monthly Overview</Text>
            <View style={{ width: 42 }} />
          </View>

          <ScrollView contentContainerStyle={styles.monthlyScroll} showsVerticalScrollIndicator={false}>
            {/* Month Navigator Header: < November > */}
            <View style={styles.monthHeaderRow}>
              <TouchableOpacity style={styles.monthNavArrow}>
                <Ionicons name="chevron-back" size={20} color={Colors.deepOlive} />
              </TouchableOpacity>
              <Text style={styles.monthTitleText}>November</Text>
              <TouchableOpacity style={styles.monthNavArrow}>
                <Ionicons name="chevron-forward" size={20} color={Colors.deepOlive} />
              </TouchableOpacity>
            </View>

            {/* Days of Week Header */}
            <View style={styles.calendarWeekdaysRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <Text key={d} style={styles.calendarWeekdayLabel}>{d}</Text>
              ))}
            </View>

            {/* Calendar Grid matching Screen 8 */}
            <View style={styles.calendarGrid}>
              {/* Row 1: 26, 27, 28, 29, 30, 31, 1 */}
              {[
                { d: 26, isPrev: true },
                { d: 27, isPrev: false, isToday: true }, // Highlighted in solid green
                { d: 28, isPrev: false },
                { d: 29, isPrev: false },
                { d: 30, isPrev: false },
                { d: 31, isPrev: true },
                { d: 1, isPrev: false, isRain: true },
              ].map((cell, idx) => (
                <TouchableOpacity
                  key={`r1-${idx}`}
                  style={[
                    styles.calendarDayCell,
                    cell.isToday && styles.calendarDayCellToday,
                  ]}
                  onPress={() => setSelectedCalendarDay(cell.d)}
                >
                  <Text
                    style={[
                      styles.calendarDayNum,
                      cell.isPrev && styles.calendarDayNumMuted,
                      cell.isToday && styles.calendarDayNumToday,
                    ]}
                  >
                    {cell.d}
                  </Text>
                  {cell.isRain && <View style={styles.rainDot} />}
                </TouchableOpacity>
              ))}

              {/* Row 2: 2, 3, 4, 5, 6, 7, 8 */}
              {[2, 3, 4, 5, 6, 7, 8].map((d) => (
                <TouchableOpacity
                  key={`r2-${d}`}
                  style={styles.calendarDayCell}
                  onPress={() => setSelectedCalendarDay(d)}
                >
                  <Text style={styles.calendarDayNum}>{d}</Text>
                </TouchableOpacity>
              ))}

              {/* Row 3: 9, 10, 11, 12, 13, 14, 15 */}
              {[9, 10, 11, 12, 13, 14, 15].map((d) => (
                <TouchableOpacity
                  key={`r3-${d}`}
                  style={styles.calendarDayCell}
                  onPress={() => setSelectedCalendarDay(d)}
                >
                  <Text style={styles.calendarDayNum}>{d}</Text>
                </TouchableOpacity>
              ))}

              {/* Row 4: 16, 17, 18, 19, 20, 21, 22 */}
              {[
                { d: 16 },
                { d: 17 },
                { d: 18 },
                { d: 19 },
                { d: 20 },
                { d: 21 },
                { d: 22, isAlert: true }, // Highlighted in solid orange alert
              ].map((cell, idx) => (
                <TouchableOpacity
                  key={`r4-${idx}`}
                  style={[
                    styles.calendarDayCell,
                    cell.isAlert && styles.calendarDayCellAlert,
                  ]}
                  onPress={() => setSelectedCalendarDay(cell.d)}
                >
                  <Text
                    style={[
                      styles.calendarDayNum,
                      cell.isAlert && styles.calendarDayNumAlert,
                    ]}
                  >
                    {cell.d}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Row 5: 23, 24, 25, 26, 27, 28, 29 */}
              {[23, 24, 25, 26, 27, 28, 29].map((d) => (
                <TouchableOpacity
                  key={`r5-${d}`}
                  style={styles.calendarDayCell}
                  onPress={() => setSelectedCalendarDay(d)}
                >
                  <Text style={styles.calendarDayNum}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Selected Day Status */}
            <View style={styles.selectedDayBanner}>
              <Ionicons
                name={selectedCalendarDay === 22 ? 'alert-circle' : selectedCalendarDay === 1 ? 'rainy' : 'sunny'}
                size={18}
                color={selectedCalendarDay === 22 ? '#E67E22' : selectedCalendarDay === 1 ? '#3498DB' : Colors.oliveGreen}
              />
              <Text style={styles.selectedDayText}>
                Nov {selectedCalendarDay}: {selectedCalendarDay === 22 ? 'High heat alert (35°C)' : selectedCalendarDay === 1 ? 'Light showers expected (5mm)' : 'Clear & pleasant weather (28°C)'}
              </Text>
            </View>

            {/* Calendar Legend matching Screen 8 */}
            <View style={styles.calendarLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#5F7445' }]} />
                <Text style={styles.legendLabel}>Good Weather</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3498DB' }]} />
                <Text style={styles.legendLabel}>Rain Expected</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#E67E22' }]} />
                <Text style={styles.legendLabel}>Alert</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 9: ALL SET!
  // =========================================================================
  if (currentScreen === 'all-set') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Top Botanical Leaves */}
          <BotanicalCornerLeaves size={120} />

          <View style={styles.allSetContainer}>
            {/* Center Green Checkmark Circle */}
            <View style={styles.allSetBigCircle}>
              <Ionicons name="checkmark" size={48} color={Colors.pureWhite} />
            </View>

            <Text style={styles.allSetHeadline}>All Set!</Text>
            <Text style={styles.allSetSub}>
              You're now informed about{'\n'}the weather and its impact.
            </Text>

            {/* Bottom Button: Back to Dashboard */}
            <TouchableOpacity
              style={styles.allSetButton}
              onPress={() => setCurrentScreen('dashboard')}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryPillButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 2: MAIN DASHBOARD
  // =========================================================================
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header Row with Location Dropdown on Right */}
        <View style={styles.dashboardTopBar}>
          <TouchableOpacity onPress={() => setCurrentScreen('landing')} style={styles.circleBackBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
          </TouchableOpacity>

          {/* Location Dropdown Pill matching Screen 2 */}
          <TouchableOpacity
            style={styles.locationDropdownBtn}
            onPress={() => setLocationModalOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="location-sharp" size={16} color={Colors.oliveGreen} />
            <Text style={styles.locationDropdownText}>{selectedLocation}</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.deepOlive} />
          </TouchableOpacity>
        </View>

        {/* Quick Flow Navigator Pill Strip (Let's user freely navigate between all 9 screens) */}
        <View style={styles.flowNavStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flowNavContent}>
            {[
              { id: 'forecast', label: '7-Day Forecast', icon: 'calendar-outline' },
              { id: 'crop-impact', label: 'Crop Impact', icon: 'leaf-outline' },
              { id: 'insights', label: 'AI Insights', icon: 'sparkles-outline' },
              { id: 'alerts', label: 'Alerts', icon: 'notifications-outline' },
              { id: 'map', label: 'Weather Map', icon: 'map-outline' },
              { id: 'monthly', label: 'Monthly', icon: 'grid-outline' },
              { id: 'all-set', label: 'All Set', icon: 'checkmark-circle-outline' },
            ].map((nav) => (
              <TouchableOpacity
                key={nav.id}
                style={styles.flowNavPill}
                onPress={() => setCurrentScreen(nav.id as WeatherScreenView)}
                activeOpacity={0.8}
              >
                <Ionicons name={nav.icon as any} size={14} color={Colors.oliveGreen} />
                <Text style={styles.flowNavPillText}>{nav.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.dashboardScroll} showsVerticalScrollIndicator={false}>
          {/* Main Weather Hero: 28°C + 3D Sun Cloud + Condition + H/L line */}
          <View style={styles.heroWeatherSection}>
            <View style={styles.heroTempCol}>
              <Text style={styles.heroLargeTemp}>{currentTemp}°C</Text>
              <Text style={styles.heroConditionLabel}>Partly Cloudy</Text>
              <Text style={styles.heroHighLowText}>
                H: 32°  L: 21°  •  Feels like 30°
              </Text>
            </View>
            <View style={styles.heroGraphicCol}>
              <SunCloud3DGraphic size={118} />
            </View>
          </View>

          {/* 3 Metric Pills: 62% Humidity | 12 km/h Wind | 0% Rain */}
          <View style={styles.dashboardMetricsRow}>
            <View style={styles.metricSquareCard}>
              <Ionicons name="water-outline" size={22} color="#3498DB" />
              <Text style={styles.metricValBig}>{currentHumidity}%</Text>
              <Text style={styles.metricValSub}>Humidity</Text>
            </View>

            <View style={styles.metricSquareCard}>
              <Ionicons name="leaf-outline" size={22} color={Colors.oliveGreen} />
              <Text style={styles.metricValBig}>{currentWind} km/h</Text>
              <Text style={styles.metricValSub}>Wind</Text>
            </View>

            <View style={styles.metricSquareCard}>
              <Ionicons name="umbrella-outline" size={22} color="#5DADE2" />
              <Text style={styles.metricValBig}>0%</Text>
              <Text style={styles.metricValSub}>Rain</Text>
            </View>
          </View>

          {/* Landscape Photo Banner matching Screen 2 */}
          <View style={styles.landscapeBannerBox}>
            <Image
              source={require('../../../assets/home-bg.jpg')}
              style={styles.landscapeBannerPhoto}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(250, 247, 242, 0.45)', 'rgba(250, 247, 242, 0.85)']}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {/* ✨ AI Summary Card matching Screen 2 */}
          <TouchableOpacity
            style={styles.aiSummaryCard}
            onPress={() => setCurrentScreen('insights')}
            activeOpacity={0.88}
          >
            <View style={styles.aiSummaryLeft}>
              <Ionicons name="sparkles" size={18} color="#D98A2C" />
              <View style={{ flex: 1 }}>
                <Text style={styles.aiSummaryTitle}>AI Summary</Text>
                <Text style={styles.aiSummaryBody}>
                  Ideal weather for crop growth. No major risks today.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.deepOlive} />
          </TouchableOpacity>

          {/* Feature shortcuts grid */}
          <View style={styles.shortcutsGrid}>
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setCurrentScreen('forecast')}
              activeOpacity={0.88}
            >
              <View style={styles.shortcutIconCircle}>
                <Ionicons name="calendar" size={20} color={Colors.oliveGreen} />
              </View>
              <Text style={styles.shortcutTitle}>7-Day Forecast</Text>
              <Text style={styles.shortcutSub}>Thu 27 – Tue 2</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setCurrentScreen('crop-impact')}
              activeOpacity={0.88}
            >
              <View style={styles.shortcutIconCircle}>
                <Ionicons name="leaf" size={20} color={Colors.oliveGreen} />
              </View>
              <Text style={styles.shortcutTitle}>Crop Impact</Text>
              <Text style={styles.shortcutSub}>{userCrop} ({cropStage})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setCurrentScreen('insights')}
              activeOpacity={0.88}
            >
              <View style={[styles.shortcutIconCircle, { backgroundColor: '#FEF9E7' }]}>
                <Ionicons name="bulb" size={20} color="#F39C12" />
              </View>
              <Text style={styles.shortcutTitle}>AI Insights</Text>
              <Text style={styles.shortcutSub}>Growth boost &amp; risks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setCurrentScreen('alerts')}
              activeOpacity={0.88}
            >
              <View style={[styles.shortcutIconCircle, { backgroundColor: '#FDEBD0' }]}>
                <Ionicons name="notifications" size={20} color="#E67E22" />
              </View>
              <Text style={styles.shortcutTitle}>Alerts &amp; Updates</Text>
              <Text style={styles.shortcutSub}>Stay ahead notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setCurrentScreen('map')}
              activeOpacity={0.88}
            >
              <View style={styles.shortcutIconCircle}>
                <Ionicons name="map" size={20} color={Colors.oliveGreen} />
              </View>
              <Text style={styles.shortcutTitle}>Weather Map</Text>
              <Text style={styles.shortcutSub}>Drone farm radar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setCurrentScreen('monthly')}
              activeOpacity={0.88}
            >
              <View style={styles.shortcutIconCircle}>
                <Ionicons name="calendar-outline" size={20} color={Colors.oliveGreen} />
              </View>
              <Text style={styles.shortcutTitle}>Monthly Overview</Text>
              <Text style={styles.shortcutSub}>November calendar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Location Selector Modal */}
        <Modal visible={locationModalOpen} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setLocationModalOpen(false)}
          >
            <View style={styles.modalContentBox}>
              <Text style={styles.modalHeadingText}>Select Farm Location</Text>
              {LOCATION_OPTIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.modalLocRow, selectedLocation === loc && styles.modalLocRowActive]}
                  onPress={() => {
                    setSelectedLocation(loc);
                    setLocationModalOpen(false);
                  }}
                >
                  <Text style={[styles.modalLocText, selectedLocation === loc && styles.modalLocTextActive]}>
                    {loc}
                  </Text>
                  {selectedLocation === loc && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.oliveGreen} />
                  )}
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.65)',
    ...Shadows.soft,
  },
  screenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  screenHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#262D1D',
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
  brandRow: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
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
    gap: Spacing.lg,
  },
  landingHeader: {
    gap: 8,
  },
  landingHeadline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#252C1D',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  landingSub: {
    fontSize: 15,
    color: '#555C4C',
    lineHeight: 22,
    fontWeight: '500',
  },
  landingHeroCard: {
    height: 230,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  landingHeroPhoto: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },

  // SCREEN 2: DASHBOARD
  dashboardTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  locationDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.soft,
  },
  locationDropdownText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#262D1D',
  },
  flowNavStrip: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(215, 200, 175, 0.35)',
  },
  flowNavContent: {
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  flowNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.65)',
  },
  flowNavPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
  dashboardScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  heroWeatherSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  heroTempCol: {
    gap: 2,
    flex: 1,
  },
  heroLargeTemp: {
    fontSize: 48,
    fontWeight: '800',
    color: '#252C1D',
    letterSpacing: -1.5,
  },
  heroConditionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555C4C',
  },
  heroHighLowText: {
    fontSize: 11.5,
    color: '#6F7865',
    fontWeight: '600',
    marginTop: 4,
  },
  heroGraphicCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricSquareCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
    gap: 4,
  },
  metricValBig: {
    fontSize: 15,
    fontWeight: '800',
    color: '#262D1D',
  },
  metricValSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#6F7865',
  },
  landscapeBannerBox: {
    height: 105,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  landscapeBannerPhoto: {
    width: '100%',
    height: '100%',
  },
  aiSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  aiSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  aiSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#262D1D',
  },
  aiSummaryBody: {
    fontSize: 12.5,
    color: '#555C4C',
    marginTop: 2,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  shortcutCard: {
    width: '48.3%',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
    gap: 4,
  },
  shortcutIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF2E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  shortcutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#262D1D',
  },
  shortcutSub: {
    fontSize: 11,
    color: '#6F7865',
  },

  // SCREEN 3: 7-DAY FORECAST
  forecastScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  forecastDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  forecastDayCol: {
    alignItems: 'center',
    width: 44,
  },
  dayHeaderPill: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  dayHeaderPillActive: {
    backgroundColor: '#5F7445',
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6F7865',
  },
  dayHeaderTextActive: {
    color: Colors.pureWhite,
  },
  dateNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#262D1D',
  },
  dateNumberTextActive: {
    color: Colors.pureWhite,
  },
  dayHighTemp: {
    fontSize: 13,
    fontWeight: '800',
    color: '#262D1D',
  },
  dayLowTemp: {
    fontSize: 11.5,
    color: '#6F7865',
  },
  chartCardWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  splineChartWrapper: {
    alignItems: 'center',
  },
  trendsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  trendsLeftHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendsTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#262D1D',
  },
  trendsDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.7)',
  },
  trendsDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.deepOlive,
  },
  trendCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  trendCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
    gap: 6,
  },
  trendCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#262D1D',
    textAlign: 'center',
  },

  // SCREEN 4: CROP IMPACT
  cropImpactScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  cropProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  cropProfileThumbBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.oliveGreen,
  },
  cropProfileThumbPhoto: {
    width: '100%',
    height: '100%',
  },
  cropProfileText: {
    gap: 2,
  },
  cropProfileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#262D1D',
  },
  cropProfileStage: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#555C4C',
  },
  impactOverviewBox: {
    gap: 10,
  },
  impactOverviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#262D1D',
  },
  favorableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EAF2E8',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#C7DEC1',
  },
  favorableIconWrap: {
    width: 32,
  },
  favorableHeading: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#344722',
  },
  favorableSub: {
    fontSize: 12.5,
    color: '#4B5F37',
    marginTop: 2,
  },
  impactParamsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    gap: 10,
    ...Shadows.card,
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  paramLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paramLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#262D1D',
  },
  paramValue: {
    fontSize: 12,
    color: '#6F7865',
    marginTop: 1,
  },
  paramDivider: {
    height: 1,
    backgroundColor: 'rgba(215, 200, 175, 0.4)',
  },
  farmerTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  farmerTipTextCol: {
    flex: 1,
    paddingRight: 10,
    gap: 4,
  },
  farmerTipHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  farmerTipTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#D98A2C',
  },
  farmerTipBody: {
    fontSize: 13,
    color: '#262D1D',
    lineHeight: 18,
  },
  farmerTipSproutImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  // SCREEN 5: AI INSIGHTS
  insightsScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  aiInsightsTopBanner: {
    backgroundColor: '#EAF2E8',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#C7DEC1',
    gap: 4,
  },
  aiBannerSparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBannerHeadline: {
    fontSize: 15,
    fontWeight: '800',
    color: '#262D1D',
  },
  aiBannerSub: {
    fontSize: 12.5,
    color: '#4B5F37',
  },
  insightCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  insightCardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#262D1D',
  },
  insightCardBody: {
    fontSize: 12.5,
    color: '#555C4C',
    marginTop: 2,
    lineHeight: 18,
  },
  quickActionsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    gap: 10,
    marginTop: 4,
    ...Shadows.card,
  },
  quickActionsTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#262D1D',
  },
  quickActionPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF7F2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.5)',
  },
  quickActionText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#262D1D',
  },

  // SCREEN 6: ALERTS & NOTIFICATIONS
  alertsScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
    gap: 10,
  },
  alertBellCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EAF2E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  stayAheadTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#262D1D',
  },
  stayAheadSub: {
    fontSize: 13.5,
    color: '#555C4C',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: Spacing.md,
  },
  alertTogglesBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    gap: 10,
    ...Shadows.card,
  },
  alertToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  alertToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertToggleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#262D1D',
  },

  // SCREEN 7: WEATHER MAP
  mapScreenContent: {
    flex: 1,
    position: 'relative',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  aerialMapWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  aerialMapBasePhoto: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  pinnedWeatherPill: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.8)',
    ...Shadows.card,
  },
  pinnedTempText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#262D1D',
  },
  pinnedCondText: {
    fontSize: 11,
    color: '#555C4C',
  },
  mapLegendPill: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.8)',
    ...Shadows.soft,
  },
  legendDotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#262D1D',
  },

  // SCREEN 8: MONTHLY OVERVIEW
  monthlyScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  monthNavArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.6)',
  },
  monthTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#262D1D',
  },
  calendarWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  calendarWeekdayLabel: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6F7865',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
    rowGap: 8,
  },
  selectedDayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.7)',
  },
  selectedDayText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#262D1D',
    flex: 1,
  },
  calendarDayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCellToday: {
    backgroundColor: '#5F7445',
  },
  calendarDayCellAlert: {
    backgroundColor: '#F5B025',
  },
  calendarDayNum: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#262D1D',
  },
  calendarDayNumMuted: {
    color: '#A8AF9F',
  },
  calendarDayNumToday: {
    color: Colors.pureWhite,
  },
  calendarDayNumAlert: {
    color: Colors.pureWhite,
  },
  rainDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3498DB',
  },
  calendarLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.7)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#262D1D',
  },

  // SCREEN 9: ALL SET!
  allSetContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 12,
  },
  allSetBigCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#5F7445',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
    marginBottom: 6,
  },
  allSetHeadline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#262D1D',
  },
  allSetSub: {
    fontSize: 14.5,
    color: '#555C4C',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: Spacing.lg,
  },
  allSetButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#5F7445',
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalContentBox: {
    width: '100%',
    backgroundColor: '#FAF7F2',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.8)',
    gap: 8,
    ...Shadows.card,
  },
  modalHeadingText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#262D1D',
    marginBottom: 6,
  },
  modalLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
  },
  modalLocRowActive: {
    backgroundColor: '#EAF2E8',
  },
  modalLocText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#343B2A',
  },
  modalLocTextActive: {
    fontWeight: '800',
    color: '#262D1D',
  },
});
