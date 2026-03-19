import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Text } from './Text';

interface HealthGaugeProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981'; // emerald/success
  if (score >= 60) return '#0ea5e9'; // sky/primary
  if (score >= 40) return '#f59e0b'; // amber
  return '#f43f5e'; // rose/destructive
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Attention';
}

export default function HealthGauge({ score, size = 120, strokeWidth = 10 }: HealthGaugeProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const padding = strokeWidth + 4; // extra space for indicator dot
  const svgSize = size + padding * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const radius = size / 2 - strokeWidth / 2;

  const startAngle = 135;
  const sweep = 270;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // Arc endpoints
  const startX = cx + radius * Math.cos(toRad(startAngle));
  const startY = cy + radius * Math.sin(toRad(startAngle));
  const endAngle = startAngle + sweep;
  const endX = cx + radius * Math.cos(toRad(endAngle));
  const endY = cy + radius * Math.sin(toRad(endAngle));

  const bgPath = `M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${endX} ${endY}`;

  // Progress arc
  const progressAngle = startAngle + (clamped / 100) * sweep;
  const progEndX = cx + radius * Math.cos(toRad(progressAngle));
  const progEndY = cy + radius * Math.sin(toRad(progressAngle));
  const largeArc = (clamped / 100) * sweep > 180 ? 1 : 0;
  const progressPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${progEndX} ${progEndY}`;

  // Indicator dot
  const dotX = cx + radius * Math.cos(toRad(progressAngle));
  const dotY = cy + radius * Math.sin(toRad(progressAngle));

  const scoreColor = getScoreColor(clamped);

  // Trim bottom gap: the arc ends at 135° from bottom-left and 45° from bottom-right
  // The lowest point of the arc endpoints is at y = cy + radius * sin(135°) ≈ cy + radius * 0.707
  const bottomY = cy + radius * Math.sin(toRad(135)) + padding;
  const viewHeight = bottomY;

  return (
    <View
      style={{
        width: svgSize,
        height: viewHeight,
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <Svg width={svgSize} height={viewHeight} viewBox={`0 0 ${svgSize} ${viewHeight}`}>
        <Defs>
          <LinearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#f43f5e" />
            <Stop offset="0.35" stopColor="#f59e0b" />
            <Stop offset="0.65" stopColor="#0ea5e9" />
            <Stop offset="1" stopColor="#10b981" />
          </LinearGradient>
        </Defs>

        {/* Background arc */}
        <Path
          d={bgPath}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Gradient progress arc */}
        <Path
          d={progressPath}
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Indicator dot */}
        <Circle cx={dotX} cy={dotY} r={strokeWidth / 2 + 2} fill={scoreColor} />
        <Circle
          cx={dotX}
          cy={dotY}
          r={strokeWidth / 2 - 1}
          fill={scoreColor}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={1}
        />
      </Svg>

      {/* Score text centered inside the gauge */}
      <View style={{ position: 'absolute', bottom: 4, left: 0, right: 0, alignItems: 'center' }}>
        <Text className="text-3xl font-bold text-foreground leading-none">{clamped}</Text>
        <Text
          className="text-[9px] font-bold uppercase tracking-widest mt-0.5"
          style={{ color: scoreColor }}
        >
          {getScoreLabel(clamped)}
        </Text>
      </View>
    </View>
  );
}
