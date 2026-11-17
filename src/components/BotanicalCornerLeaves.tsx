import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { Colors } from '../constants/theme';

export const BotanicalCornerLeaves: React.FC<{ size?: number }> = ({ size = 110 }) => {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G fill={Colors.oliveGreen} opacity={0.88}>
          {/* Main Leaf 1 */}
          <Path
            d="M100,0 C75,10 60,35 65,60 C75,45 88,30 100,0 Z"
            fill={Colors.deepOlive}
          />
          {/* Leaf 2 */}
          <Path
            d="M100,20 C80,30 70,55 80,75 C88,58 95,40 100,20 Z"
            fill={Colors.oliveGreen}
          />
          {/* Leaf 3 */}
          <Path
            d="M85,0 C65,15 50,40 55,60 C65,45 78,25 85,0 Z"
            fill={Colors.sageGreen}
          />
          {/* Small Accent Leaf */}
          <Path
            d="M100,45 C88,52 82,68 88,80 C95,68 98,58 100,45 Z"
            fill={Colors.lightSage}
          />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
});
