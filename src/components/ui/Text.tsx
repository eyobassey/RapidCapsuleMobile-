import React, { forwardRef } from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import { getFontFamily } from '../../config/fonts';

const defaultFontStyle = { fontFamily: getFontFamily('regular') };

/**
 * Text with platform-specific default font (ui-rounded on iOS, Open Runde on Android).
 * Use as drop-in replacement for React Native's Text.
 */
export const Text = forwardRef<RNText, TextProps>(function Text({ style, ...props }, ref) {
  return <RNText ref={ref} style={[defaultFontStyle, style]} {...props} />;
});
