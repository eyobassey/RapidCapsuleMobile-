import React, { forwardRef } from 'react';
import { TextInput as RNTextInput, type TextInputProps as RNTextInputProps } from 'react-native';
import { getFontFamily, getFontStyle, type FontWeight } from '../../config/fonts';

const defaultFontStyle = { fontFamily: getFontFamily('regular') };

type InputVariant = 'body' | 'label';

type AppTextInputProps = RNTextInputProps & {
  /**
   * Semantic variant for input text. Optional and non-breaking.
   */
  variant?: InputVariant;
  /**
   * Logical weight mapped via config/fonts. Optional.
   */
  weight?: FontWeight;
};

const INPUT_VARIANT_DEFAULT_WEIGHT: Record<InputVariant, FontWeight> = {
  body: 'regular',
  label: 'medium',
};

function getVariantFontStyle(variant?: InputVariant, weightOverride?: FontWeight) {
  if (!variant && !weightOverride) {
    return null;
  }

  const weight = weightOverride ?? INPUT_VARIANT_DEFAULT_WEIGHT[variant ?? 'body'];
  return getFontStyle(weight);
}

/**
 * TextInput with platform-specific default font (ui-rounded on iOS, Open Runde on Android).
 * Use as drop-in replacement for React Native's TextInput.
 *
 * New props:
 * - variant: semantic input variants (body, label)
 * - weight: logical weight mapped via config/fonts
 *
 * Both are optional so existing usage and layout remain unchanged.
 */
export const TextInput = forwardRef<RNTextInput, AppTextInputProps>(function TextInput(
  { style, variant, weight, ...props },
  ref
) {
  const variantStyle = getVariantFontStyle(variant, weight);
  return <RNTextInput ref={ref} style={[defaultFontStyle, variantStyle, style]} {...props} />;
});
