import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  Flame,
  ClipboardCheck,
  Trophy,
  AlertTriangle,
  BrainCircuit,
  ChevronRight,
  CalendarCheck,
  BarChart3,
  History,
} from 'lucide-react-native';

import {Header} from '../../components/ui';
import RiskBadge from '../../components/recovery/RiskBadge';
import {colors} from '../../theme/colors';
import {useRecoveryStore} from '../../store/recovery';

export default function RecoveryDashboardScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  const dashboard = useRecoveryStore(s => s.dashboard);
  const profile = useRecoveryStore(s => s.profile);
  const fetchDashboard = useRecoveryStore(s => s.fetchDashboard);
  const fetchProfile = useRecoveryStore(s => s.fetchProfile);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchDashboard();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([fetchProfile(), fetchDashboard()]);
    setRefreshing(false);
  };

  const sobrietyDays = dashboard?.sobriety_days ?? 0;
  const streak = dashboard?.sobriety_streak ?? 0;
  const longestStreak = dashboard?.longest_streak ?? 0;
  const logSummary = dashboard?.daily_log_summary;

  const quickActions = [
    {
      icon: <CalendarCheck size={20} color={colors.success} />,
      label: 'Daily Check-in',
      bg: `${colors.success}15`,
      onPress: () => navigation.navigate('DailyCheckIn'),
    },
    {
      icon: <ClipboardCheck size={20} color={colors.primary} />,
      label: 'Screening',
      bg: `${colors.primary}15`,
      onPress: () => navigation.navigate('ScreeningSelect'),
    },
    {
      icon: <Trophy size={20} color={colors.accent} />,
      label: 'Milestones',
      bg: `${colors.accent}15`,
      onPress: () => navigation.navigate('Milestones'),
    },
    {
      icon: <BrainCircuit size={20} color="#8b5cf6" />,
      label: 'AI Companion',
      bg: '#8b5cf615',
      onPress: () => navigation.navigate('CompanionChat', {}),
    },
    {
      icon: <BarChart3 size={20} color="#0ea5e9" />,
      label: 'History',
      bg: '#0ea5e915',
      onPress: () => navigation.navigate('CheckInHistory'),
    },
    {
      icon: <AlertTriangle size={20} color={colors.destructive} />,
      label: 'Crisis Help',
      bg: `${colors.destructive}15`,
      onPress: () => navigation.navigate('Crisis'),
    },
  ];

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header
        title="Recovery"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            onPress={() => navigation.navigate('ScreeningHistory')}
            hitSlop={8}>
            <History size={20} color={colors.foreground} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={{padding: 16, paddingBottom: 40, gap: 16}}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }>
        {/* Sobriety Hero */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: `${colors.success}30`,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
          }}>
          <Flame size={28} color={colors.success} />
          <Text
            style={{
              fontSize: 48,
              fontWeight: '800',
              color: colors.foreground,
              marginTop: 4,
            }}>
            {sobrietyDays}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
            Days Sober
          </Text>

          <View style={{flexDirection: 'row', gap: 24, marginTop: 16}}>
            <View style={{alignItems: 'center'}}>
              <Text style={{fontSize: 20, fontWeight: '700', color: colors.foreground}}>
                {streak}
              </Text>
              <Text style={{fontSize: 10, color: colors.mutedForeground, fontWeight: '600'}}>
                Current Streak
              </Text>
            </View>
            <View style={{width: 1, backgroundColor: colors.border}} />
            <View style={{alignItems: 'center'}}>
              <Text style={{fontSize: 20, fontWeight: '700', color: colors.foreground}}>
                {longestStreak}
              </Text>
              <Text style={{fontSize: 10, color: colors.mutedForeground, fontWeight: '600'}}>
                Longest Streak
              </Text>
            </View>
          </View>

          {dashboard?.risk_level && (
            <View style={{marginTop: 14}}>
              <RiskBadge level={dashboard.risk_level} size="md" />
            </View>
          )}
        </View>

        {/* Today's Check-in Status */}
        {logSummary && !logSummary.logged_today && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('DailyCheckIn')}
            style={{
              backgroundColor: `${colors.accent}10`,
              borderWidth: 1,
              borderColor: `${colors.accent}30`,
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
            <CalendarCheck size={20} color={colors.accent} />
            <View style={{flex: 1}}>
              <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>
                Daily check-in pending
              </Text>
              <Text style={{fontSize: 11, color: colors.mutedForeground}}>
                Take a moment to log how you're feeling today
              </Text>
            </View>
            <ChevronRight size={16} color={colors.accent} />
          </TouchableOpacity>
        )}

        {/* Recent Screening */}
        {dashboard?.recent_screening && (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 16,
            }}>
            <Text style={{fontSize: 13, fontWeight: '700', color: colors.foreground, marginBottom: 8}}>
              Latest Screening
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
              <View>
                <Text style={{fontSize: 12, color: colors.mutedForeground, textTransform: 'uppercase'}}>
                  {dashboard.recent_screening.instrument}
                </Text>
                <Text style={{fontSize: 18, fontWeight: '700', color: colors.foreground}}>
                  Score: {dashboard.recent_screening.score}
                </Text>
              </View>
              <RiskBadge level={dashboard.recent_screening.risk_level} />
            </View>
          </View>
        )}

        {/* Quick Actions Grid */}
        <View>
          <Text style={{fontSize: 14, fontWeight: '700', color: colors.foreground, marginBottom: 12}}>
            Quick Actions
          </Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
            {quickActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={action.onPress}
                style={{
                  width: '31%',
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 14,
                  alignItems: 'center',
                  gap: 8,
                  flexGrow: 1,
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: action.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {action.icon}
                </View>
                <Text style={{fontSize: 11, fontWeight: '600', color: colors.foreground, textAlign: 'center'}}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
