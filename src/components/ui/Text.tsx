import React, { forwardRef } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { getFontFamily, getFontStyle, type FontWeight } from '../../config/fonts';

const defaultFontStyle = { fontFamily: getFontFamily('regular') };

type TextVariant = 'body' | 'label' | 'caption' | 'heading' | 'title';

type AppTextProps = RNTextProps & {
  /**
   * Semantic text style. Optional and non-breaking:
   * if omitted, behavior is identical to plain React Native Text today.
   */
  variant?: TextVariant;
  /**
   * Font weight abstraction that maps through our font config.
   * If provided, this takes precedence over the variant's default weight.
   */
  weight?: FontWeight;
};

const VARIANT_DEFAULT_WEIGHT: Record<TextVariant, FontWeight> = {
  body: 'regular',
  label: 'medium',
  caption: 'regular',
  heading: 'semibold',
  title: 'bold',
};

function getVariantFontStyle(variant?: TextVariant, weightOverride?: FontWeight) {
  if (!variant && !weightOverride) {
    return null;
  }

  const weight = weightOverride ?? VARIANT_DEFAULT_WEIGHT[variant ?? 'body'];
  return getFontStyle(weight);
}

/**
 * Text with platform-specific default font (ui-rounded on iOS, Open Runde on Android).
 * Use as drop-in replacement for React Native's Text.
 *
 * New props:
 * - variant: semantic text variants (body, heading, etc.)
 * - weight: logical weight mapped via config/fonts
 *
 * Both are optional so existing usage and layout remain unchanged.
 */
export const Text = forwardRef<RNText, AppTextProps>(function Text(
  { style, variant, weight, ...props },
  ref
) {
  const variantStyle = getVariantFontStyle(variant, weight);
  return <RNText ref={ref} style={[defaultFontStyle, variantStyle, style]} {...props} />;
});
