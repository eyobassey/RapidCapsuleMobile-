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

const fontSizeMap: Record<AvatarSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
};

export default function Avatar({
  uri,
  firstName = '',
  lastName = '',
  size = 'md',
}: AvatarProps) {
  const dimension = sizeMap[size];
  const initials = getInitials(firstName, lastName);

  if (uri) {
    return (
      <Image
        source={{uri}}
        style={{width: dimension, height: dimension, borderRadius: dimension / 2}}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: dimension,
        height: dimension,
        borderRadius: dimension / 2,
        backgroundColor: `${colors.primary}33`, // ~20% opacity
      }}
      className="items-center justify-center">
      <Text
        className={`${fontSizeMap[size]} font-bold`}
        style={{color: colors.primary}}>
        {initials || '?'}
      </Text>
    </View>
  );
}
