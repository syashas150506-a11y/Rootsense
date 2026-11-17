import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { BotanicalCornerLeaves } from '../../components/BotanicalCornerLeaves';
import { SensorLocationMap } from '../../components/SensorLocationMap';
import { resolveClientCoords } from '../../constants/agronomyData';
import { useFarm } from '../../context/FarmContext';

export default function MyFarmScreen() {
  const router = useRouter();
  const { farmDetails, device, resetFarmDetails } = useFarm();

  const name = farmDetails?.name || 'Ramesh Gowda';
  const location = farmDetails?.location || 'Tumakuru, Karnataka';
  const fallbackCoords = resolveClientCoords(location);
  const latitude = farmDetails?.latitude ?? fallbackCoords.latitude;
  const longitude = farmDetails?.longitude ?? fallbackCoords.longitude;
  const crop = farmDetails?.cropGrown || 'Ragi';
  const soil = farmDetails?.soilType || 'Red Loam';
  const dimension = farmDetails?.fieldDimension || '2.5';
  const unit = farmDetails?.fieldUnit || 'Acres';
  const deviceId = device?.device_id || 'RS-KA-01';
  const deviceStatus = device?.status || 'Online';
  const moisture = farmDetails?.soilMoisture ?? 38.5;

  const handleReset = () => {
    Alert.alert(
      'Reset Farm Profile',
      'Are you sure you want to reset your farm profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetFarmDetails();
            router.replace('/setup');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Botanical Corner Leaves top right */}
      <BotanicalCornerLeaves size={120} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>My Farm</Text>
        </View>

        {/* Farmer Profile Card (Screen 13) */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={26} color={Colors.deepOlive} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.farmerName}>{name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.mutedGrey} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          </View>
        </View>

        {/* Free OpenStreetMap + Leaflet Sensor Location Map */}
        <SensorLocationMap
          latitude={latitude}
          longitude={longitude}
          locationName={location}
          deviceId={deviceId}
          moisture={moisture}
          status={deviceStatus}
          cropName={crop}
        />

        {/* Menu Navigation Rows */}
        <View style={styles.menuContainer}>
          {/* 1. Crop & Field Details */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/setup')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="leaf-outline" size={20} color={Colors.oliveGreen} />
              </View>
              <View style={styles.menuTextGroup}>
                <Text style={styles.menuTitle}>Crop & Field Details</Text>
                <Text style={styles.menuSub}>
                  {crop} • {soil} • {dimension} {unit}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.mutedGrey} />
          </TouchableOpacity>

          {/* 2. Connected Devices */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/device/status')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="hardware-chip-outline" size={20} color={Colors.oliveGreen} />
              </View>
              <View style={styles.menuTextGroup}>
                <Text style={styles.menuTitle}>Connected Devices</Text>
                <Text style={styles.menuSub}>
                  1 device ({deviceId}) •{' '}
                  <Text style={{ color: Colors.oliveGreen, fontWeight: '700' }}>
                    {deviceStatus}
                  </Text>
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.mutedGrey} />
          </TouchableOpacity>

          {/* 3. Language */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() =>
              Alert.alert('Language Settings', 'Current language: English.\nKannada (ಕನ್ನಡ) available.')
            }
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="globe-outline" size={20} color={Colors.oliveGreen} />
              </View>
              <View style={styles.menuTextGroup}>
                <Text style={styles.menuTitle}>Language</Text>
                <Text style={styles.menuSub}>English</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.mutedGrey} />
          </TouchableOpacity>

          {/* 4. Appearance */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() =>
              Alert.alert('Appearance', 'Warm Botanical Light Harvest Theme is currently active.')
            }
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="sunny-outline" size={20} color={Colors.oliveGreen} />
              </View>
              <View style={styles.menuTextGroup}>
                <Text style={styles.menuTitle}>Appearance</Text>
                <Text style={styles.menuSub}>Light Mode</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.mutedGrey} />
          </TouchableOpacity>

          {/* 5. Notifications */}
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="notifications-outline" size={20} color={Colors.oliveGreen} />
              </View>
              <View style={styles.menuTextGroup}>
                <Text style={styles.menuTitle}>Notifications</Text>
                <Text style={styles.menuSub}>Manage alerts and updates</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.mutedGrey} />
          </TouchableOpacity>
        </View>

        {/* Device Setup Quick Link */}
        <TouchableOpacity
          style={styles.pairDeviceButton}
          onPress={() => router.push('/device/connect')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={20} color={Colors.oliveGreen} />
          <Text style={styles.pairDeviceText}>Pair New Field Sensor (ESP32)</Text>
        </TouchableOpacity>

        {/* Reset Option */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={16} color={Colors.error} />
          <Text style={styles.resetButtonText}>Reset Farm Configuration</Text>
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
  },
  headerRow: {
    marginBottom: Spacing.md,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.charcoal,
    letterSpacing: -0.3,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pureWhite,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EBE2CC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.goldenWheat,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  farmerName: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
  },
  menuContainer: {
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.sandBeige,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EBF2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextGroup: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  menuSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
  },
  pairDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.softCream,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  pairDeviceText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  resetButtonText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.error,
    fontWeight: '600',
  },
});
