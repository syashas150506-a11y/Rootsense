import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useFarm } from '../../context/FarmContext';

export default function ConnectWifiScreen() {
  const router = useRouter();
  const { connectDevice, device } = useFarm();

  const [networkName, setNetworkName] = useState(device?.wifi_ssid || 'Farm_WiFi');
  const [password, setPassword] = useState('rootsense2026');
  const [showPassword, setShowPassword] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    await connectDevice(networkName.trim() || 'Farm_WiFi', device?.device_id || 'RS-KA-01');
    setConnecting(false);
    router.replace('/device/connected');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            <Text style={styles.mainTitle}>Connect to Wi-Fi</Text>
            <Text style={styles.subtitle}>
              Enter your farm Wi-Fi details to connect your device.
            </Text>
          </View>

          {/* Form Fields matching Screen 9 */}
          <View style={styles.formGroup}>
            {/* Network Name */}
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>Network Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="wifi"
                  size={20}
                  color={Colors.oliveGreen}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={networkName}
                  onChangeText={setNetworkName}
                  placeholder="Select or enter Wi-Fi"
                  placeholderTextColor={Colors.textMuted}
                />
                <Ionicons name="chevron-down" size={18} color={Colors.mutedGrey} />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.oliveGreen}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Enter Wi-Fi password"
                  placeholderTextColor={Colors.textMuted}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.mutedGrey}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={{ flex: 1 }} />

          {/* Connect Button */}
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnect}
            disabled={connecting}
            activeOpacity={0.88}
          >
            <Text style={styles.connectButtonText}>
              {connecting ? 'Connecting...' : 'Connect'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.pureWhite} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.warmIvory,
  },
  flexOne: {
    flex: 1,
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
    paddingBottom: Spacing.xl,
  },
  titleSection: {
    marginTop: Spacing.sm,
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
  formGroup: {
    gap: Spacing.lg,
  },
  fieldBox: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  fieldIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    color: Colors.charcoal,
    paddingVertical: Spacing.sm,
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
