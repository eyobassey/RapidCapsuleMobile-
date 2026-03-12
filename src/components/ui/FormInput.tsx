import React from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import type { TextInputProps } from 'react-native';
import Input from './Input';

interface FormInputProps<T extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export default function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  required,
  error,
  icon,
  rightIcon,
  containerClassName,
  ...props
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <Input
          label={label}
          required={required}
          error={error}
          icon={icon}
          rightIcon={rightIcon}
          containerClassName={containerClassName}
          onBlur={onBlur}
          onChangeText={onChange}
          value={typeof value === 'string' ? value : value?.toString() ?? ''}
          {...props}
        />
      )}
    />
  );
}
