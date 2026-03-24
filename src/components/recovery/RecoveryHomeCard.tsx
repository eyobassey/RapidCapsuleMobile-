import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Flame, Heart, Shield, SmilePlus } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useRecoveryStore } from '../../store/recovery';
import { colors } from '../../theme/colors';
import { Text } from '../ui/Text';
import RiskBadge from './RiskBadge';

export default function RecoveryHomeCard() {
  const navigation = useNavigation<any>();
  const isEnrolled = useRecoveryStore((s) => s.isEnrolled);
  const dashboard = useRecoveryStore((s) => s.dashboard);
  const fetchProfile = useRecoveryStore((s) => s.fetchProfile);
  const fetchDashboard = useRecoveryStore((s) => s.fetchDashboard);

  useEffect(() => {
    void fetchProfile().then(() => {
      if (useRecoveryStore.getState().isEnrolled) {
        void fetchDashboard();
      }
    });
  }, [fetchProfile, fetchDashboard]);

  // Not enrolled (or still loading) → show CTA card
  if (!isEnrolled) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('RecoveryEnroll')}
        style={{
          marginHorizontal: 20,
          marginTop: 12,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: `${colors.accent}30`,
          borderRadius: 20,
          padding: 18,
          overflow: 'hidden',
        }}
      >
        {/* Decorative */}
        <View
          style={{
            position: 'absolute',
            top: -10,
            right: -10,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: `${colors.accent}08`,
          }}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: `${colors.accent}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>
              Recovery Support
            </Text>
            <Text
              style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2, lineHeight: 16 }}
            >
              Track sobriety, get AI support, and access evidence-based screening tools.
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>
    );
  }

  // Enrolled → show dashboard summary
  const sobrietyDays = dashboard?.sobriety_days ?? 0;
  const logSummary = dashboard?.daily_log_summary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('RecoveryDashboard')}
      style={{
        marginHorizontal: 20,
        marginTop: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: `${colors.accent}30`,
        borderRadius: 20,
        padding: 18,
      }}
    >
      {/* Title row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: `${colors.accent}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart size={16} color={colors.accent} />
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>
            Recovery
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {dashboard?.risk_level && <RiskBadge level={dashboard.risk_level} />}
          <ChevronRight size={16} color={colors.mutedForeground} />
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* Sobriety streak */}
        <View
          style={{
            flex: 1,
            backgroundColor: `${colors.success}10`,
            borderRadius: 12,
            padding: 10,
            alignItems: 'center',
          }}
        >
          <Flame size={16} color={colors.success} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginTop: 2 }}>
            {sobrietyDays}
          </Text>
          <Text
            style={{
              fontSize: 9,
              color: colors.mutedForeground,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Days Sober
          </Text>
        </View>

        {/* Mood */}
        <View
          style={{
            flex: 1,
            backgroundColor: `${colors.primary}10`,
            borderRadius: 12,
            padding: 10,
            alignItems: 'center',
          }}
        >
          <SmilePlus size={16} color={colors.primary} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginTop: 2 }}>
            {logSummary?.mood_score != null && logSummary.mood_score > 0
              ? `${logSummary.mood_score}/10`
              : '--'}
          </Text>
          <Text
            style={{
              fontSize: 9,
              color: colors.mutedForeground,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Mood
          </Text>
        </View>

        {/* Check-in status */}
        <View
          style={{
            flex: 1,
            backgroundColor: logSummary?.logged_today
              ? `${colors.success}10`
              : `${colors.secondary}10`,
            borderRadius: 12,
            padding: 10,
            alignItems: 'center',
          }}
        >
          <Shield size={16} color={logSummary?.logged_today ? colors.success : colors.secondary} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: logSummary?.logged_today ? colors.success : colors.secondary,
              marginTop: 4,
            }}
          >
            {logSummary?.logged_today ? 'Done' : 'Pending'}
          </Text>
          <Text
            style={{
              fontSize: 9,
              color: colors.mutedForeground,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Check-in
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
