import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { Colors } from '../constants/theme';

export const WheatStalkGraphic: React.FC<{ size?: number }> = ({ size = 95 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G transform="translate(10, 5)">
          {/* Main Stalk 1 */}
          <Path
            d="M 50,95 Q 52,50 56,15"
            stroke={Colors.goldenWheat}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Grains for Stalk 1 */}
          {[20, 32, 44, 56, 68].map((y, idx) => (
            <React.Fragment key={idx}>
              {/* Left grain */}
              <Path
                d={`M 54,${y} C 44,${y - 8} 42,${y - 14} 54,${y - 6} Z`}
                fill={Colors.goldenWheat}
              />
              {/* Right grain */}
              <Path
                d={`M 54,${y + 4} C 64,${y - 4} 66,${y - 10} 54,${y - 2} Z`}
                fill="#C9A86E"
              />
              {/* Awn beard hair */}
              <Path
                d={`M 46,${y - 12} L 36,${y - 22}`}
                stroke="#C9A86E"
                strokeWidth="1"
              />
              <Path
                d={`M 62,${y - 8} L 72,${y - 18}`}
                stroke="#C9A86E"
                strokeWidth="1"
              />
            </React.Fragment>
          ))}

          {/* Secondary Stalk 2 (bent slightly left) */}
          <Path
            d="M 38,95 Q 32,55 24,25"
            stroke="#C9A86E"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {[32, 45, 58].map((y, idx) => (
            <React.Fragment key={idx}>
              <Path
                d={`M 30,${y} C 20,${y - 6} 20,${y - 12} 30,${y - 5} Z`}
                fill="#DECA9E"
              />
              <Path
                d={`M 30,${y + 4} C 40,${y - 2} 40,${y - 8} 30,${y - 1} Z`}
                fill={Colors.goldenWheat}
              />
            </React.Fragment>
          ))}

          {/* Tertiary Stalk 3 (bent right) */}
          <Path
            d="M 60,95 Q 68,60 76,35"
            stroke="#C9A86E"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          {[42, 54, 66].map((y, idx) => (
            <React.Fragment key={idx}>
              <Path
                d={`M 68,${y} C 78,${y - 5} 78,${y - 10} 68,${y - 4} Z`}
                fill="#DECA9E"
              />
            </React.Fragment>
          ))}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
