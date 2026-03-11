import React, { useState, forwardRef } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput as RNTextInput,
  type TextInputProps,
} from 'react-native';
import { Text } from './Text';
import { TextInput } from './TextInput';

interface InputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

const Input = forwardRef<RNTextInput, InputProps>(function Input(
  {
    label,
    required,
    icon,
    rightIcon,
    error,
    containerClassName,
    className,
    accessibilityLabel,
    ...props
  },
  ref
) {
  const [focused, setFocused] = useState(false);

  const derivedAccessibilityLabel = accessibilityLabel || label;

  return (
    <View className={containerClassName}>
      {label && (
        <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2 ml-1">
          {label}
          {required && <Text className="text-destructive"> *</Text>}
        </Text>
      )}
      <View
        className={`flex-row items-center h-14 rounded-2xl bg-card border ${
          error ? 'border-destructive' : focused ? 'border-primary' : 'border-border'
        } ${className || ''}`}
      >
        {icon && <View className="pl-4">{icon}</View>}
        <TextInput
          ref={ref}
          className={`flex-1 text-foreground text-base px-4 h-full ${icon ? 'pl-3' : ''}`}
          placeholderTextColor="#7c8ba3"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityRole="text"
          accessibilityLabel={derivedAccessibilityLabel}
          {...props}
        />
        {rightIcon && <TouchableOpacity className="pr-4">{rightIcon}</TouchableOpacity>}
      </View>
      {error && <Text className="text-xs text-destructive mt-1 ml-1">{error}</Text>}
    </View>
  );
});

export default Input;
