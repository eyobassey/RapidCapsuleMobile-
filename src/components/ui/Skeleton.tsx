import React from 'react';
import {View, type DimensionValue} from 'react-native';

interface SkeletonProps {
  width?: number | DimensionValue;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export default function Skeleton({
  width,
  height = 16,
  borderRadius = 8,
  className,
}: SkeletonProps) {
  return (
    <View
      className={`bg-muted ${className || ''}`}
      style={{
        width: width ?? '100%',
        height,
        borderRadius,
      }}
    />
  );
}
