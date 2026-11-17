import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useFarm } from '../../context/FarmContext';

export default function DeviceConnectedScreen() {
  const router = useRouter();
  const { saveFarmDetails } = useFarm();

  const handleProceed = async () => {
    await saveFarmDetails({
      deviceStatus: 'Online',
      deviceId: 'RS-KA-01',
    });
    router.replace('/device/status');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.contentContainer}>
        {/* Glowing Center Check Shield */}
        <View style={styles.heroCircleWrapper}>
          <View style={styles.outerGlowCircle}>
            <View style={styles.midGlowCircle}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={48} color={Colors.pureWhite} />
              </View>
            </View>
          </View>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Device Connected</Text>
          <Text style={styles.subtitle}>
            Your field is now connected to Root Sense.
          </Text>
        </View>

        {/* Status Breakdown Card matching Screen 10 */}
        <View style={styles.statusCard}>
          {/* Row 1: Wi-Fi Status */}
          <View style={styles.statusRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="wifi" size={18} color={Colors.deepOlive} />
              <Text style={styles.statusLabel}>Wi-Fi Status</Text>
            </View>
            <View style={styles.statusValueRow}>
              <View style={styles.greenDot} />
              <Text style={styles.statusValueText}>Connected</Text>
            </View>
          </View>

          {/* Row 2: Device Status */}
          <View style={styles.statusRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="hardware-chip-outline" size={18} color={Colors.deepOlive} />
              <Text style={styles.statusLabel}>Device Status</Text>
            </View>
            <View style={styles.statusValueRow}>
              <View style={styles.greenDot} />
              <Text style={styles.statusValueText}>Online</Text>
            </View>
          </View>

          {/* Row 3: Sensor Status */}
          <View style={styles.statusRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="speedometer-outline" size={18} color={Colors.deepOlive} />
              <Text style={styles.statusLabel}>Sensor Status</Text>
            </View>
            <View style={styles.statusValueRow}>
              <View style={styles.greenDot} />
              <Text style={styles.statusValueText}>Active</Text>
            </View>
          </View>

          {/* Row 4: Last Sync */}
          <View style={[styles.statusRow, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="time-outline" size={18} color={Colors.deepOlive} />
              <Text style={styles.statusLabel}>Last Sync</Text>
            </View>
            <Text style={styles.syncValueText}>Just now</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Action Button */}
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceed}
          activeOpacity={0.88}
        >
          <Text style={styles.proceedButtonText}>Go to Live Monitoring</Text>
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  heroCircleWrapper: {
    marginVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlowCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#EBF2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  midGlowCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#DCE6C6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.oliveGreen,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.elevated,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.charcoal,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  statusCard: {
    width: '100%',
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.sandBeige,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
  },
  statusValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.oliveGreen,
  },
  statusValueText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.oliveGreen,
  },
  syncValueText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  proceedButton: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.oliveGreen,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  proceedButtonText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.pureWhite,
  },
});
