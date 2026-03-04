import React from 'react';
import {View} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {colors} from '../../theme/colors';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}

export default function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color = colors.primary,
  bgColor = colors.border,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <View style={{width: size, height: size}} className="items-center justify-center">
      <Svg
        width={size}
        height={size}
        style={{transform: [{rotate: '-90deg'}]}}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>

      {children ? (
        <View
          style={{position: 'absolute'}}
          className="items-center justify-center">
          {children}
        </View>
      ) : null}
    </View>
  );
}
