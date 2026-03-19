import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Line, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Text } from './Text';

interface HealthGaugeProps {
  score: number; // 0-100
  size?: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#22c55e';
  if (score >= 40) return '#f59e0b';
  return '#f43f5e';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Attention';
}

// Returns a color for each tick based on its position (0-1)
function getTickColor(position: number): string {
  if (position < 0.3) return '#f43f5e';
  if (position < 0.5) return '#f59e0b';
  if (position < 0.7) return '#22c55e';
  return '#10b981';
}

export default function HealthGauge({ score, size = 130 }: HealthGaugeProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size / 2 - 8;
  const innerRadius = outerRadius - 14;
  const tickCount = 40;

  const startAngle = 135;
  const sweep = 270;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const progressRatio = clamped / 100;
  const scoreColor = getScoreColor(clamped);

  // Generate tick marks
  const ticks = [];
  for (let i = 0; i <= tickCount; i++) {
    const ratio = i / tickCount;
    const angle = startAngle + ratio * sweep;
    const rad = toRad(angle);

    const isActive = ratio <= progressRatio;
    const isMajor = i % 5 === 0;
    const tickInner = isMajor ? innerRadius - 2 : innerRadius + 2;
    const tickOuter = outerRadius;

    const x1 = cx + tickInner * Math.cos(rad);
    const y1 = cy + tickInner * Math.sin(rad);
    const x2 = cx + tickOuter * Math.cos(rad);
    const y2 = cy + tickOuter * Math.sin(rad);

    const tickColor = isActive ? getTickColor(ratio) : 'rgba(255,255,255,0.1)';

    ticks.push(
      <Line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={tickColor}
        strokeWidth={isMajor ? 3 : 2}
        strokeLinecap="round"
        opacity={isActive ? 1 : 0.4}
      />
    );
  }

  // Glow arc path (thin arc behind the ticks for the glow effect)
  const glowRadius = (outerRadius + innerRadius) / 2;
  const glowEndAngle = startAngle + progressRatio * sweep;
  const glowStartX = cx + glowRadius * Math.cos(toRad(startAngle));
  const glowStartY = cy + glowRadius * Math.sin(toRad(startAngle));
  const glowEndX = cx + glowRadius * Math.cos(toRad(glowEndAngle));
  const glowEndY = cy + glowRadius * Math.sin(toRad(glowEndAngle));
  const glowLargeArc = progressRatio * sweep > 180 ? 1 : 0;
  const glowPath = `M ${glowStartX} ${glowStartY} A ${glowRadius} ${glowRadius} 0 ${glowLargeArc} 1 ${glowEndX} ${glowEndY}`;

  // Indicator dot at current score position
  const dotAngle = toRad(startAngle + progressRatio * sweep);
  const dotRadius = outerRadius + 4;
  const dotX = cx + dotRadius * Math.cos(dotAngle);
  const dotY = cy + dotRadius * Math.sin(dotAngle);

  // Trim height: bottom of arc endpoints
  const bottomY = cy + outerRadius * Math.sin(toRad(135)) + 12;

  return (
    <View style={{ width: size, height: bottomY, alignItems: 'center' }}>
      <Svg width={size} height={bottomY} viewBox={`0 0 ${size} ${bottomY}`}>
        <Defs>
          <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={scoreColor} stopOpacity="0.35" />
            <Stop offset="1" stopColor={scoreColor} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Subtle glow behind the arc */}
        <Path
          d={glowPath}
          stroke={scoreColor}
          strokeWidth={20}
          fill="none"
          strokeLinecap="round"
          opacity={0.15}
        />

        {/* Tick marks */}
        {ticks}

        {/* Indicator dot */}
        <Circle cx={dotX} cy={dotY} r={4} fill={scoreColor} />
        <Circle cx={dotX} cy={dotY} r={6} fill={scoreColor} opacity={0.3} />
      </Svg>

      {/* Score number + label */}
      <View style={{ position: 'absolute', bottom: 2, left: 0, right: 0, alignItems: 'center' }}>
        <Text className="text-3xl font-bold text-foreground leading-none">{clamped}</Text>
        <Text
          className="text-[8px] font-semibold uppercase tracking-widest mt-1"
          style={{ color: scoreColor, opacity: 0.9 }}
        >
          Health Score
        </Text>
      </View>
    </View>
  );
}
