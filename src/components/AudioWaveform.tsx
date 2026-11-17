import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/theme';

export const AudioWaveform: React.FC<{ isActive?: boolean }> = ({ isActive = true }) => {
  // 14 vertical bars of varied heights
  const bars = [14, 22, 10, 28, 36, 18, 42, 26, 32, 16, 24, 12, 20, 10];
  const animatedValues = useRef(bars.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    if (!isActive) return;

    const animations = animatedValues.map((anim, i) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.35 + Math.random() * 0.9,
            duration: 350 + (i % 4) * 120,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 350 + (i % 4) * 120,
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.parallel(animations).start();

    return () => {
      animations.forEach((a) => a.stop());
    };
  }, [isActive]);

  return (
    <View style={styles.container}>
      {bars.map((height, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height,
              transform: [{ scaleY: animatedValues[i] }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 48,
    paddingHorizontal: 8,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.oliveGreen,
  },
});
