import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'cream' | 'white';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'cream',
}) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'white' ? styles.whiteCard : styles.creamCard,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Shadows.soft,
  },
  creamCard: {
    backgroundColor: Colors.softCream,
    borderColor: Colors.sandBeige,
  },
  whiteCard: {
    backgroundColor: Colors.pureWhite,
    borderColor: Colors.sandBeige,
  },
});
