import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
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
  Rect,
} from 'react-native-svg';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { BotanicalCornerLeaves } from '../../components/BotanicalCornerLeaves';
import { useFarm } from '../../context/FarmContext';

export type WeatherScreenView =
  | 'landing'
  | 'dashboard'
  | 'forecast'
  | 'crop-impact'
  | 'alerts'
  | 'detailed'
  | 'rain'
  | 'insights'
  | 'summary'
  | 'options'
  | 'alerts-settings'
  | 'history'
  | 'crop-forecast'
  | 'radar-map';

// =========================================================================
// GRAPHICS COMPONENTS (SVG 3D Cloud & Sun, Rain Cloud, Gauge, Charts)
// =========================================================================

/** 3D Sun behind Cloud Graphic */
function SunCloud3DGraphic({ size = 110 }: { size?: number }) {
  const scale = size / 110;
  return (
    <Svg width={size} height={size * 0.85} viewBox="0 0 110 95">
      <Defs>
        <SvgGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFE066" />
          <Stop offset="60%" stopColor="#F5B025" />
          <Stop offset="100%" stopColor="#E67E22" />
        </SvgGradient>
        <SvgGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="40%" stopColor="#EBF3FA" />
          <Stop offset="100%" stopColor="#B8D3EB" />
        </SvgGradient>
        <SvgGradient id="cloudShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="rgba(80, 120, 160, 0.25)" />
          <Stop offset="100%" stopColor="rgba(80, 120, 160, 0.05)" />
        </SvgGradient>
      </Defs>

      {/* Golden Glowing Sun */}
      <Circle cx="68" cy="38" r="24" fill="url(#sunGrad)" />
      {/* Sun rays accents */}
      <Path
        d="M 68 8 L 68 2 M 90 18 L 95 14 M 98 40 L 104 40 M 89 60 L 94 65 M 48 18 L 44 14"
        stroke="#F5B025"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Cloud Bottom Ambient Shadow */}
      <Path
        d="M 22 75 C 10 75, 4 64, 12 52 C 14 36, 32 30, 44 38 C 50 24, 72 24, 80 38 C 92 37, 102 46, 100 60 C 98 72, 86 75, 78 75 Z"
        fill="url(#cloudShadow)"
        transform={`scale(${scale}) translate(0, 4)`}
      />

      {/* Fluffy 3D Cloud Body */}
      <Path
        d="M 22 72 C 10 72, 4 61, 12 49 C 14 33, 32 27, 44 35 C 50 21, 72 21, 80 35 C 92 34, 102 43, 100 57 C 98 69, 86 72, 78 72 Z"
        fill="url(#cloudGrad)"
      />
      {/* Cloud highlight */}
      <Circle cx="44" cy="38" r="14" fill="#FFFFFF" fillOpacity="0.6" />
      <Circle cx="64" cy="34" r="16" fill="#FFFFFF" fillOpacity="0.5" />
    </Svg>
  );
}

/** 3D Rain Cloud Graphic with Drops */
function RainCloud3DGraphic({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.9} viewBox="0 0 120 108">
      <Defs>
        <SvgGradient id="rainCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#E2ECF7" />
          <Stop offset="50%" stopColor="#B3CFEC" />
          <Stop offset="100%" stopColor="#87B0DA" />
        </SvgGradient>
        <SvgGradient id="dropGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#6BA6E8" />
          <Stop offset="100%" stopColor="#3C82D6" />
        </SvgGradient>
      </Defs>

      {/* Fluffy Blue Rain Cloud */}
      <Path
        d="M 25 64 C 14 64, 8 53, 16 42 C 18 28, 35 22, 47 30 C 53 17, 75 17, 83 30 C 95 29, 106 38, 104 51 C 102 62, 92 64, 84 64 Z"
        fill="url(#rainCloudGrad)"
      />
      <Circle cx="48" cy="32" r="14" fill="#FFFFFF" fillOpacity="0.45" />
      <Circle cx="68" cy="28" r="17" fill="#FFFFFF" fillOpacity="0.35" />

      {/* Raindrops Falling */}
      <Path
        d="M 34 76 Q 37 86 33 88 Q 29 88 32 76 Z"
        fill="url(#dropGrad)"
      />
      <Path
        d="M 52 78 Q 55 90 51 92 Q 47 92 50 78 Z"
        fill="url(#dropGrad)"
      />
      <Path
        d="M 70 75 Q 73 86 69 88 Q 65 88 68 75 Z"
        fill="url(#dropGrad)"
      />
      <Path
        d="M 88 77 Q 91 88 87 90 Q 83 90 86 77 Z"
        fill="url(#dropGrad)"
      />
    </Svg>
  );
}

/** Circular Gauge showing 92% Favourable Conditions */
function FavourableCircularGauge({ percent = 92, size = 115 }: { percent?: number; size?: number }) {
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percent) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#7E9F56" />
            <Stop offset="100%" stopColor="#556F35" />
          </SvgGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EAE4D5"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.gaugeCenterText}>
        <Text style={styles.gaugePercentNumber}>{percent}%</Text>
        <Text style={styles.gaugeSubLabel}>Favourable{'\n'}Conditions</Text>
      </View>
    </View>
  );
}

/** Connected Hourly Spline / Line Chart */
function HourlyTemperatureChart() {
  const points = [
    { time: 'Now', temp: 28, x: 28, y: 38, icon: 'sunny', color: '#F39C12' },
    { time: '1 PM', temp: 29, x: 92, y: 22, icon: 'sunny', color: '#F39C12' },
    { time: '4 PM', temp: 29, x: 156, y: 22, icon: 'partly-sunny', color: '#F39C12' },
    { time: '7 PM', temp: 26, x: 220, y: 64, icon: 'cloudy', color: '#7E9F56' },
    { time: '10 PM', temp: 24, x: 284, y: 88, icon: 'cloudy', color: '#7E9F56' },
  ];

  return (
    <View style={styles.hourlyChartBox}>
      {/* Top weather icon row */}
      <View style={styles.hourlyIconsRow}>
        {points.map((p, idx) => (
          <View key={idx} style={styles.hourlyIconCol}>
            <Text style={styles.hourlyTimeText}>{p.time}</Text>
            <Ionicons name={p.icon as any} size={22} color={p.color} style={{ marginVertical: 6 }} />
            <Text style={styles.hourlyTempText}>{p.temp}°</Text>
          </View>
        ))}
      </View>

      {/* Connected Line Graph */}
      <Svg width="100%" height={105} viewBox="0 0 312 105">
        <Defs>
          <SvgGradient id="chartLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#F5B025" />
            <Stop offset="50%" stopColor="#F39C12" />
            <Stop offset="100%" stopColor="#C49A45" />
          </SvgGradient>
          <SvgGradient id="chartAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#F5B025" stopOpacity={0.25} />
            <Stop offset="100%" stopColor="#F5B025" stopOpacity={0.0} />
          </SvgGradient>
        </Defs>

        {/* Soft Area fill */}
        <Path
          d="M 28 38 Q 60 22 92 22 L 156 22 Q 188 42 220 64 Q 252 82 284 88 L 284 105 L 28 105 Z"
          fill="url(#chartAreaGrad)"
        />

        {/* Connecting Smooth Stroke */}
        <Path
          d="M 28 38 Q 60 22 92 22 L 156 22 Q 188 42 220 64 Q 252 82 284 88"
          stroke="url(#chartLineGrad)"
          strokeWidth="3.2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Dots at data points */}
        {points.map((p, idx) => (
          <Circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="4.8"
            fill="#FFFFFF"
            stroke="#D98A2C"
            strokeWidth="2.5"
          />
        ))}
      </Svg>
    </View>
  );
}

/** 4-Segment Rating Bars */
function SegmentedRatingBars({ activeCount = 4 }: { activeCount?: number }) {
  return (
    <View style={styles.ratingBarContainer}>
      {[1, 2, 3, 4].map((idx) => {
        const isActive = idx <= activeCount;
        return (
          <View
            key={idx}
            style={[styles.ratingBarPill, isActive ? styles.ratingBarActive : styles.ratingBarInactive]}
          />
        );
      })}
    </View>
  );
}

// =========================================================================
// MAIN WEATHER INTELLIGENCE COMPONENT
// =========================================================================

export default function WeatherIntelligenceScreen() {
  const { farmDetails, weather } = useFarm();

  // State Machine for the exact 10-screen flow:
  // 'landing' -> 'dashboard' -> 'forecast' -> 'crop-impact' -> 'alerts'
  // 'detailed' -> 'rain' -> 'insights' -> 'summary' -> 'options'
  // Sub-views for 'options': 'alerts-settings' | 'history' | 'crop-forecast' | 'radar-map'
  const [currentScreen, setCurrentScreen] = useState<WeatherScreenView>('landing');

  // Forecast selector: 7 Days vs 14 Days
  const [forecastRange, setForecastRange] = useState<'7' | '14'>('7');

  // Detailed forecast selector: Hourly vs Daily
  const [detailedMode, setDetailedMode] = useState<'hourly' | 'daily'>('hourly');

  // Historical data tab: 7 Days vs 30 Days
  const [historyTab, setHistoryTab] = useState<'7d' | '30d'>('7d');

  // Regional weather station selector
  const [selectedStation, setSelectedStation] = useState('Tumakuru Central');

  // Functional Alert Preferences Settings (Screen 10.1)
  const [heavyRainAlert, setHeavyRainAlert] = useState(true);
  const [highHeatAlert, setHighHeatAlert] = useState(true);
  const [highWindAlert, setHighWindAlert] = useState(false);
  const [fungalRiskAlert, setFungalRiskAlert] = useState(true);
  const [droughtAlert, setDroughtAlert] = useState(true);
  const [alertSaveMessage, setAlertSaveMessage] = useState<string | null>(null);

  // Dynamic user context
  const userCrop = farmDetails?.cropGrown || 'Ragi';
  const cropStage = (farmDetails as any)?.growthStage || 'Seedling';
  const locationName = farmDetails?.location || weather?.location_name || 'Tumakuru';
  const currentTemp = weather?.temp ?? 28;
  const currentHumidity = weather?.humidity ?? 64;
  const currentWind = weather?.wind_speed_kmh ?? 12;
  const currentUV = weather?.uv_index ?? 6;

  // 14-Day mock forecast data matching mockup design
  const FORECAST_DAYS_7 = [
    { day: 'Today', date: 'Nov 24', icon: 'partly-sunny', high: 28, low: 20, rain: '5%' },
    { day: 'Tue', date: 'Nov 25', icon: 'sunny', high: 29, low: 21, rain: '0%' },
    { day: 'Wed', date: 'Nov 26', icon: 'cloudy', high: 27, low: 19, rain: '10%' },
    { day: 'Thu', date: 'Nov 27', icon: 'rainy', high: 26, low: 18, rain: '70%' },
    { day: 'Fri', date: 'Nov 28', icon: 'sunny', high: 27, low: 19, rain: '15%' },
    { day: 'Sat', date: 'Nov 29', icon: 'partly-sunny', high: 28, low: 20, rain: '10%' },
    { day: 'Sun', date: 'Nov 30', icon: 'sunny', high: 29, low: 21, rain: '5%' },
  ];

  const FORECAST_DAYS_EXTENDED = [
    ...FORECAST_DAYS_7,
    { day: 'Mon', date: 'Dec 01', icon: 'sunny', high: 29, low: 20, rain: '0%' },
    { day: 'Tue', date: 'Dec 02', icon: 'partly-sunny', high: 28, low: 19, rain: '5%' },
    { day: 'Wed', date: 'Dec 03', icon: 'cloudy', high: 27, low: 18, rain: '20%' },
    { day: 'Thu', date: 'Dec 04', icon: 'rainy', high: 25, low: 18, rain: '65%' },
    { day: 'Fri', date: 'Dec 05', icon: 'sunny', high: 27, low: 19, rain: '10%' },
    { day: 'Sat', date: 'Dec 06', icon: 'sunny', high: 28, low: 20, rain: '0%' },
    { day: 'Sun', date: 'Dec 07', icon: 'partly-sunny', high: 29, low: 21, rain: '5%' },
  ];

  const handleSaveAlerts = () => {
    setAlertSaveMessage('Alert preferences saved successfully! Notifications are active.');
    setTimeout(() => setAlertSaveMessage(null), 3000);
  };

  // =========================================================================
  // SCREEN 1: LANDING SCREEN ("WEATHER INTELLIGENCE")
  // =========================================================================
  if (currentScreen === 'landing') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Top Brand Header */}
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
                Get smart weather insights{'\n'}for your farm.
              </Text>
            </View>

            {/* Hero Visual Card: 3D Sun Cloud over Crop Landscape */}
            <View style={styles.landingHeroCard}>
              <Image
                source={require('../../../assets/home-bg.jpg')}
                style={styles.landingHeroPhoto}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(255, 245, 225, 0.45)', 'rgba(245, 235, 215, 0.85)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.landingGraphicOverlay}>
                <SunCloud3DGraphic size={120} />
              </View>
            </View>

            {/* Feature Checklist Card */}
            <View style={styles.featurePillCard}>
              <View style={styles.featureItemRow}>
                <Ionicons name="leaf" size={19} color={Colors.oliveGreen} style={styles.featureIcon} />
                <Text style={styles.featureText}>Real-time weather</Text>
              </View>
              <View style={styles.featureItemRow}>
                <Ionicons name="nutrition-outline" size={19} color={Colors.oliveGreen} style={styles.featureIcon} />
                <Text style={styles.featureText}>Crop impact analysis</Text>
              </View>
              <View style={styles.featureItemRow}>
                <Ionicons name="shield-checkmark-outline" size={19} color={Colors.oliveGreen} style={styles.featureIcon} />
                <Text style={styles.featureText}>Smart recommendations</Text>
              </View>
            </View>

            {/* Bottom Primary Button */}
            <TouchableOpacity
              style={styles.primaryPillButton}
              onPress={() => setCurrentScreen('dashboard')}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryPillButtonText}>View Weather</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.pureWhite} />
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 3: WEATHER FORECAST (7 / 14 DAYS)
  // =========================================================================
  if (currentScreen === 'forecast') {
    const listToRender = forecastRange === '7' ? FORECAST_DAYS_7 : FORECAST_DAYS_EXTENDED;

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>Weather Forecast</Text>
            <View style={{ width: 42 }} />
          </View>

          {/* 7 Days / 14 Days Segmented Selector */}
          <View style={styles.segmentedSelectorRow}>
            <TouchableOpacity
              style={[styles.segmentBtn, forecastRange === '7' && styles.segmentBtnActive]}
              onPress={() => setForecastRange('7')}
              activeOpacity={0.85}
            >
              <Text style={[styles.segmentBtnText, forecastRange === '7' && styles.segmentBtnTextActive]}>
                7 Days
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, forecastRange === '14' && styles.segmentBtnActive]}
              onPress={() => setForecastRange('14')}
              activeOpacity={0.85}
            >
              <Text style={[styles.segmentBtnText, forecastRange === '14' && styles.segmentBtnTextActive]}>
                14 Days
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.forecastListScroll} showsVerticalScrollIndicator={false}>
            {listToRender.map((item, idx) => (
              <View key={idx} style={styles.forecastDayRow}>
                <View style={styles.forecastDateSide}>
                  <Text style={styles.forecastDayName}>{item.day}</Text>
                  <Text style={styles.forecastDateSub}>{item.date}</Text>
                </View>

                <View style={styles.forecastIconSide}>
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={
                      item.icon === 'sunny'
                        ? '#F39C12'
                        : item.icon === 'rainy'
                        ? '#3C82D6'
                        : Colors.deepOlive
                    }
                  />
                </View>

                <View style={styles.forecastTempSide}>
                  <Text style={styles.forecastTempRange}>
                    {item.high}° <Text style={styles.forecastTempLow}>/ {item.low}°</Text>
                  </Text>
                </View>
              </View>
            ))}
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
            {/* User Crop Card */}
            <View style={styles.cropProfileCard}>
              <View style={styles.cropProfileThumbBox}>
                <Image
                  source={require('../../../assets/seed-calendar-bg.jpg')}
                  style={styles.cropProfileThumbPhoto}
                />
              </View>
              <View style={styles.cropProfileText}>
                <Text style={styles.cropProfileName}>{userCrop}</Text>
                <Text style={styles.cropProfileStage}>Current Stage: {cropStage}</Text>
              </View>
            </View>

            {/* Weather Ideal Status Pill */}
            <View style={styles.idealPillBanner}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.oliveGreen} />
              <Text style={styles.idealPillText}>Weather is ideal for current stage.</Text>
            </View>

            {/* Impact Overview Card */}
            <View style={styles.impactOverviewCard}>
              <Text style={styles.impactSectionTitle}>Impact Overview</Text>

              <View style={styles.impactOverviewBody}>
                {/* 92% Circular Gauge */}
                <View style={styles.impactGaugeCol}>
                  <FavourableCircularGauge percent={92} size={110} />
                </View>

                {/* Rating Bars */}
                <View style={styles.impactMetricsCol}>
                  <View style={styles.metricBarItem}>
                    <Text style={styles.metricBarLabel}>Temperature</Text>
                    <SegmentedRatingBars activeCount={4} />
                  </View>

                  <View style={styles.metricBarItem}>
                    <Text style={styles.metricBarLabel}>Humidity</Text>
                    <SegmentedRatingBars activeCount={3} />
                  </View>

                  <View style={styles.metricBarItem}>
                    <Text style={styles.metricBarLabel}>Rain Chance</Text>
                    <SegmentedRatingBars activeCount={1} />
                  </View>
                </View>
              </View>
            </View>

            {/* AI Tip Highlight Card */}
            <View style={styles.aiTipHighlightCard}>
              <View style={styles.aiTipBulbBadge}>
                <Ionicons name="bulb" size={20} color="#D98A2C" />
              </View>
              <View style={styles.aiTipTextSide}>
                <Text style={styles.aiTipBoldLabel}>AI Tip</Text>
                <Text style={styles.aiTipSubBody}>
                  Maintain soil moisture for healthy growth.
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 5: ALERTS & WARNINGS
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
            <Text style={styles.screenHeaderTitle}>Alerts &amp; Warnings</Text>
            <View style={{ width: 42 }} />
          </View>

          <ScrollView contentContainerStyle={styles.alertsScroll} showsVerticalScrollIndicator={false}>
            {/* Alert Card 1: Light Rain Expected */}
            <View style={styles.alertWarningCard}>
              <View style={styles.alertIconCenter}>
                <Ionicons name="rainy" size={38} color="#5DADE2" />
              </View>
              <Text style={styles.alertMainTitle}>Light Rain Expected in 2 days{'\n'}(≈ 5mm)</Text>
              <Text style={styles.alertDesc}>
                Consider checking drainage and avoid excessive irrigation.
              </Text>
            </View>

            {/* Alert Card 2: High UV Index */}
            <View style={styles.alertWarningCard}>
              <View style={styles.alertIconCenter}>
                <Ionicons name="sunny" size={38} color="#F39C12" />
              </View>
              <Text style={styles.alertMainTitle}>High UV Index (6) Today</Text>
              <Text style={styles.alertDesc}>
                Use protective measures for outdoor work.
              </Text>
            </View>

            {/* Bottom Button */}
            <TouchableOpacity
              style={styles.primaryPillButton}
              onPress={() => setCurrentScreen('alerts-settings')}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryPillButtonText}>View Details</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.pureWhite} />
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 6: DETAILED FORECAST (HOURLY / DAILY)
  // =========================================================================
  if (currentScreen === 'detailed') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>Detailed Forecast</Text>
            <View style={{ width: 42 }} />
          </View>

          {/* Hourly vs Daily Selector */}
          <View style={styles.segmentedSelectorRow}>
            <TouchableOpacity
              style={[styles.segmentBtn, detailedMode === 'hourly' && styles.segmentBtnActive]}
              onPress={() => setDetailedMode('hourly')}
              activeOpacity={0.85}
            >
              <Text style={[styles.segmentBtnText, detailedMode === 'hourly' && styles.segmentBtnTextActive]}>
                Hourly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, detailedMode === 'daily' && styles.segmentBtnActive]}
              onPress={() => setDetailedMode('daily')}
              activeOpacity={0.85}
            >
              <Text style={[styles.segmentBtnText, detailedMode === 'daily' && styles.segmentBtnTextActive]}>
                Daily
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.detailedScroll} showsVerticalScrollIndicator={false}>
            {/* Hourly Temperature Chart Card with Smooth Spline */}
            <View style={styles.detailedChartCard}>
              <HourlyTemperatureChart />
            </View>

            {/* Bottom 3 Metrics */}
            <View style={styles.detailedMetricsRow}>
              <View style={styles.detailedMetricBox}>
                <Ionicons name="leaf-outline" size={22} color={Colors.oliveGreen} />
                <Text style={styles.detailedMetricVal}>12 km/h</Text>
                <Text style={styles.detailedMetricSub}>Wind Speed</Text>
              </View>

              <View style={styles.detailedMetricBox}>
                <Ionicons name="water-outline" size={22} color={Colors.oliveGreen} />
                <Text style={styles.detailedMetricVal}>64%</Text>
                <Text style={styles.detailedMetricSub}>Humidity</Text>
              </View>

              <View style={styles.detailedMetricBox}>
                <Ionicons name="umbrella-outline" size={22} color={Colors.oliveGreen} />
                <Text style={styles.detailedMetricVal}>0%</Text>
                <Text style={styles.detailedMetricSub}>Rain Chance</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 7: RAIN PREDICTION
  // =========================================================================
  if (currentScreen === 'rain') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>Rain Prediction</Text>
            <View style={{ width: 42 }} />
          </View>

          <ScrollView contentContainerStyle={styles.rainScroll} showsVerticalScrollIndicator={false}>
            {/* Center 3D Rain Cloud */}
            <View style={styles.rainGraphicWrapper}>
              <RainCloud3DGraphic size={135} />
            </View>

            {/* Large 5% Rain Chance Text */}
            <Text style={styles.rainBigPercent}>5%</Text>
            <Text style={styles.rainBigLabel}>Chance of Rain</Text>
            <Text style={styles.rainTimingSub}>Next Possible Rain in 2–3 Days</Text>

            {/* Bottom Information Pill */}
            <View style={styles.rainAdvisoryPill}>
              <Ionicons name="information-circle" size={18} color={Colors.deepOlive} />
              <Text style={styles.rainAdvisoryText}>
                No significant rainfall expected this week.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 8: AI INSIGHTS (MENTIONS CROP GROWN & HOW WEATHER AFFECTS IT)
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
            {/* Center Sprout Visual */}
            <View style={styles.sproutVisualBox}>
              <Image
                source={require('../../../assets/seed-calendar-bg.jpg')}
                style={styles.sproutPhotoCircle}
              />
            </View>

            <Text style={styles.insightsHeadline}>Smart Insights</Text>

            {/* Bullet 1: Favourability for User's Grown Crop */}
            <View style={styles.insightBulletCard}>
              <Ionicons name="leaf" size={22} color={Colors.oliveGreen} style={styles.insightBulletIcon} />
              <View style={styles.insightBulletTextSide}>
                <Text style={styles.insightBulletMain}>
                  Weather is favourable for {userCrop} growth this week.
                </Text>
                <Text style={styles.insightBulletSecondary}>
                  Current daytime temperatures (27°C–29°C) and cool nights (19°C) maintain optimal stomatal conductance and rapid seedling vigor for {userCrop}.
                </Text>
              </View>
            </View>

            {/* Bullet 2: Moisture Target for User's Crop */}
            <View style={styles.insightBulletCard}>
              <Ionicons name="water" size={22} color="#3498DB" style={styles.insightBulletIcon} />
              <View style={styles.insightBulletTextSide}>
                <Text style={styles.insightBulletMain}>
                  Keep soil moisture between 60–70%.
                </Text>
                <Text style={styles.insightBulletSecondary}>
                  {userCrop} root expansion benefits from consistent capillary water. Avoid both dry soil crusting and standing ponding.
                </Text>
              </View>
            </View>

            {/* Bullet 3: Rain Prep for User's Crop */}
            <View style={styles.insightBulletCard}>
              <Ionicons name="shield-checkmark" size={22} color="#F5B025" style={styles.insightBulletIcon} />
              <View style={styles.insightBulletTextSide}>
                <Text style={styles.insightBulletMain}>
                  Be prepared for light rain in 2 days.
                </Text>
                <Text style={styles.insightBulletSecondary}>
                  Light showers will supply natural nitrogen for {userCrop}. Verify farm furrows remain clear for smooth drainage.
                </Text>
              </View>
            </View>

            {/* Bottom Primary Button: "Got it" */}
            <TouchableOpacity
              style={[styles.primaryPillButton, { marginTop: Spacing.md }]}
              onPress={() => setCurrentScreen('dashboard')}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryPillButtonText}>Got it</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 9: WEEKLY SUMMARY
  // =========================================================================
  if (currentScreen === 'summary') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>Weekly Summary</Text>
            <View style={{ width: 42 }} />
          </View>

          <ScrollView contentContainerStyle={styles.summaryScroll} showsVerticalScrollIndicator={false}>
            {/* Overall Outlook Hero Card */}
            <View style={styles.summaryOutlookCard}>
              <View style={styles.outlookIconWrap}>
                <Ionicons name="cellular" size={28} color={Colors.oliveGreen} />
              </View>
              <View style={styles.outlookTextWrap}>
                <Text style={styles.outlookSub}>Overall Outlook</Text>
                <Text style={styles.outlookStatus}>Favourable</Text>
              </View>
            </View>

            {/* 3 Metric Rows */}
            <View style={styles.summaryMetricsCard}>
              <View style={styles.summaryMetricRow}>
                <View style={styles.summaryMetricLeft}>
                  <Ionicons name="sunny" size={22} color="#F39C12" />
                  <Text style={styles.summaryMetricLabel}>Average Temp</Text>
                </View>
                <Text style={styles.summaryMetricVal}>27°C – 29°C</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryMetricRow}>
                <View style={styles.summaryMetricLeft}>
                  <Ionicons name="water" size={22} color="#3498DB" />
                  <Text style={styles.summaryMetricLabel}>Total Rainfall</Text>
                </View>
                <Text style={styles.summaryMetricVal}>≈ 5 mm</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryMetricRow}>
                <View style={styles.summaryMetricLeft}>
                  <Ionicons name="leaf" size={22} color={Colors.oliveGreen} />
                  <Text style={styles.summaryMetricLabel}>Avg Wind Speed</Text>
                </View>
                <Text style={styles.summaryMetricVal}>10 – 14 km/h</Text>
              </View>
            </View>

            {/* Bottom Landscape photo banner */}
            <View style={styles.summaryBottomBanner}>
              <Image
                source={require('../../../assets/home-bg.jpg')}
                style={styles.summaryLandscapePhoto}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(250, 247, 242, 1)', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </ScrollView>

          {/* Botanical leaves accent at the bottom */}
          <BotanicalCornerLeaves size={95} />
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 10: MORE OPTIONS (FULLY FUNCTIONAL)
  // =========================================================================
  if (currentScreen === 'options') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Top Leaf Accent */}
          <BotanicalCornerLeaves size={110} />

          {/* Header */}
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>More Options</Text>
            <View style={{ width: 42 }} />
          </View>

          <ScrollView contentContainerStyle={styles.optionsScroll} showsVerticalScrollIndicator={false}>
            {/* Option 1: Set Weather Alerts */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => setCurrentScreen('alerts-settings')}
              activeOpacity={0.85}
            >
              <View style={styles.optionCardLeft}>
                <View style={styles.optionIconBox}>
                  <Ionicons name="notifications" size={20} color={Colors.oliveGreen} />
                </View>
                <View>
                  <Text style={styles.optionTitle}>Set Weather Alerts</Text>
                  <Text style={styles.optionSubtitle}>Rain, storm &amp; temperature triggers</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.deepOlive} />
            </TouchableOpacity>

            {/* Option 2: View Historical Data */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => setCurrentScreen('history')}
              activeOpacity={0.85}
            >
              <View style={styles.optionCardLeft}>
                <View style={styles.optionIconBox}>
                  <Ionicons name="time" size={20} color={Colors.oliveGreen} />
                </View>
                <View>
                  <Text style={styles.optionTitle}>View Historical Data</Text>
                  <Text style={styles.optionSubtitle}>Past rainfall &amp; temperature records</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.deepOlive} />
            </TouchableOpacity>

            {/* Option 3: Crop-Specific Forecast */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => setCurrentScreen('crop-forecast')}
              activeOpacity={0.85}
            >
              <View style={styles.optionCardLeft}>
                <View style={styles.optionIconBox}>
                  <Ionicons name="leaf" size={20} color={Colors.oliveGreen} />
                </View>
                <View>
                  <Text style={styles.optionTitle}>Crop-Specific Forecast</Text>
                  <Text style={styles.optionSubtitle}>GDD &amp; ETc analysis for {userCrop}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.deepOlive} />
            </TouchableOpacity>

            {/* Option 4: Regional Weather Map */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => setCurrentScreen('radar-map')}
              activeOpacity={0.85}
            >
              <View style={styles.optionCardLeft}>
                <View style={styles.optionIconBox}>
                  <Ionicons name="location" size={20} color={Colors.oliveGreen} />
                </View>
                <View>
                  <Text style={styles.optionTitle}>Regional Weather Map</Text>
                  <Text style={styles.optionSubtitle}>Tumakuru district weather stations</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.deepOlive} />
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SUB-VIEW 10.1: SET WEATHER ALERTS (FUNCTIONAL TOGGLES)
  // =========================================================================
  if (currentScreen === 'alerts-settings') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('options')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>Set Weather Alerts</Text>
            <View style={{ width: 42 }} />
          </View>

          <ScrollView contentContainerStyle={styles.subViewScroll} showsVerticalScrollIndicator={false}>
            {alertSaveMessage && (
              <View style={styles.successToastBox}>
                <Ionicons name="checkmark-circle" size={18} color="#27AE60" />
                <Text style={styles.successToastText}>{alertSaveMessage}</Text>
              </View>
            )}

            <View style={styles.alertsSettingsCard}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.toggleTitle}>Heavy Rain Alert</Text>
                  <Text style={styles.toggleDesc}>Notify when forecast exceeds 15 mm/day</Text>
                </View>
                <Switch
                  value={heavyRainAlert}
                  onValueChange={setHeavyRainAlert}
                  trackColor={{ false: '#D5D0C5', true: '#7E9F56' }}
                  thumbColor={Colors.pureWhite}
                />
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.toggleTitle}>Extreme Heat Warning</Text>
                  <Text style={styles.toggleDesc}>Trigger alert when temperature exceeds 35°C</Text>
                </View>
                <Switch
                  value={highHeatAlert}
                  onValueChange={setHighHeatAlert}
                  trackColor={{ false: '#D5D0C5', true: '#7E9F56' }}
                  thumbColor={Colors.pureWhite}
                />
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.toggleTitle}>High Wind Advisory</Text>
                  <Text style={styles.toggleDesc}>Alert when wind gusts exceed 20 km/h</Text>
                </View>
                <Switch
                  value={highWindAlert}
                  onValueChange={setHighWindAlert}
                  trackColor={{ false: '#D5D0C5', true: '#7E9F56' }}
                  thumbColor={Colors.pureWhite}
                />
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.toggleTitle}>Fungal Disease High RH Alert</Text>
                  <Text style={styles.toggleDesc}>Warning when humidity stays above 85% for 8h</Text>
                </View>
                <Switch
                  value={fungalRiskAlert}
                  onValueChange={setFungalRiskAlert}
                  trackColor={{ false: '#D5D0C5', true: '#7E9F56' }}
                  thumbColor={Colors.pureWhite}
                />
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.toggleTitle}>Drought &amp; Soil Drying Alert</Text>
                  <Text style={styles.toggleDesc}>Alert when root zone moisture drops below 35%</Text>
                </View>
                <Switch
                  value={droughtAlert}
                  onValueChange={setDroughtAlert}
                  trackColor={{ false: '#D5D0C5', true: '#7E9F56' }}
                  thumbColor={Colors.pureWhite}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryPillButton, { marginTop: Spacing.xl }]}
              onPress={handleSaveAlerts}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryPillButtonText}>Save Alert Preferences</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SUB-VIEW 10.2: VIEW HISTORICAL DATA
  // =========================================================================
  if (currentScreen === 'history') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('options')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>Historical Weather</Text>
            <View style={{ width: 42 }} />
          </View>

          {/* 7 Days vs 30 Days Selector */}
          <View style={styles.segmentedSelectorRow}>
            <TouchableOpacity
              style={[styles.segmentBtn, historyTab === '7d' && styles.segmentBtnActive]}
              onPress={() => setHistoryTab('7d')}
              activeOpacity={0.85}
            >
              <Text style={[styles.segmentBtnText, historyTab === '7d' && styles.segmentBtnTextActive]}>
                Past 7 Days
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, historyTab === '30d' && styles.segmentBtnActive]}
              onPress={() => setHistoryTab('30d')}
              activeOpacity={0.85}
            >
              <Text style={[styles.segmentBtnText, historyTab === '30d' && styles.segmentBtnTextActive]}>
                Past 30 Days
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.subViewScroll} showsVerticalScrollIndicator={false}>
            {/* Historical Summary Hero */}
            <View style={styles.historyHeroRow}>
              <View style={styles.historyTile}>
                <Text style={styles.historyTileVal}>18.5 mm</Text>
                <Text style={styles.historyTileSub}>Total Rainfall</Text>
              </View>
              <View style={styles.historyTile}>
                <Text style={styles.historyTileVal}>28.2°C</Text>
                <Text style={styles.historyTileSub}>Average High</Text>
              </View>
              <View style={styles.historyTile}>
                <Text style={styles.historyTileVal}>66%</Text>
                <Text style={styles.historyTileSub}>Average RH</Text>
              </View>
            </View>

            {/* Daily History Table */}
            <View style={styles.historyTableCard}>
              <Text style={styles.historyTableTitle}>Recorded Daily Readings</Text>
              {[
                { date: 'Nov 23', condition: 'Sunny', high: 29, rain: '0 mm', moisture: '64%' },
                { date: 'Nov 22', condition: 'Partly Cloudy', high: 28, rain: '2 mm', moisture: '68%' },
                { date: 'Nov 21', condition: 'Light Rain', high: 26, rain: '8 mm', moisture: '75%' },
                { date: 'Nov 20', condition: 'Cloudy', high: 27, rain: '4 mm', moisture: '70%' },
                { date: 'Nov 19', condition: 'Sunny', high: 29, rain: '0 mm', moisture: '62%' },
                { date: 'Nov 18', condition: 'Sunny', high: 30, rain: '0 mm', moisture: '58%' },
                { date: 'Nov 17', condition: 'Thunderstorm', high: 25, rain: '4.5 mm', moisture: '78%' },
              ].map((row, idx) => (
                <View key={idx} style={styles.historyTableRow}>
                  <Text style={styles.historyTableDate}>{row.date}</Text>
                  <Text style={styles.historyTableCond}>{row.condition}</Text>
                  <Text style={styles.historyTableRain}>{row.rain}</Text>
                  <Text style={styles.historyTableMoist}>{row.moisture}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SUB-VIEW 10.3: CROP-SPECIFIC FORECAST
  // =========================================================================
  if (currentScreen === 'crop-forecast') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('options')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>{userCrop} Forecast</Text>
            <View style={{ width: 42 }} />
          </View>

          <ScrollView contentContainerStyle={styles.subViewScroll} showsVerticalScrollIndicator={false}>
            {/* Crop Header */}
            <View style={styles.cropForecastBanner}>
              <Ionicons name="leaf" size={28} color={Colors.oliveGreen} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cropForecastTitle}>{userCrop} Agronomic Metrics</Text>
                <Text style={styles.cropForecastSub}>Growth Stage: {cropStage} · Root Zone: 15–20 cm</Text>
              </View>
            </View>

            {/* Agronomic Parameter Cards */}
            <View style={styles.agronomyGrid}>
              <View style={styles.agronomyCard}>
                <Text style={styles.agronomyLabel}>Growing Degree Days</Text>
                <Text style={styles.agronomyValue}>18.5 GDD/day</Text>
                <Text style={styles.agronomySub}>Base Temp 10°C (Optimal)</Text>
              </View>

              <View style={styles.agronomyCard}>
                <Text style={styles.agronomyLabel}>Crop Water Demand (ETc)</Text>
                <Text style={styles.agronomyValue}>3.2 mm/day</Text>
                <Text style={styles.agronomySub}>Kc = 0.85 ({cropStage})</Text>
              </View>

              <View style={styles.agronomyCard}>
                <Text style={styles.agronomyLabel}>Spray Window Advisory</Text>
                <Text style={[styles.agronomyValue, { color: '#27AE60' }]}>Optimal</Text>
                <Text style={styles.agronomySub}>Wind 12 km/h · No rain in 24h</Text>
              </View>

              <View style={styles.agronomyCard}>
                <Text style={styles.agronomyLabel}>Root Thermal Comfort</Text>
                <Text style={[styles.agronomyValue, { color: '#27AE60' }]}>Ideal (26°C)</Text>
                <Text style={styles.agronomySub}>Soil respiration unhindered</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SUB-VIEW 10.4: REGIONAL WEATHER MAP
  // =========================================================================
  if (currentScreen === 'radar-map') {
    const STATIONS = [
      { name: 'Tumakuru Central', temp: '28°C', rh: '64%', wind: '12 km/h', rain: '0 mm' },
      { name: 'Koratagere Station', temp: '27°C', rh: '66%', wind: '10 km/h', rain: '0 mm' },
      { name: 'Gubbi Farm Station', temp: '28°C', rh: '62%', wind: '14 km/h', rain: '0.5 mm' },
      { name: 'Sira North', temp: '29°C', rh: '58%', wind: '15 km/h', rain: '0 mm' },
      { name: 'Madhugiri Hills', temp: '29°C', rh: '60%', wind: '11 km/h', rain: '0 mm' },
      { name: 'Tiptur Coconut Belt', temp: '27°C', rh: '68%', wind: '9 km/h', rain: '1 mm' },
    ];

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.screenHeaderRow}>
            <TouchableOpacity onPress={() => setCurrentScreen('options')} style={styles.circleBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>Regional Stations</Text>
            <View style={{ width: 42 }} />
          </View>

          <ScrollView contentContainerStyle={styles.subViewScroll} showsVerticalScrollIndicator={false}>
            {/* Map Preview Banner */}
            <View style={styles.mapGraphicCard}>
              <Svg width="100%" height={160} viewBox="0 0 320 160">
                <Defs>
                  <SvgGradient id="radarMapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#EAF2E8" />
                    <Stop offset="100%" stopColor="#D5E6D0" />
                  </SvgGradient>
                </Defs>
                <Rect x="0" y="0" width="320" height="160" rx="16" fill="url(#radarMapGrad)" />
                {/* District contour outlines */}
                <Path
                  d="M 30 40 Q 90 20 160 45 Q 240 30 290 60 Q 280 120 210 140 Q 120 150 50 120 Z"
                  stroke="#A7C99D"
                  strokeWidth="2.5"
                  fill="rgba(167, 201, 157, 0.35)"
                />
                {/* Station Pins */}
                <Circle cx="150" cy="75" r="7" fill="#E67E22" />
                <Circle cx="150" cy="75" r="14" stroke="#E67E22" strokeWidth="1.5" fill="none" opacity={0.6} />
                <Circle cx="180" cy="45" r="5" fill="#5F7445" />
                <Circle cx="110" cy="85" r="5" fill="#5F7445" />
                <Circle cx="210" cy="110" r="5" fill="#5F7445" />
                <Circle cx="75" cy="105" r="5" fill="#5F7445" />
              </Svg>
              <View style={styles.mapBadgeOverlay}>
                <Ionicons name="navigate" size={14} color={Colors.pureWhite} />
                <Text style={styles.mapBadgeText}>Tumakuru District Live Doppler</Text>
              </View>
            </View>

            {/* Station List */}
            <View style={styles.stationsListBox}>
              <Text style={styles.stationsListTitle}>Micro-Climate Stations</Text>
              {STATIONS.map((st) => {
                const isSelected = selectedStation === st.name;
                return (
                  <TouchableOpacity
                    key={st.name}
                    style={[styles.stationRow, isSelected && styles.stationRowSelected]}
                    onPress={() => setSelectedStation(st.name)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.stationLeft}>
                      <Ionicons
                        name="radio-button-on"
                        size={18}
                        color={isSelected ? Colors.oliveGreen : Colors.textMuted}
                      />
                      <Text style={[styles.stationName, isSelected && styles.stationNameSelected]}>
                        {st.name}
                      </Text>
                    </View>
                    <View style={styles.stationMetrics}>
                      <Text style={styles.stationTemp}>{st.temp}</Text>
                      <Text style={styles.stationSub}>{st.rh} · {st.wind}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 2: MAIN WEATHER INTELLIGENCE DASHBOARD
  // =========================================================================
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header Row with Back Button */}
        <View style={styles.dashboardTopBar}>
          <TouchableOpacity onPress={() => setCurrentScreen('landing')} style={styles.circleBackBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.deepOlive} />
          </TouchableOpacity>
          <Text style={styles.dashboardTitleText}>Weather Intelligence</Text>
          <TouchableOpacity onPress={() => setCurrentScreen('options')} style={styles.circleBackBtn}>
            <Ionicons name="settings-outline" size={20} color={Colors.deepOlive} />
          </TouchableOpacity>
        </View>

        {/* Quick Flow Navigator Pill Strip (Lets user test all screens instantly!) */}
        <View style={styles.flowNavStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flowNavContent}>
            {[
              { id: 'forecast', label: '7 & 14d Forecast', icon: 'calendar-outline' },
              { id: 'crop-impact', label: 'Crop Impact', icon: 'leaf-outline' },
              { id: 'alerts', label: 'Alerts & Warnings', icon: 'warning-outline' },
              { id: 'detailed', label: 'Hourly Curve', icon: 'trending-up-outline' },
              { id: 'rain', label: 'Rain Prediction', icon: 'rainy-outline' },
              { id: 'insights', label: 'AI Insights', icon: 'bulb-outline' },
              { id: 'summary', label: 'Weekly Summary', icon: 'bar-chart-outline' },
              { id: 'options', label: 'More Options', icon: 'ellipsis-horizontal-circle-outline' },
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
          {/* Location Badge */}
          <View style={styles.locationPillRow}>
            <Ionicons name="location-sharp" size={17} color={Colors.oliveGreen} />
            <Text style={styles.locationPillText}>{locationName}</Text>
          </View>

          {/* Large Hero Weather Display: 28°C + 3D Sun Cloud + Condition */}
          <View style={styles.heroWeatherSection}>
            <View style={styles.heroTempCol}>
              <Text style={styles.heroLargeTemp}>{currentTemp}°C</Text>
              <Text style={styles.heroConditionLabel}>Partly Cloudy</Text>
            </View>
            <View style={styles.heroGraphicCol}>
              <SunCloud3DGraphic size={120} />
            </View>
          </View>

          {/* 3 Metric Cards in Row: 64% Humidity | 12 km/h Wind | UV 6 High */}
          <View style={styles.dashboardMetricsRow}>
            <View style={styles.metricSquareCard}>
              <Ionicons name="water-outline" size={22} color={Colors.oliveGreen} />
              <Text style={styles.metricValBig}>{currentHumidity}%</Text>
              <Text style={styles.metricValSub}>Humidity</Text>
            </View>

            <View style={styles.metricSquareCard}>
              <Ionicons name="leaf-outline" size={22} color={Colors.oliveGreen} />
              <Text style={styles.metricValBig}>{currentWind} km/h</Text>
              <Text style={styles.metricValSub}>Wind</Text>
            </View>

            <View style={styles.metricSquareCard}>
              <Ionicons name="sunny-outline" size={22} color="#F39C12" />
              <Text style={styles.metricValBig}>UV {currentUV}</Text>
              <Text style={styles.metricValSub}>High</Text>
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
              colors={['rgba(250, 247, 242, 0.2)', 'rgba(250, 247, 242, 0.75)']}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {/* ✨ Today's Summary Card */}
          <View style={styles.todaySummaryCard}>
            <View style={styles.todaySummaryHeader}>
              <Ionicons name="sparkles" size={16} color="#D98A2C" />
              <Text style={styles.todaySummaryTitle}>Today's Summary</Text>
            </View>
            <Text style={styles.todaySummaryBody}>
              Pleasant weather for farming. No rain expected today.
            </Text>
          </View>

          {/* Interactive Feature Cards to access all screens directly */}
          <View style={styles.shortcutsGrid}>
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setCurrentScreen('forecast')}
              activeOpacity={0.88}
            >
              <View style={styles.shortcutIconCircle}>
                <Ionicons name="calendar" size={20} color={Colors.oliveGreen} />
              </View>
              <Text style={styles.shortcutTitle}>Weather Forecast</Text>
              <Text style={styles.shortcutSub}>7 &amp; 14 Days outlook</Text>
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
              onPress={() => setCurrentScreen('alerts')}
              activeOpacity={0.88}
            >
              <View style={[styles.shortcutIconCircle, { backgroundColor: '#FDEBD0' }]}>
                <Ionicons name="warning" size={20} color="#E67E22" />
              </View>
              <Text style={styles.shortcutTitle}>Alerts &amp; Warnings</Text>
              <Text style={styles.shortcutSub}>Light rain expected</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setCurrentScreen('detailed')}
              activeOpacity={0.88}
            >
              <View style={styles.shortcutIconCircle}>
                <Ionicons name="trending-up" size={20} color={Colors.oliveGreen} />
              </View>
              <Text style={styles.shortcutTitle}>Detailed Forecast</Text>
              <Text style={styles.shortcutSub}>Hourly spline curve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setCurrentScreen('rain')}
              activeOpacity={0.88}
            >
              <View style={[styles.shortcutIconCircle, { backgroundColor: '#EBF5FB' }]}>
                <Ionicons name="rainy" size={20} color="#3498DB" />
              </View>
              <Text style={styles.shortcutTitle}>Rain Prediction</Text>
              <Text style={styles.shortcutSub}>5% chance today</Text>
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
              <Text style={styles.shortcutSub}>Tailored for {userCrop}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setCurrentScreen('summary')}
              activeOpacity={0.88}
            >
              <View style={styles.shortcutIconCircle}>
                <Ionicons name="bar-chart" size={20} color={Colors.oliveGreen} />
              </View>
              <Text style={styles.shortcutTitle}>Weekly Summary</Text>
              <Text style={styles.shortcutSub}>Favourable outlook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setCurrentScreen('options')}
              activeOpacity={0.88}
            >
              <View style={styles.shortcutIconCircle}>
                <Ionicons name="options" size={20} color={Colors.oliveGreen} />
              </View>
              <Text style={styles.shortcutTitle}>More Options</Text>
              <Text style={styles.shortcutSub}>Alerts, History, Map</Text>
            </TouchableOpacity>
          </View>
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
    height: 190,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  landingHeroPhoto: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  landingGraphicOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  featurePillCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    gap: 15,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#2A3122',
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
  dashboardTitleText: {
    fontSize: 20,
    fontWeight: '800',
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
  locationPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationPillText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#343B2A',
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
    height: 95,
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
  todaySummaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    gap: 6,
    ...Shadows.card,
  },
  todaySummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todaySummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#262D1D',
  },
  todaySummaryBody: {
    fontSize: 13.5,
    color: '#555C4C',
    lineHeight: 19,
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

  // SCREEN 3: FORECAST
  segmentedSelectorRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(230, 222, 210, 0.55)',
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.sm,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  segmentBtnActive: {
    backgroundColor: Colors.pureWhite,
    ...Shadows.soft,
  },
  segmentBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#6F7865',
  },
  segmentBtnTextActive: {
    color: '#262D1D',
    fontWeight: '800',
  },
  forecastListScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: 10,
  },
  forecastDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.65)',
    ...Shadows.card,
  },
  forecastDateSide: {
    width: 80,
  },
  forecastDayName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#262D1D',
  },
  forecastDateSub: {
    fontSize: 11.5,
    color: '#6F7865',
  },
  forecastIconSide: {
    width: 40,
    alignItems: 'center',
  },
  forecastTempSide: {
    alignItems: 'flex-end',
  },
  forecastTempRange: {
    fontSize: 15,
    fontWeight: '800',
    color: '#262D1D',
  },
  forecastTempLow: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#6F7865',
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
  idealPillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF2E8',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#C7DEC1',
  },
  idealPillText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#344722',
  },
  impactOverviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    gap: Spacing.md,
    ...Shadows.card,
  },
  impactSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#262D1D',
  },
  impactOverviewBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  impactGaugeCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePercentNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#262D1D',
  },
  gaugeSubLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#556F35',
    textAlign: 'center',
    lineHeight: 11,
  },
  impactMetricsCol: {
    flex: 1,
    gap: 12,
  },
  metricBarItem: {
    gap: 4,
  },
  metricBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#343B2A',
  },
  ratingBarContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingBarPill: {
    height: 7,
    flex: 1,
    borderRadius: 3.5,
  },
  ratingBarActive: {
    backgroundColor: '#7E9F56',
  },
  ratingBarInactive: {
    backgroundColor: '#E5DFD4',
  },
  aiTipHighlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  aiTipBulbBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF9E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTipTextSide: {
    flex: 1,
  },
  aiTipBoldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C49A45',
    textTransform: 'uppercase',
  },
  aiTipSubBody: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#262D1D',
    marginTop: 2,
  },

  // SCREEN 5: ALERTS & WARNINGS
  alertsScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  alertWarningCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
    ...Shadows.card,
  },
  alertIconCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#262D1D',
    textAlign: 'center',
    lineHeight: 24,
  },
  alertDesc: {
    fontSize: 13.5,
    color: '#555C4C',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },

  // SCREEN 6: DETAILED FORECAST
  detailedScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  detailedChartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  hourlyChartBox: {
    gap: 6,
  },
  hourlyIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  hourlyIconCol: {
    alignItems: 'center',
    width: 44,
  },
  hourlyTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F7865',
  },
  hourlyTempText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#262D1D',
  },
  detailedMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  detailedMetricBox: {
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
  detailedMetricVal: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#262D1D',
  },
  detailedMetricSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6F7865',
  },

  // SCREEN 7: RAIN PREDICTION
  rainScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
    gap: 12,
  },
  rainGraphicWrapper: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  rainBigPercent: {
    fontSize: 54,
    fontWeight: '800',
    color: '#262D1D',
    letterSpacing: -1,
  },
  rainBigLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#444C3A',
  },
  rainTimingSub: {
    fontSize: 14,
    color: '#6F7865',
    marginBottom: Spacing.lg,
  },
  rainAdvisoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(235, 228, 218, 0.75)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(215, 200, 175, 0.8)',
    width: '100%',
    justifyContent: 'center',
  },
  rainAdvisoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#343B2A',
  },

  // SCREEN 8: AI INSIGHTS
  insightsScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  sproutVisualBox: {
    alignSelf: 'center',
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.oliveGreen,
    marginVertical: 4,
  },
  sproutPhotoCircle: {
    width: '100%',
    height: '100%',
  },
  insightsHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#262D1D',
    textAlign: 'center',
    marginBottom: 4,
  },
  insightBulletCard: {
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
  insightBulletIcon: {
    marginTop: 2,
  },
  insightBulletTextSide: {
    flex: 1,
    gap: 4,
  },
  insightBulletMain: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#262D1D',
    lineHeight: 20,
  },
  insightBulletSecondary: {
    fontSize: 12.5,
    color: '#555C4C',
    lineHeight: 18,
  },

  // SCREEN 9: WEEKLY SUMMARY
  summaryScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  summaryOutlookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  outlookIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAF2E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlookTextWrap: {
    gap: 2,
  },
  outlookSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6F7865',
  },
  outlookStatus: {
    fontSize: 22,
    fontWeight: '800',
    color: '#5F7445',
  },
  summaryMetricsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    gap: 12,
    ...Shadows.card,
  },
  summaryMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryMetricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryMetricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#343B2A',
  },
  summaryMetricVal: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#262D1D',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(215, 200, 175, 0.45)',
  },
  summaryBottomBanner: {
    height: 110,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    marginTop: 6,
    ...Shadows.card,
  },
  summaryLandscapePhoto: {
    width: '100%',
    height: '100%',
  },

  // SCREEN 10: MORE OPTIONS
  optionsScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: 12,
  },
  optionCard: {
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
  optionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF2E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#262D1D',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#6F7865',
    marginTop: 2,
  },

  // SUBVIEWS
  subViewScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  alertsSettingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    gap: 10,
    ...Shadows.card,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  toggleTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#262D1D',
  },
  toggleDesc: {
    fontSize: 12,
    color: '#6F7865',
    marginTop: 2,
  },
  successToastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF7EE',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#BBE6C7',
  },
  successToastText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E7E43',
    flex: 1,
  },

  // HISTORY SUBVIEW
  historyHeroRow: {
    flexDirection: 'row',
    gap: 10,
  },
  historyTile: {
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
  historyTileVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#262D1D',
  },
  historyTileSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6F7865',
  },
  historyTableCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    gap: 10,
    ...Shadows.card,
  },
  historyTableTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#262D1D',
    marginBottom: 4,
  },
  historyTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(215, 200, 175, 0.35)',
  },
  historyTableDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#262D1D',
    width: 65,
  },
  historyTableCond: {
    fontSize: 12.5,
    color: '#555C4C',
    flex: 1,
  },
  historyTableRain: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#3498DB',
    width: 55,
    textAlign: 'right',
  },
  historyTableMoist: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#5F7445',
    width: 50,
    textAlign: 'right',
  },

  // CROP FORECAST SUBVIEW
  cropForecastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  cropForecastTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#262D1D',
  },
  cropForecastSub: {
    fontSize: 12.5,
    color: '#555C4C',
  },
  agronomyGrid: {
    gap: 10,
  },
  agronomyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
    gap: 4,
  },
  agronomyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F7865',
    textTransform: 'uppercase',
  },
  agronomyValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#262D1D',
  },
  agronomySub: {
    fontSize: 12.5,
    color: '#555C4C',
  },

  // REGIONAL MAP SUBVIEW
  mapGraphicCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    ...Shadows.card,
  },
  mapBadgeOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(38, 45, 29, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  mapBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.pureWhite,
  },
  stationsListBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 200, 175, 0.7)',
    gap: 8,
    ...Shadows.card,
  },
  stationsListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#262D1D',
    marginBottom: 4,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
  },
  stationRowSelected: {
    backgroundColor: '#EAF2E8',
  },
  stationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stationName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#343B2A',
  },
  stationNameSelected: {
    fontWeight: '800',
    color: '#262D1D',
  },
  stationMetrics: {
    alignItems: 'flex-end',
  },
  stationTemp: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#262D1D',
  },
  stationSub: {
    fontSize: 11,
    color: '#6F7865',
  },
});
