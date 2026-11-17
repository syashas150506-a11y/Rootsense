import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardTypeOptions,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { FieldUnit } from '../types/farm';

interface InputFieldProps {
  label: string;
  sublabel?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  iconName?: keyof typeof Ionicons.glyphMap;
  unitOptions?: FieldUnit[];
  selectedUnit?: FieldUnit;
  onSelectUnit?: (unit: FieldUnit) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  sublabel,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  iconName,
  unitOptions,
  selectedUnit,
  onSelectUnit,
  error,
  containerStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          Boolean(error) && styles.inputContainerError,
        ]}
      >
        {iconName && (
          <Ionicons
            name={iconName}
            size={20}
            color={isFocused ? Colors.oliveGreen : Colors.mutedGrey}
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color={Colors.mutedGrey} />
          </TouchableOpacity>
        )}
      </View>

      {unitOptions && onSelectUnit && selectedUnit && (
        <View style={styles.unitRow}>
          {unitOptions.map((unit) => {
            const isSelected = selectedUnit === unit;
            return (
              <TouchableOpacity
                key={unit}
                onPress={() => onSelectUnit(unit)}
                style={[
                  styles.unitPill,
                  isSelected && styles.unitPillSelected,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.unitText,
                    isSelected && styles.unitTextSelected,
                  ]}
                >
                  {unit}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs + 2,
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  sublabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pureWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
  },
  inputContainerFocused: {
    borderColor: Colors.oliveGreen,
    backgroundColor: '#FAF7F0',
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    color: Colors.charcoal,
    paddingVertical: Spacing.sm,
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
    marginTop: Spacing.sm,
  },
  unitPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.softCream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unitPillSelected: {
    backgroundColor: Colors.oliveGreen,
    borderColor: Colors.oliveGreen,
  },
  unitText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  unitTextSelected: {
    color: Colors.pureWhite,
  },
  errorText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
