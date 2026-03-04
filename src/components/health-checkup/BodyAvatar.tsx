import React, {useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Svg, {G, Path} from 'react-native-svg';
import {RotateCcw} from 'lucide-react-native';
import {colors} from '../../theme/colors';
import {
  BodyRegion,
  MALE_FRONT, MALE_FRONT_VIEWBOX,
  MALE_BACK, MALE_BACK_VIEWBOX,
  FEMALE_FRONT, FEMALE_FRONT_VIEWBOX,
  FEMALE_BACK, FEMALE_BACK_VIEWBOX,
} from './body-paths';

interface BodyAvatarProps {
  sex: 'male' | 'female';
  selectedRegion: string | null;
  onSelectRegion: (regionId: string) => void;
}

const FILL_DEFAULT = '#008C99';
const FILL_SELECTED = '#00BCD4';

export default function BodyAvatar({sex, selectedRegion, onSelectRegion}: BodyAvatarProps) {
  const [view, setView] = useState<'front' | 'back'>('front');

  const isMale = sex === 'male';
  const regions: BodyRegion[] =
    view === 'front'
      ? (isMale ? MALE_FRONT : FEMALE_FRONT)
      : (isMale ? MALE_BACK : FEMALE_BACK);
  const viewBox =
    view === 'front'
      ? (isMale ? MALE_FRONT_VIEWBOX : FEMALE_FRONT_VIEWBOX)
      : (isMale ? MALE_BACK_VIEWBOX : FEMALE_BACK_VIEWBOX);

  return (
    <View style={{alignItems: 'center'}}>
      {/* Rotate button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setView(v => (v === 'front' ? 'back' : 'front'))}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 6,
          backgroundColor: colors.muted,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          marginBottom: 8,
        }}>
        <RotateCcw size={14} color={colors.mutedForeground} />
        <Text style={{fontSize: 12, fontWeight: '500', color: colors.mutedForeground}}>
          {view === 'front' ? 'Show Back' : 'Show Front'}
        </Text>
      </TouchableOpacity>

      {/* Body SVG */}
      <Svg viewBox={viewBox} style={{width: '100%', aspectRatio: getAspectRatio(viewBox)}}>
        {regions.map((region, index) => {
          const isSelected = region.id === selectedRegion;
          return (
            <G
              key={`${region.id}-${index}`}
              onPress={() => onSelectRegion(region.id)}>
              <Path
                d={region.d}
                fill={isSelected ? FILL_SELECTED : FILL_DEFAULT}
                opacity={isSelected ? 1 : 0.7}
              />
            </G>
          );
        })}
      </Svg>

      {/* Region label */}
      {selectedRegion && (
        <View
          style={{
            marginTop: 8,
            backgroundColor: `${colors.primary}15`,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 12,
          }}>
          <Text style={{fontSize: 13, fontWeight: '600', color: colors.primary, textTransform: 'capitalize'}}>
            {selectedRegion}
          </Text>
        </View>
      )}
    </View>
  );
}

function getAspectRatio(viewBox: string): number {
  const parts = viewBox.split(' ').map(Number);
  const w = parts[2] || 310;
  const h = parts[3] || 623;
  return w / h;
}
