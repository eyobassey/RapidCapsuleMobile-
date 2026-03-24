import { TrendingUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Path, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { Text } from '../ui/Text';

interface LineChartProps {
  data: Array<{ date: string; value: number }>;
  color?: string;
  height?: number;
  label?: string;
  range?: { min: number; max: number };
  formatLabel?: (date: string) => string;
}

function defaultFormatLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function LineChart({
  data,
  color = colors.primary,
  height = 160,
  label,
  range,
  formatLabel = defaultFormatLabel,
}: LineChartProps) {
  const [containerWidth, setContainerWidth] = useState(300);

  if (!data || data.length === 0) {
    return (
      <View
        style={{
          height,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${colors.muted}30`,
          borderRadius: 16,
        }}
      >
        <TrendingUp size={28} color={colors.mutedForeground} />
        <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 6 }}>
          {label ? `No ${label.toLowerCase()} data yet` : 'No chart data available'}
        </Text>
      </View>
    );
  }

  const paddingX = 36;
  const paddingY = 24;
  const chartWidth = containerWidth - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const values = data.map((d) => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const minVal = range ? Math.min(range.min, dataMin) : dataMin;
  const maxVal = range ? Math.max(range.max, dataMax) : dataMax;
  const valRange = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: paddingX + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: paddingY + chartHeight - ((d.value - minVal) / valRange) * chartHeight,
  }));

  let pathD = '';
  points.forEach((p, i) => {
    if (i === 0) pathD += `M ${p.x} ${p.y}`;
    else pathD += ` L ${p.x} ${p.y}`;
  });

  // Gradient fill area
  const lastPoint = points[points.length - 1]!;
  const firstPoint = points[0]!;
  const areaD =
    pathD +
    ` L ${lastPoint.x} ${paddingY + chartHeight}` +
    ` L ${firstPoint.x} ${paddingY + chartHeight} Z`;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 12,
        overflow: 'hidden',
      }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width - 24)}
    >
      {label && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: colors.foreground,
            marginBottom: 8,
          }}
        >
          {label}
        </Text>
      )}
      <Svg width={containerWidth} height={height}>
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = paddingY + chartHeight * (1 - frac);
          return (
            <Line
              key={frac}
              x1={paddingX}
              y1={y}
              x2={paddingX + chartWidth}
              y2={y}
              stroke={colors.border}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Area fill */}
        <Path d={areaD} fill={`${color}12`} />

        {/* Data line */}
        <Path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <SvgCircle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={color}
            stroke={colors.card}
            strokeWidth={1.5}
          />
        ))}

        {/* Y-axis labels */}
        <SvgText
          x={paddingX - 6}
          y={paddingY + 4}
          fontSize={9}
          fill={colors.mutedForeground}
          textAnchor="end"
        >
          {Math.round(maxVal)}
        </SvgText>
        <SvgText
          x={paddingX - 6}
          y={paddingY + chartHeight + 4}
          fontSize={9}
          fill={colors.mutedForeground}
          textAnchor="end"
        >
          {Math.round(minVal)}
        </SvgText>

        {/* X-axis labels (first, middle, last) */}
        {data.length > 0 && (
          <>
            <SvgText
              x={paddingX}
              y={height - 4}
              fontSize={9}
              fill={colors.mutedForeground}
              textAnchor="start"
            >
              {formatLabel(data[0]!.date)}
            </SvgText>
            {data.length > 2 && (
              <SvgText
                x={paddingX + chartWidth / 2}
                y={height - 4}
                fontSize={9}
                fill={colors.mutedForeground}
                textAnchor="middle"
              >
                {formatLabel(data[Math.floor(data.length / 2)]!.date)}
              </SvgText>
            )}
            <SvgText
              x={paddingX + chartWidth}
              y={height - 4}
              fontSize={9}
              fill={colors.mutedForeground}
              textAnchor="end"
            >
              {formatLabel(data[data.length - 1]!.date)}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}
