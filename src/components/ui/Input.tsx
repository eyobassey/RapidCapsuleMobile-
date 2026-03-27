import React, { forwardRef, useState } from 'react';
import {
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from 'react-native';
import { Text } from './Text';
import { TextInput } from './TextInput';
import { colors } from '../../theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

const INPUT_HEIGHT = 56; // h-14 = 3.5rem = 56px

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

  const borderColor = error ? colors.destructive : focused ? colors.primary : colors.border;

  return (
    <View className={containerClassName}>
      {label && (
        <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2 ml-1">
          {label}
          {required && <Text className="text-destructive"> *</Text>}
        </Text>
      )}
      <View
        className={`rounded-2xl bg-card ${className || ''}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: INPUT_HEIGHT,
          borderWidth: 1,
          borderColor,
        }}
      >
        {icon && (
          <View
            style={{
              paddingLeft: 16,
              height: INPUT_HEIGHT,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </View>
        )}
        <TextInput
          ref={ref}
          style={{
            flex: 1,
            height: INPUT_HEIGHT,
            paddingLeft: icon ? 12 : 16,
            paddingRight: rightIcon ? 12 : 16,
            paddingVertical: 0,
            color: colors.foreground,
          }}
          placeholderTextColor="#7c8ba3"
          textAlignVertical="center"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityRole="text"
          accessibilityLabel={derivedAccessibilityLabel}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity
            style={{
              paddingRight: 16,
              height: INPUT_HEIGHT,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-xs text-destructive mt-1 ml-1">{error}</Text>}
    </View>
  );
});

export default Input;
