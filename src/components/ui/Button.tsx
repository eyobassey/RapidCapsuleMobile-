import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'highContrast';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  loading?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, {container: string; text: string}> = {
  primary: {
    container: 'bg-primary shadow-lg',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-secondary shadow-lg',
    text: 'text-white',
  },
  outline: {
    container: 'bg-card border border-border',
    text: 'text-foreground',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-foreground',
  },
  highContrast: {
    container: 'bg-foreground shadow-xl',
    text: 'text-background',
  },
};

export default function Button({
  variant = 'primary',
  loading = false,
  children,
  icon,
  fullWidth = true,
  disabled,
  className,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const styles = variantStyles[variant];
  const opacity = disabled ? 'opacity-50' : '';
  const width = fullWidth ? 'w-full' : '';

  // Derive accessible label from children if not explicitly provided
  const derivedLabel =
    accessibilityLabel ||
    (typeof children === 'string' ? children : undefined);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={derivedLabel}
      accessibilityState={{disabled: !!(disabled || loading)}}
      className={`${width} rounded-2xl h-14 flex-row items-center justify-center ${styles.container} ${opacity} ${className || ''}`}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'highContrast' ? '#151c2c' : '#fff'} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={`text-base font-bold ${styles.text}`}>{children}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
