import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Flame, Heart, Shield, SmilePlus } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
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

  // ── Not enrolled → CTA card ────────────────────────────────────────────────
  if (!isEnrolled) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('RecoveryEnroll')}
        style={styles.card}
      >
        {/* Decorative orbs */}
        <View style={styles.orbTopRight} />
        <View style={styles.orbBottomLeft} />

        <View style={styles.ctaRow}>
          <View style={styles.ctaIcon}>
            <Heart size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Recovery Support</Text>
            <Text style={styles.ctaSubtitle}>
              Track sobriety, get AI support, and access evidence-based screening tools.
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>
    );
  }

  // ── Enrolled → dashboard summary ──────────────────────────────────────────
  const sobrietyDays = dashboard?.sobriety_days ?? 0;
  const logSummary = dashboard?.daily_log_summary;
  const checkInColor = logSummary?.logged_today ? colors.success : colors.secondary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('RecoveryDashboard')}
      style={styles.card}
    >
      {/* Title row */}
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <View style={styles.titleIcon}>
            <Heart size={16} color={colors.accent} />
          </View>
          <Text style={styles.titleText}>Recovery</Text>
        </View>
        <View style={styles.titleRight}>
          {dashboard?.risk_level && <RiskBadge level={dashboard.risk_level} />}
          <ChevronRight size={16} color={colors.mutedForeground} />
        </View>
      </View>

      {/* Stats row — metric card style */}
      <View style={styles.statsRow}>
        {/* Days Sober */}
        <View
          style={[
            styles.statCard,
            {
              borderColor: `${colors.success}18`,
              backgroundColor: `${colors.success}08`,
            },
          ]}
        >
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>Days Sober</Text>
            <Flame size={13} color={colors.success} strokeWidth={2} />
          </View>
          <Text style={[styles.statValue, { color: colors.success }]}>{sobrietyDays}</Text>
        </View>

        {/* Mood */}
        <View
          style={[
            styles.statCard,
            {
              borderColor: `${colors.primary}18`,
              backgroundColor: `${colors.primary}08`,
            },
          ]}
        >
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>Mood</Text>
            <SmilePlus size={13} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {logSummary?.mood_score != null && logSummary.mood_score > 0
              ? `${logSummary.mood_score}/10`
              : '--'}
          </Text>
        </View>

        {/* Check-in */}
        <View
          style={[
            styles.statCard,
            {
              borderColor: `${checkInColor}18`,
              backgroundColor: `${checkInColor}08`,
            },
          ]}
        >
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>Check-in</Text>
            <Shield size={13} color={checkInColor} strokeWidth={2} />
          </View>
          <Text style={[styles.statValue, { color: checkInColor, fontSize: 16 }]}>
            {logSummary?.logged_today ? 'Done' : 'Due'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: `${colors.accent}25`,
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
  },
  // ── CTA (not enrolled) ─────────────────────────────────────────────────────
  orbTopRight: {
    position: 'absolute',
    top: -14,
    right: -14,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: `${colors.accent}08`,
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: -10,
    left: -10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${colors.accent}06`,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ctaIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: `${colors.accent}12`,
    borderWidth: 1,
    borderColor: `${colors.accent}25`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.2,
  },
  ctaSubtitle: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 3,
    lineHeight: 16,
  },
  // ── Enrolled dashboard ─────────────────────────────────────────────────────
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: `${colors.accent}12`,
    borderWidth: 1,
    borderColor: `${colors.accent}25`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.2,
  },
  titleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // ── Metric stat cards ──────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.mutedForeground,
    letterSpacing: 0.1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
});
