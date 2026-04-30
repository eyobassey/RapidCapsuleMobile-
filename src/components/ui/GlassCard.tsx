import { GlassContainer, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import React from 'react';
import { Platform, View, type ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  /** Override padding; defaults to 'p-5' */
  padding?: string;
}

const glassAvailable = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

/**
 * On iOS 26+ renders a native Liquid Glass container.
 * Falls back to the standard dark card on older iOS and Android.
 */
export default function GlassCard({
  children,
  className,
  padding = 'p-5',
  style,
  ...props
}: GlassCardProps) {
  if (glassAvailable) {
    return (
      <GlassContainer
        style={[{ borderRadius: 24, overflow: 'hidden' }, style]}
        {...(props as object)}
      >
        {children}
      </GlassContainer>
    );
  }

  return (
    <View
      className={`bg-card border border-border rounded-3xl ${padding} overflow-hidden ${
        className ?? ''
      }`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
