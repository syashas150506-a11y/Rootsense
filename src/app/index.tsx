import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useFarm } from '../context/FarmContext';

const { width, height } = Dimensions.get('window');

export default function WelcomeSplashScreen() {
  const router = useRouter();
  const { loadDemoFarm } = useFarm();

  const handleGetStarted = () => {
    router.push('/setup');
  };

  const handleExploreDemo = async () => {
    await loadDemoFarm();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Background Golden Harvest Wheat Photo */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/setup-bg.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        {/* Soft Golden Sunset Vignette - lets the full wheat basket shine through */}
        <LinearGradient
          colors={[
            'transparent',
            'rgba(37, 37, 31, 0.20)',
            'rgba(37, 37, 31, 0.65)',
            'rgba(28, 30, 24, 0.90)',
          ]}
          locations={[0, 0.40, 0.70, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Top Logo Mark */}
        <View style={styles.topLogoRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="leaf" size={24} color={Colors.oliveGreen} />
            <Text style={styles.brandTitle}>Root Sense</Text>
          </View>
        </View>

        {/* Bottom Hero Content matching Screen 1 */}
        <View style={styles.bottomContent}>
          <Text style={styles.heroHeadline}>
            Understand{'\n'}Your Soil.{'\n'}Protect Your Crop.
          </Text>

          <Text style={styles.heroSubtitle}>
            AI-powered crop stress prediction & early warning system.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleGetStarted}
              activeOpacity={0.88}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.pureWhite} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleExploreDemo}
              activeOpacity={0.8}
            >
              <Text style={styles.demoText}>Explore Demo</Text>
            </TouchableOpacity>
          </View>

          {/* Three Pagination Dots */}
          <View style={styles.paginationDots}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.charcoal,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  topLogoRow: {
    paddingTop: Spacing.sm,
    alignItems: 'flex-start',
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(253, 242, 233, 0.94)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    gap: 8,
    ...Shadows.soft,
  },
  brandTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: '800',
    color: Colors.deepOlive,
    letterSpacing: -0.3,
  },
  bottomContent: {
    paddingBottom: Spacing.sm,
  },
  heroHeadline: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.pureWhite,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroSubtitle: {
    fontSize: Typography.fontSizes.sm + 1,
    color: 'rgba(253, 242, 233, 0.9)',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    maxWidth: '92%',
  },
  actionsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  getStartedButton: {
    height: 52,
    backgroundColor: Colors.oliveGreen,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  getStartedText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.pureWhite,
    letterSpacing: 0.3,
  },
  demoButton: {
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(253, 242, 233, 0.55)',
    backgroundColor: 'rgba(37, 37, 31, 0.25)',
  },
  demoText: {
    fontSize: Typography.fontSizes.sm + 1,
    fontWeight: '600',
    color: Colors.pureWhite,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  activeDot: {
    width: 20,
    borderRadius: 4,
    backgroundColor: Colors.pureWhite,
  },
});
