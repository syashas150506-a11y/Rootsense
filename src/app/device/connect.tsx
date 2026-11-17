import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { ESP32DeviceGraphic } from '../../components/ESP32DeviceGraphic';

export default function ConnectFieldScreen() {
  const router = useRouter();

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Connect Your Field</Text>
          <Text style={styles.subtitle}>
            Connect your Root Sense monitoring device to start receiving live field
            intelligence.
          </Text>
        </View>

        {/* Hardware Illustration Card */}
        <View style={styles.hardwareCard}>
          <ESP32DeviceGraphic size={240} />
        </View>

        {/* Bullet Specs matching Screen 7 */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.checkCircle}>
              <Ionicons name="wifi" size={14} color={Colors.oliveGreen} />
            </View>
            <Text style={styles.featureText}>ESP32 (Wi-Fi)</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.checkCircle}>
              <Ionicons name="speedometer-outline" size={14} color={Colors.oliveGreen} />
            </View>
            <Text style={styles.featureText}>Capacitive Soil Moisture Sensor</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.checkCircle}>
              <Ionicons name="pulse-outline" size={14} color={Colors.oliveGreen} />
            </View>
            <Text style={styles.featureText}>Real-time Soil Data</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Connect Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => router.push('/device/searching')}
          activeOpacity={0.88}
        >
          <Text style={styles.connectButtonText}>Connect Device</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.pureWhite} />
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.charcoal,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  hardwareCard: {
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  featuresList: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBF2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: Typography.fontSizes.sm + 1,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.warmIvory,
    borderTopWidth: 1,
    borderTopColor: Colors.sandBeige,
  },
  connectButton: {
    height: 52,
    backgroundColor: Colors.oliveGreen,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  connectButtonText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.pureWhite,
  },
});
