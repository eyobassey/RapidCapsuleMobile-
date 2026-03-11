import React, { forwardRef } from 'react';
import { TextInput as RNTextInput, type TextInputProps } from 'react-native';
import { getFontFamily } from '../../config/fonts';

const defaultFontStyle = { fontFamily: getFontFamily('regular') };

/**
 * TextInput with platform-specific default font (ui-rounded on iOS, Open Runde on Android).
 * Use as drop-in replacement for React Native's TextInput.
 */
export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { style, ...props },
  ref
) {
  return <RNTextInput ref={ref} style={[defaultFontStyle, style]} {...props} />;
});
