import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { BotanicalCornerLeaves } from '../components/BotanicalCornerLeaves';
import { useFarm } from '../context/FarmContext';
import { CROPS, SOIL_TYPES, IRRIGATION_TYPES } from '../constants/agronomyData';

export default function SetUpFarmScreen() {
  const router = useRouter();
  const { farmDetails, saveFarmDetails } = useFarm();

  const [farmerName, setFarmerName] = useState(farmDetails?.name || 'Ramesh Gowda');
  const [location, setLocation] = useState(farmDetails?.location || 'Tumakuru, Karnataka');
  const [cropType, setCropType] = useState(farmDetails?.cropGrown || 'Ragi');
  const [soilType, setSoilType] = useState(farmDetails?.soilType || 'Red Loam');
  const [fieldDimension, setFieldDimension] = useState(farmDetails?.fieldDimension || '2.5');
  const [irrigationType, setIrrigationType] = useState(farmDetails?.irrigationType || 'Drip');

  // Modals for selection
  const [cropPickerOpen, setCropPickerOpen] = useState(false);
  const [soilPickerOpen, setSoilPickerOpen] = useState(false);
  const [irrigationPickerOpen, setIrrigationPickerOpen] = useState(false);

  const handleNext = async () => {
    await saveFarmDetails({
      name: farmerName.trim() || 'Ramesh Gowda',
      location: location.trim() || 'Tumakuru, Karnataka',
      cropGrown: cropType,
      soilType: soilType,
      fieldDimension: fieldDimension.trim() || '2.5',
      fieldUnit: 'Acres',
      irrigationType: irrigationType,
      deviceStatus: 'Online',
    });

    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Background Golden Harvest Wheat Photo */}
      <Image
        source={require('../../assets/setup-bg.jpg')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Deep Warm Botanical / Charcoal Scrim for High Contrast & Visibility */}
      <LinearGradient
        colors={[
          'rgba(20, 24, 18, 0.58)',
          'rgba(14, 18, 12, 0.82)',
          'rgba(10, 14, 8, 0.94)',
        ]}
        locations={[0, 0.45, 0.9]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Decorative Botanical Leaves top right */}
        <BotanicalCornerLeaves size={120} />

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
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title & Subtitle */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Set Up Your Farm</Text>

            {/* Step Indicators: 1 2 3 4 */}
            <View style={styles.stepRow}>
              {[1, 2, 3, 4].map((step) => {
                const isActive = step === 1;
                return (
                  <View
                    key={step}
                    style={[
                      styles.stepCircle,
                      isActive && styles.stepCircleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepNum,
                        isActive && styles.stepNumActive,
                      ]}
                    >
                      {step}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.subtitle}>
              Let's get to know your farm for better recommendations.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Farmer Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Farmer Name</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={20} color={Colors.oliveGreen} style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={farmerName}
                  onChangeText={setFarmerName}
                  placeholder="Enter farmer name"
                  placeholderTextColor="#777777"
                />
              </View>
            </View>

            {/* Farm Location */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Farm Location</Text>
              <View style={styles.inputBox}>
                <Ionicons name="location-outline" size={20} color={Colors.oliveGreen} style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. Tumakuru, Karnataka"
                  placeholderTextColor="#777777"
                />
              </View>
            </View>

            {/* Crop Type Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Crop Type</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setCropPickerOpen(true)}
                activeOpacity={0.8}
              >
                <View style={styles.selectLeft}>
                  <Ionicons name="leaf-outline" size={20} color={Colors.oliveGreen} style={styles.fieldIcon} />
                  <Text style={styles.selectValue}>{cropType}</Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#444444" />
              </TouchableOpacity>
            </View>

            {/* Soil Type Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Soil Type</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setSoilPickerOpen(true)}
                activeOpacity={0.8}
              >
                <View style={styles.selectLeft}>
                  <Ionicons name="layers-outline" size={20} color={Colors.oliveGreen} style={styles.fieldIcon} />
                  <Text style={styles.selectValue}>{soilType}</Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#444444" />
              </TouchableOpacity>
            </View>

            {/* Field Dimension */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Field Dimension (Acres)</Text>
              <View style={styles.inputBox}>
                <Ionicons name="resize-outline" size={20} color={Colors.oliveGreen} style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={fieldDimension}
                  onChangeText={setFieldDimension}
                  placeholder="e.g. 2.5"
                  keyboardType="numeric"
                  placeholderTextColor="#777777"
                />
                <Text style={styles.unitSuffix}>Acres</Text>
              </View>
            </View>

            {/* Irrigation Type */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Irrigation Type</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setIrrigationPickerOpen(true)}
                activeOpacity={0.8}
              >
                <View style={styles.selectLeft}>
                  <Ionicons name="water-outline" size={20} color={Colors.oliveGreen} style={styles.fieldIcon} />
                  <Text style={styles.selectValue}>
                    {irrigationType === 'Drip' ? 'Drip Irrigation' : irrigationType}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#444444" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Next Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.88}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.pureWhite} />
          </TouchableOpacity>
        </View>

        {/* Crop Picker Modal */}
        <Modal visible={cropPickerOpen} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setCropPickerOpen(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Crop</Text>
              {CROPS.map((crop) => (
                <TouchableOpacity
                  key={crop.id}
                  style={[
                    styles.modalItem,
                    cropType === crop.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setCropType(crop.id);
                    setCropPickerOpen(false);
                  }}
                >
                  <View>
                    <Text style={styles.modalItemText}>{crop.name}</Text>
                    <Text style={styles.modalItemSub}>{crop.localName}</Text>
                  </View>
                  {cropType === crop.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.oliveGreen} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Soil Picker Modal */}
        <Modal visible={soilPickerOpen} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSoilPickerOpen(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Soil Type</Text>
              {SOIL_TYPES.map((soil) => (
                <TouchableOpacity
                  key={soil.id}
                  style={[
                    styles.modalItem,
                    soilType === soil.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSoilType(soil.id);
                    setSoilPickerOpen(false);
                  }}
                >
                  <View>
                    <Text style={styles.modalItemText}>{soil.name}</Text>
                    <Text style={styles.modalItemSub}>{soil.localName}</Text>
                  </View>
                  {soilType === soil.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.oliveGreen} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Irrigation Picker Modal */}
        <Modal visible={irrigationPickerOpen} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIrrigationPickerOpen(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Irrigation Type</Text>
              {IRRIGATION_TYPES.map((irr) => (
                <TouchableOpacity
                  key={irr.id}
                  style={[
                    styles.modalItem,
                    irrigationType === irr.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setIrrigationType(irr.id);
                    setIrrigationPickerOpen(false);
                  }}
                >
                  <View>
                    <Text style={styles.modalItemText}>{irr.name}</Text>
                    <Text style={styles.modalItemSub}>{irr.efficiency}</Text>
                  </View>
                  {irrigationType === irr.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.oliveGreen} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E120C',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flexOne: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  titleSection: {
    marginBottom: Spacing.lg,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: Spacing.md,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  stepCircleActive: {
    backgroundColor: Colors.oliveGreen,
    borderColor: '#94B469',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D0C8B8',
  },
  stepNumActive: {
    color: Colors.pureWhite,
  },
  subtitle: {
    fontSize: Typography.fontSizes.sm,
    color: '#E0D8CB',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    gap: Spacing.md,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: '700',
    color: '#F4EFE6',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: Spacing.md,
    minHeight: 52,
    ...Shadows.card,
  },
  fieldIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    color: '#1A1D16',
    fontWeight: '600',
    paddingVertical: Spacing.sm,
  },
  unitSuffix: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: '700',
    color: '#4A5243',
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: Spacing.md,
    minHeight: 52,
    ...Shadows.card,
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectValue: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: '#1A1D16',
  },
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(12, 16, 10, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.14)',
  },
  nextButton: {
    height: 52,
    backgroundColor: Colors.oliveGreen,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  nextButtonText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.pureWhite,
    letterSpacing: 0.3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.warmIvory,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
    ...Shadows.elevated,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: Spacing.md,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  modalItemSelected: {
    backgroundColor: Colors.softCream,
  },
  modalItemText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  modalItemSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
    marginTop: 2,
  },
});
