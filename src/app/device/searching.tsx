import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export default function SearchingDeviceScreen() {
  const router = useRouter();

  // Radar pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.8,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Searching for{'\n'}Root Sense devices...</Text>
          <Text style={styles.subtitle}>
            Make sure your device is powered on and connected to Wi-Fi.
          </Text>
        </View>

        {/* Concentric Radar Rings */}
        <View style={styles.radarWrapper}>
          <Animated.View
            style={[
              styles.radarOuterRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseOpacity,
              },
            ]}
          />
          <View style={styles.radarMidRing} />
          <View style={styles.radarCenterCircle}>
            <Ionicons name="wifi" size={36} color={Colors.oliveGreen} />
          </View>
        </View>

        {/* Connection Options (Screen 8) */}
        <View style={styles.optionsList}>
          {/* Option 1: Wi-Fi Connection */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.push('/device/wifi')}
            activeOpacity={0.8}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIconCircle}>
                <Ionicons name="wifi-outline" size={20} color={Colors.oliveGreen} />
              </View>
              <View>
                <Text style={styles.optionTitle}>Wi-Fi Connection</Text>
                <Text style={styles.optionSub}>Configure device over Wi-Fi</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.mutedGrey} />
          </TouchableOpacity>

          {/* Option 2: Bluetooth Provisioning */}
          <View style={[styles.optionCard, styles.optionDisabled]}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIconCircle, styles.optionIconCircleDisabled]}>
                <Ionicons name="bluetooth-outline" size={20} color={Colors.mutedGrey} />
              </View>
              <View>
                <Text style={styles.optionTitle}>Bluetooth Provisioning</Text>
                <Text style={styles.optionSub}>(Not yet available)</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.warmIvory,
  },
  headerRow: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
  },
  titleSection: {
    marginTop: Spacing.sm,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.charcoal,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.xs + 2,
  },
  radarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
  },
  radarOuterRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#EBF2DB',
  },
  radarMidRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#DFEAC7',
  },
  radarCenterCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.pureWhite,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  optionsList: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.pureWhite,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  optionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EBF2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconCircleDisabled: {
    backgroundColor: Colors.softCream,
  },
  optionTitle: {
    fontSize: Typography.fontSizes.sm + 1,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  optionSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
    marginTop: 1,
  },
});
