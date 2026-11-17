import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface SelectCardProps {
  title: string;
  subtitle?: string;
  localName?: string;
  description?: string;
  badgeText?: string;
  selected: boolean;
  onSelect: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const SelectCard: React.FC<SelectCardProps> = ({
  title,
  subtitle,
  localName,
  description,
  badgeText,
  selected,
  onSelect,
  iconName,
}) => {
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.8}
      style={[
        styles.container,
        selected ? styles.selectedContainer : styles.unselectedContainer,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          <View
            style={[
              styles.iconWrapper,
              selected ? styles.selectedIconWrapper : styles.unselectedIconWrapper,
            ]}
          >
            <Ionicons
              name={iconName || (selected ? 'checkmark-circle' : 'radio-button-off')}
              size={20}
              color={selected ? Colors.oliveGreen : Colors.mutedGrey}
            />
          </View>
          <View style={styles.titleColumn}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  selected && styles.selectedTitle,
                ]}
              >
                {title}
              </Text>
              {localName && (
                <Text style={styles.localName}>({localName})</Text>
              )}
            </View>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>

        <View
          style={[
            styles.checkCircle,
            selected ? styles.selectedCheckCircle : styles.unselectedCheckCircle,
          ]}
        >
          {selected && (
            <Ionicons name="checkmark" size={14} color={Colors.pureWhite} />
          )}
        </View>
      </View>

      {description && (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      )}

      {badgeText && (
        <View style={styles.badgeWrapper}>
          <View
            style={[
              styles.badge,
              selected ? styles.selectedBadge : styles.unselectedBadge,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                selected && styles.selectedBadgeText,
              ]}
            >
              {badgeText}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.xs + 2,
    borderWidth: 1.5,
    ...Shadows.soft,
  },
  selectedContainer: {
    backgroundColor: '#F7F3E7',
    borderColor: Colors.oliveGreen,
  },
  unselectedContainer: {
    backgroundColor: Colors.pureWhite,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  selectedIconWrapper: {
    backgroundColor: Colors.palePeach,
  },
  unselectedIconWrapper: {
    backgroundColor: Colors.warmIvory,
  },
  titleColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  selectedTitle: {
    color: Colors.deepOlive,
  },
  localName: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.sageGreen,
    marginLeft: 6,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  selectedCheckCircle: {
    backgroundColor: Colors.oliveGreen,
    borderColor: Colors.oliveGreen,
  },
  unselectedCheckCircle: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
  },
  description: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: Spacing.sm,
    marginLeft: 48,
  },
  badgeWrapper: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    marginLeft: 48,
  },
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  selectedBadge: {
    backgroundColor: Colors.lightSage,
  },
  unselectedBadge: {
    backgroundColor: Colors.softCream,
  },
  badgeText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: '600',
    color: Colors.deepOlive,
  },
  selectedBadgeText: {
    color: Colors.deepOlive,
  },
});
