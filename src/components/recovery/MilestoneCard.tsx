import { PartyPopper, Trophy } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import type { Milestone } from '../../types/recovery.types';
import { formatDate } from '../../utils/formatters';
import { Text } from '../ui/Text';

interface Props {
  milestone: Milestone;
  onCelebrate?: (id: string) => void;
}

export default function MilestoneCard({ milestone, onCelebrate }: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: milestone.celebrated ? `${colors.accent}30` : colors.border,
        borderRadius: 16,
        padding: 16,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: milestone.celebrated ? `${colors.accent}20` : `${colors.primary}15`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Trophy size={20} color={milestone.celebrated ? colors.accent : colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>
            {milestone.milestone_name}
          </Text>
          {milestone.description ? (
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 1 }}>
              {milestone.description}
            </Text>
          ) : null}
        </View>
        {milestone.reward_points > 0 && (
          <View
            style={{
              backgroundColor: `${colors.accent}15`,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>
              +{milestone.reward_points} pts
            </Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
          Achieved {formatDate(milestone.achieved_at)}
        </Text>

        {!milestone.celebrated && onCelebrate && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onCelebrate(milestone._id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: `${colors.accent}15`,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <PartyPopper size={14} color={colors.accent} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.accent }}>Celebrate</Text>
          </TouchableOpacity>
        )}

        {milestone.celebrated && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <PartyPopper size={12} color={colors.accent} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.accent }}>
              Celebrated!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
