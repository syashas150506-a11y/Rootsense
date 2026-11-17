import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Line, Text as SvgText, G, Path } from 'react-native-svg';
import { Colors } from '../constants/theme';

export const ESP32DeviceGraphic: React.FC<{ size?: number }> = ({ size = 220 }) => {
  return (
    <View style={[styles.container, { width: size, height: size * 0.75 }]}>
      <Svg width={size} height={size * 0.75} viewBox="0 0 240 180">
        {/* Shadow */}
        <Rect
          x="24"
          y="44"
          width="76"
          height="112"
          rx="8"
          fill="rgba(0,0,0,0.08)"
        />
        <Rect
          x="134"
          y="54"
          width="82"
          height="112"
          rx="6"
          fill="rgba(0,0,0,0.08)"
        />

        {/* --- ESP32 Board --- */}
        <Rect
          x="20"
          y="40"
          width="74"
          height="108"
          rx="6"
          fill="#1E232A"
          stroke="#38434F"
          strokeWidth="1.5"
        />
        {/* Metal Shield */}
        <Rect
          x="30"
          y="54"
          width="54"
          height="42"
          rx="3"
          fill="#D6DBDF"
          stroke="#95A5A6"
          strokeWidth="1"
        />
        <SvgText
          x="57"
          y="77"
          fill="#2C3E50"
          fontSize="9"
          fontWeight="bold"
          textAnchor="middle"
        >
          ESP32-WROOM
        </SvgText>
        <SvgText
          x="57"
          y="88"
          fill="#7F8C8D"
          fontSize="6"
          textAnchor="middle"
        >
          Wi-Fi + BLE
        </SvgText>

        {/* Micro-USB Port */}
        <Rect x="47" y="36" width="20" height="7" rx="1.5" fill="#A6ACAF" />

        {/* Pin Headers */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <React.Fragment key={i}>
            <Circle cx="25" cy={56 + i * 11} r="2.2" fill="#F4D03F" />
            <Circle cx="89" cy={56 + i * 11} r="2.2" fill="#F4D03F" />
          </React.Fragment>
        ))}

        {/* Status LEDs */}
        <Circle cx="36" cy="136" r="2.5" fill="#E74C3C" />
        <Circle cx="78" cy="136" r="2.5" fill="#2ECC71" />

        {/* --- Connecting Wires --- */}
        <Line x1="90" y1="67" x2="135" y2="75" stroke="#E74C3C" strokeWidth="2.5" strokeLinecap="round" />
        <Line x1="90" y1="78" x2="135" y2="85" stroke="#2C3E50" strokeWidth="2.5" strokeLinecap="round" />
        <Line x1="90" y1="89" x2="135" y2="95" stroke="#3498DB" strokeWidth="2.5" strokeLinecap="round" />

        {/* --- Capacitive Soil Moisture Sensor v1.2 --- */}
        <G transform="translate(130, 48)">
          {/* Top Electronics Head */}
          <Rect x="0" y="0" width="80" height="38" rx="4" fill="#1C2833" />
          {/* 3-pin JST Connector */}
          <Rect x="2" y="10" width="12" height="18" rx="2" fill="#FFFFFF" />
          {/* Voltage Regulator & 555 Timer IC */}
          <Rect x="26" y="12" width="16" height="14" rx="2" fill="#2C3E50" />
          <Circle cx="30" cy="16" r="1" fill="#7F8C8D" />
          <Rect x="48" y="15" width="8" height="8" rx="1" fill="#7F8C8D" />
          <SvgText x="58" y="27" fill="#F4D03F" fontSize="6">V1.2</SvgText>

          {/* Capacitive Dual Fork Probes */}
          <Path
            d="M 12,38 L 12,112 C 12,116 28,116 28,112 L 28,38 Z"
            fill="#212F3D"
            stroke="#1C2833"
            strokeWidth="1"
          />
          <Path
            d="M 52,38 L 52,112 C 52,116 68,116 68,112 L 68,38 Z"
            fill="#212F3D"
            stroke="#1C2833"
            strokeWidth="1"
          />
          {/* Exposed Copper Sensing Traces */}
          <Line x1="20" y1="46" x2="20" y2="104" stroke="#D4AC0D" strokeWidth="3" strokeLinecap="round" />
          <Line x1="60" y1="46" x2="60" y2="104" stroke="#D4AC0D" strokeWidth="3" strokeLinecap="round" />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
