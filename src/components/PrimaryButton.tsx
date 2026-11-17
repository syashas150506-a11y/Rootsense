import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  iconName,
  iconPosition = 'right',
  style,
  textStyle,
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  const containerStyles = [
    styles.base,
    isPrimary && styles.primaryBase,
    variant === 'secondary' && styles.secondaryBase,
    isOutline && styles.outlineBase,
    disabled && styles.disabledBase,
    style,
  ];

  const textStyles = [
    styles.baseText,
    isPrimary && styles.primaryText,
    variant === 'secondary' && styles.secondaryText,
    isOutline && styles.outlineText,
    disabled && styles.disabledText,
    textStyle,
  ];

  const iconColor = isPrimary
    ? Colors.pureWhite
    : isOutline
    ? Colors.oliveGreen
    : Colors.deepOlive;

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? Colors.pureWhite : Colors.oliveGreen}
        />
      ) : (
        <View style={styles.contentRow}>
          {iconName && iconPosition === 'left' && (
            <Ionicons
              name={iconName}
              size={18}
              color={iconColor}
              style={{ marginRight: Spacing.sm }}
            />
          )}
          <Text style={textStyles}>{title}</Text>
          {iconName && iconPosition === 'right' && (
            <Ionicons
              name={iconName}
              size={18}
              color={iconColor}
              style={{ marginLeft: Spacing.sm }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBase: {
    backgroundColor: Colors.primaryButton,
    ...Shadows.soft,
  },
  secondaryBase: {
    backgroundColor: Colors.softCream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outlineBase: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.oliveGreen,
  },
  disabledBase: {
    backgroundColor: '#E5DFD5',
    borderColor: '#D8D1C5',
    shadowOpacity: 0,
    elevation: 0,
  },
  baseText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  primaryText: {
    color: Colors.buttonText,
  },
  secondaryText: {
    color: Colors.charcoal,
  },
  outlineText: {
    color: Colors.oliveGreen,
  },
  disabledText: {
    color: '#9C988F',
  },
});
