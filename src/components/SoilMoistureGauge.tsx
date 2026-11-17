import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop, G } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../constants/theme';

interface SoilMoistureGaugeProps {
  percentage: number;
  statusText?: string;
  size?: number;
}

export const SoilMoistureGauge: React.FC<SoilMoistureGaugeProps> = ({
  percentage = 38.5,
  statusText = 'Healthy',
  size = 180,
}) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Semicircle or 75% arc
  const arcPercentage = 0.75;
  const strokeDashoffset = circumference * (1 - (percentage / 100) * arcPercentage);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.goldenWheat} />
            <Stop offset="60%" stopColor={Colors.oliveGreen} />
            <Stop offset="100%" stopColor={Colors.deepOlive} />
          </SvgGradient>
        </Defs>

        {/* Background Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.sandBeige}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference * arcPercentage} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(135 ${size / 2} ${size / 2})`}
        />

        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference * arcPercentage} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(135 ${size / 2} ${size / 2})`}
        />

        {/* Center Illustration: Soil mound + Sprout */}
        <G transform={`translate(${size / 2 - 35}, ${size / 2 - 25}) scale(0.7)`}>
          {/* Soil Mound */}
          <Path
            d="M 5,65 Q 50,42 95,65 C 95,85 5,85 5,65 Z"
            fill="#8B5A2B"
          />
          <Path
            d="M 12,66 Q 50,48 88,66 C 88,78 12,78 12,66 Z"
            fill="#6E441F"
          />
          {/* Stem */}
          <Path
            d="M 50,55 Q 50,30 50,20"
            stroke={Colors.oliveGreen}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          {/* Left Leaf */}
          <Path
            d="M 50,30 C 35,28 28,15 48,15 C 50,22 50,28 50,30 Z"
            fill={Colors.oliveGreen}
          />
          {/* Right Leaf */}
          <Path
            d="M 50,25 C 65,22 72,10 52,10 C 50,18 50,22 50,25 Z"
            fill={Colors.deepOlive}
          />
          {/* Moisture droplets */}
          <Circle cx="28" cy="72" r="3" fill="#64B5F6" />
          <Circle cx="72" cy="72" r="3" fill="#64B5F6" />
          <Circle cx="50" cy="76" r="3.5" fill="#42A5F5" />
        </G>
      </Svg>

      {/* Floating Value Info */}
      <View style={styles.valueOverlay}>
        <Text style={styles.moistureLabel}>Soil Moisture</Text>
        <Text style={styles.moistureValue}>{percentage}%</Text>
        {statusText && (
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>{statusText}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: Spacing.md,
  },
  valueOverlay: {
    position: 'absolute',
    bottom: -22,
    alignItems: 'center',
  },
  moistureLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
    fontWeight: '600',
  },
  moistureValue: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: '800',
    color: Colors.charcoal,
    letterSpacing: -0.5,
  },
  badgePill: {
    backgroundColor: '#E8EFCF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 2,
    borderWidth: 1,
    borderColor: Colors.lightSage,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.deepOlive,
  },
});
