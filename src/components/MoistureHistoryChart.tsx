import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Line } from 'react-native-svg';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

interface HistoryChartProps {
  data?: number[];
  days?: string[];
}

export const MoistureHistoryChart: React.FC<HistoryChartProps> = ({
  data = [35, 38, 36, 42, 40, 39, 38.5],
  days = ['10', '11', '12', '13', '14', '15', '16'],
}) => {
  const chartWidth = Math.min(width - 64, 340);
  const chartHeight = 120;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 12;
  const paddingBottom = 24;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const minY = 20;
  const maxY = 50;

  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    const ratio = (clamped - minY) / (maxY - minY);
    return paddingTop + innerHeight * (1 - ratio);
  };

  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1)) * innerWidth;
  };

  // Build SVG path
  let pathD = '';
  let areaD = '';

  data.forEach((val, i) => {
    const x = getX(i);
    const y = getY(val);
    if (i === 0) {
      pathD = `M ${x} ${y}`;
      areaD = `M ${x} ${paddingTop + innerHeight} L ${x} ${y}`;
    } else {
      // Bezier curve smoothing
      const prevX = getX(i - 1);
      const prevY = getY(data[i - 1]);
      const cp1x = prevX + (x - prevX) / 2;
      const cp1y = prevY;
      const cp2x = prevX + (x - prevX) / 2;
      const cp2y = y;
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
      areaD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
    }
  });

  const lastX = getX(data.length - 1);
  areaD += ` L ${lastX} ${paddingTop + innerHeight} Z`;

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.title}>Moisture History (7 Days)</Text>

      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <SvgGradient id="chartAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={Colors.oliveGreen} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={Colors.oliveGreen} stopOpacity={0.0} />
          </SvgGradient>
        </Defs>

        {/* Horizontal grid lines */}
        {[50, 40, 30, 20].map((val) => {
          const y = getY(val);
          return (
            <React.Fragment key={val}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={paddingLeft + innerWidth}
                y2={y}
                stroke={Colors.sandBeige}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            </React.Fragment>
          );
        })}

        {/* Area fill */}
        <Path d={areaD} fill="url(#chartAreaGrad)" />

        {/* Line curve */}
        <Path
          d={pathD}
          fill="none"
          stroke={Colors.oliveGreen}
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Data points */}
        {data.map((val, i) => (
          <Circle
            key={i}
            cx={getX(i)}
            cy={getY(val)}
            r={i === data.length - 1 ? 4.5 : 3}
            fill={i === data.length - 1 ? Colors.oliveGreen : Colors.pureWhite}
            stroke={Colors.oliveGreen}
            strokeWidth={2}
          />
        ))}
      </Svg>

      {/* Y Axis labels */}
      <View style={styles.yAxisLabels}>
        <Text style={[styles.axisText, { top: getY(50) - 8 }]}>50%</Text>
        <Text style={[styles.axisText, { top: getY(40) - 8 }]}>40%</Text>
        <Text style={[styles.axisText, { top: getY(30) - 8 }]}>30%</Text>
        <Text style={[styles.axisText, { top: getY(20) - 8 }]}>20%</Text>
      </View>

      {/* X Axis days */}
      <View style={[styles.xAxisDays, { paddingLeft }]}>
        <Text style={styles.monthPrefix}>Nov</Text>
        {days.map((day, idx) => (
          <Text key={idx} style={styles.dayText}>
            {day}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: Spacing.xs,
  },
  yAxisLabels: {
    position: 'absolute',
    left: Spacing.md,
    top: Spacing.md + 14,
    height: 90,
  },
  axisText: {
    position: 'absolute',
    fontSize: 9,
    color: Colors.mutedGrey,
  },
  xAxisDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 14,
    marginTop: 2,
  },
  monthPrefix: {
    fontSize: 10,
    color: Colors.mutedGrey,
    fontWeight: '600',
    marginRight: 4,
  },
  dayText: {
    fontSize: 10,
    color: Colors.mutedGrey,
  },
});
