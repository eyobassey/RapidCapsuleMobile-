import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Star, Briefcase} from 'lucide-react-native';
import {Avatar, Button} from '../ui';
import {colors} from '../../theme/colors';
import {useCurrency} from '../../hooks/useCurrency';

interface SpecialistCardProps {
  specialist: any;
  onSelect: () => void;
}

export default function SpecialistCard({specialist, onSelect}: SpecialistCardProps) {
  const {format} = useCurrency();
  const profile = specialist.profile || {};
  const name = profile.first_name
    ? `Dr. ${profile.first_name} ${profile.last_name || ''}`
    : specialist.name || 'Specialist';
  const specialty =
    specialist.specialist_category?.name ||
    specialist.specialty ||
    'General Practice';
  const rating = specialist.average_rating || specialist.rating || 0;
  const reviewCount = specialist.review_count || specialist.total_reviews || 0;
  const experience = specialist.years_of_experience || specialist.experience || 0;
  const fee = specialist.consultation_fee || specialist.fee || 0;

  return (
    <View className="bg-card border border-border rounded-2xl p-4 mb-3">
      {/* Top section: Avatar + Info */}
      <View className="flex-row items-start gap-3 mb-3">
        <Avatar
          uri={profile.profile_photo || profile.profile_image}
          firstName={profile.first_name}
          lastName={profile.last_name}
          size="lg"
        />
        <View className="flex-1">
          <Text className="text-foreground font-bold text-base" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-muted-foreground text-xs mt-0.5">{specialty}</Text>

          {/* Rating */}
          <View className="flex-row items-center gap-1 mt-1.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                size={12}
                color={i <= Math.round(rating) ? colors.secondary : colors.border}
                fill={i <= Math.round(rating) ? colors.secondary : 'transparent'}
              />
            ))}
            <Text className="text-muted-foreground text-xs ml-1">
              {rating > 0 ? rating.toFixed(1) : '--'}
              {reviewCount > 0 ? ` (${reviewCount})` : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View className="flex-row items-center gap-4 mb-4 px-1">
        {experience > 0 && (
          <View className="flex-row items-center gap-1.5">
            <Briefcase size={14} color={colors.mutedForeground} />
            <Text className="text-muted-foreground text-xs">
              {experience} yr{experience > 1 ? 's' : ''} exp
            </Text>
          </View>
        )}
        <Text className="text-primary font-bold text-sm">
          {format(fee)}
        </Text>
      </View>

      {/* Select button */}
      <Button variant="outline" onPress={onSelect}>
        Select Specialist
      </Button>
    </View>
  );
}
