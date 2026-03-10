/**
 * Platform-specific font configuration
 * iOS: ui-rounded (SF Pro Rounded) — system font
 * Android: Open Runde — custom font from assets/fonts
 */
import { Platform } from 'react-native';

export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

const FONT_FAMILIES = {
  ios: {
    regular: 'ui-rounded',
    medium: 'ui-rounded',
    semibold: 'ui-rounded',
    bold: 'ui-rounded',
  },
  android: {
    regular: 'OpenRunde-Regular',
    medium: 'OpenRunde-Medium',
    semibold: 'OpenRunde-SemiBold',
    bold: 'OpenRunde-Bold',
  },
} as const;

const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Get the platform-specific font family for the given weight.
 * Use this for inline styles or when Tailwind font classes aren't sufficient.
 */
export function getFontFamily(weight: FontWeight = 'regular'): string {
  const families = Platform.OS === 'ios' ? FONT_FAMILIES.ios : FONT_FAMILIES.android;
  return families[weight];
}

/**
 * Get font family and weight for StyleSheet usage.
 * On iOS, ui-rounded uses fontWeight; on Android, each weight is a separate font file.
 */
export function getFontStyle(weight: FontWeight = 'regular') {
  const fontFamily = getFontFamily(weight);
  return Platform.OS === 'ios' ? { fontFamily, fontWeight: FONT_WEIGHTS[weight] } : { fontFamily };
}

export { FONT_FAMILIES, FONT_WEIGHTS };
