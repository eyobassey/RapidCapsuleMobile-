import React, { useRef, useState } from 'react';
import { View, TextInput as RNTextInput } from 'react-native';
import { TextInput } from './TextInput';

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
}

export default function OtpInput({ length = 6, onComplete }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(RNTextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newValues = [...values];
    newValues[index] = text;
    setValues(newValues);

    if (text && index < length - 1) {
      refs.current[index + 1]?.focus();
    }

    if (newValues.every((v) => v !== '')) {
      onComplete(newValues.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View className="flex-row gap-2 justify-center">
      {values.map((val, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={val}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          maxLength={1}
          keyboardType="number-pad"
          className="w-12 h-14 bg-card border border-border rounded-xl text-center text-xl font-bold text-foreground"
          placeholderTextColor="#7c8ba3"
          selectTextOnFocus
        />
      ))}
    </View>
  );
}
