import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Text } from './Text';

interface HealthGaugeProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
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
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - strokeWidth) / 2;

  // Semicircle arc from 180° to 0° (bottom-left to bottom-right, going over the top)
  const startAngle = 135; // degrees
  const endAngle = 405; // degrees (135 + 270)
  const sweep = 270; // total arc sweep

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // Background arc path (full 270° sweep)
  const bgStartX = cx + radius * Math.cos(toRad(startAngle));
  const bgStartY = cy + radius * Math.sin(toRad(startAngle));
  const bgEndX = cx + radius * Math.cos(toRad(endAngle));
  const bgEndY = cy + radius * Math.sin(toRad(endAngle));

  const bgPath = `M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 1 1 ${bgEndX} ${bgEndY}`;

  // Progress arc path
  const progressAngle = startAngle + (clamped / 100) * sweep;
  const progEndX = cx + radius * Math.cos(toRad(progressAngle));
  const progEndY = cy + radius * Math.sin(toRad(progressAngle));
  const largeArc = (clamped / 100) * sweep > 180 ? 1 : 0;

  const progressPath = `M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 ${largeArc} 1 ${progEndX} ${progEndY}`;

  // Needle indicator dot position
  const dotX = cx + radius * Math.cos(toRad(progressAngle));
  const dotY = cy + radius * Math.sin(toRad(progressAngle));

  const scoreColor = getScoreColor(clamped);

  return (
    <View
      style={{ width: size, height: size * 0.75, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size * 0.75} viewBox={`0 ${size * 0.12} ${size} ${size * 0.76}`}>
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
      <View style={{ position: 'absolute', bottom: 0, alignItems: 'center' }}>
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
