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
  Target,
  Users,
  UserCheck,
  Pill,
  Shield,
  Dumbbell,
  TrendingUp,
  MessageCircle,
  Award,
} from 'lucide-react-native';

import {Header} from '../../components/ui';
import RiskBadge from '../../components/recovery/RiskBadge';
import LineChart from '../../components/charts/LineChart';
import {colors} from '../../theme/colors';
import {useRecoveryStore} from '../../store/recovery';
import {recoveryService} from '../../services/recovery.service';

export default function RecoveryDashboardScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [moodChartData, setMoodChartData] = useState<Array<{date: string; value: number}>>([]);

  const dashboard = useRecoveryStore(s => s.dashboard);
  const profile = useRecoveryStore(s => s.profile);
  const activePlan = useRecoveryStore(s => s.activePlan);
  const recentConversations = useRecoveryStore(s => s.recentConversations);
  const fetchDashboard = useRecoveryStore(s => s.fetchDashboard);
  const fetchProfile = useRecoveryStore(s => s.fetchProfile);
  const fetchActivePlan = useRecoveryStore(s => s.fetchActivePlan);
  const fetchRecentConversations = useRecoveryStore(s => s.fetchRecentConversations);

  const loadAll = useCallback(async () => {
    await Promise.allSettled([
      fetchProfile(),
      fetchDashboard(),
      fetchActivePlan(),
      fetchRecentConversations(),
      recoveryService.getChartData('mood_score', 14).then(data => {
        setMoodChartData(Array.isArray(data) ? data : []);
      }).catch(() => {}),
    ]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
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
      icon: <Target size={20} color="#f59e0b" />,
      label: 'Recovery Plan',
      bg: '#f59e0b15',
      onPress: () => navigation.navigate('RecoveryPlan'),
    },
    {
      icon: <Users size={20} color="#06b6d4" />,
      label: 'Group Sessions',
      bg: '#06b6d415',
      onPress: () => navigation.navigate('GroupSessions'),
    },
    {
      icon: <UserCheck size={20} color="#10b981" />,
      label: 'Peer Support',
      bg: '#10b98115',
      onPress: () => navigation.navigate('PeerSupport'),
    },
    {
      icon: <Pill size={20} color="#3b82f6" />,
      label: 'Medication',
      bg: '#3b82f615',
      onPress: () => navigation.navigate('MATDashboard'),
    },
    {
      icon: <Shield size={20} color="#ec4899" />,
      label: 'Harm Reduction',
      bg: '#ec489915',
      onPress: () => navigation.navigate('HarmReduction'),
    },
    {
      icon: <Dumbbell size={20} color="#14b8a6" />,
      label: 'Exercises',
      bg: '#14b8a615',
      onPress: () => navigation.navigate('ExerciseHistory'),
    },
    {
      icon: <TrendingUp size={20} color="#f97316" />,
      label: 'Risk Reports',
      bg: '#f9731615',
      onPress: () => navigation.navigate('RiskHistory'),
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

        {/* Programme Stats */}
        {profile?.outcomes && (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 16,
            }}>
            <Text style={{fontSize: 13, fontWeight: '700', color: colors.foreground, marginBottom: 12}}>
              Programme
            </Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
              <StatItem value={profile.outcomes.days_in_program} label="Days" />
              <StatItem value={profile.outcomes.appointments_attended} label="Appointments" />
              <StatItem value={profile.outcomes.companion_sessions_count} label="AI Sessions" />
              <StatItem value={profile.outcomes.milestones_achieved} label="Milestones" />
            </View>
          </View>
        )}

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

        {/* Mood Trend Chart */}
        {moodChartData.length > 0 && (
          <LineChart
            data={moodChartData}
            color={colors.primary}
            height={160}
            label="Mood Trend (14 days)"
            range={{min: 0, max: 10}}
          />
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

        {/* Recovery Plan Summary */}
        {activePlan && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('RecoveryPlan')}
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 16,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Target size={16} color="#f59e0b" />
                <Text style={{fontSize: 13, fontWeight: '700', color: colors.foreground}}>
                  Recovery Plan
                </Text>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </View>
            <View style={{marginBottom: 8}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                <Text style={{fontSize: 11, color: colors.mutedForeground}}>
                  {activePlan.stages?.filter(s => s.status === 'completed').length || 0} of{' '}
                  {activePlan.stages?.length || 0} stages complete
                </Text>
                <Text style={{fontSize: 11, fontWeight: '700', color: colors.foreground}}>
                  {Math.round(activePlan.progress_percentage || 0)}%
                </Text>
              </View>
              <View style={{height: 6, backgroundColor: colors.muted, borderRadius: 3}}>
                <View
                  style={{
                    height: 6,
                    width: `${Math.min(activePlan.progress_percentage || 0, 100)}%`,
                    backgroundColor: '#f59e0b',
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
            {activePlan.stages?.find(s => s.status === 'in_progress') && (
              <Text style={{fontSize: 11, color: colors.mutedForeground}}>
                Current: {activePlan.stages.find(s => s.status === 'in_progress')!.name}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Recent Conversations */}
        {recentConversations.length > 0 && (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 16,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12}}>
              <MessageCircle size={16} color="#8b5cf6" />
              <Text style={{fontSize: 13, fontWeight: '700', color: colors.foreground}}>
                Recent Conversations
              </Text>
            </View>
            {recentConversations.slice(0, 3).map((session, i) => (
              <TouchableOpacity
                key={session.session_id || i}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('CompanionChat', {sessionId: session.session_id})}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 8,
                  borderTopWidth: i > 0 ? 1 : 0,
                  borderTopColor: colors.border,
                }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#8b5cf615',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <BrainCircuit size={14} color="#8b5cf6" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={{fontSize: 12, fontWeight: '600', color: colors.foreground}}>
                    {session.context || 'General Support'}
                  </Text>
                  <Text style={{fontSize: 10, color: colors.mutedForeground}}>
                    {session.message_count ? `${session.message_count} messages` : ''}{' '}
                    {session.started_at ? formatRelativeDate(session.started_at) : ''}
                  </Text>
                </View>
                <ChevronRight size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
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

function StatItem({value, label}: {value: number; label: string}) {
  return (
    <View style={{alignItems: 'center'}}>
      <Text style={{fontSize: 18, fontWeight: '700', color: colors.foreground}}>{value}</Text>
      <Text style={{fontSize: 10, color: colors.mutedForeground, fontWeight: '600'}}>{label}</Text>
    </View>
  );
}

function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
