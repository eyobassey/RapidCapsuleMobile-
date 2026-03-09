import React from 'react';
import {View, Text, Image} from 'react-native';
import {colors} from '../../theme/colors';
import {getInitials} from '../../utils/formatters';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  uri?: string | null;
  firstName?: string;
  lastName?: string;
  size?: AvatarSize;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: 12,
  md: 14,
  lg: 18,
};

export default function Avatar({
  uri,
  firstName = '',
  lastName = '',
  size = 'md',
}: AvatarProps) {
  const dimension = sizeMap[size];
  const initials = getInitials(firstName, lastName);

  const fullName = `${firstName} ${lastName}`.trim();
  const accessLabel = fullName || 'User avatar';

  if (uri) {
    return (
      <Image
        source={{uri}}
        style={{width: dimension, height: dimension, borderRadius: dimension / 2}}
        resizeMode="cover"
        accessibilityRole="image"
        accessibilityLabel={accessLabel}
      />
    );
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessLabel}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: dimension / 2,
        backgroundColor: `${colors.primary}33`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          fontSize: fontSizeMap[size],
          fontWeight: 'bold',
          color: colors.primary,
        }}>
        {initials || '?'}
      </Text>
    </View>
  );
}
