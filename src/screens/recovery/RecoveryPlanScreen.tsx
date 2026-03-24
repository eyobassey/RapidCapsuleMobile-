import React, { useCallback, useState } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Target,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  FileText,
} from 'lucide-react-native';
import { Header, Text } from '../../components/ui';
import { colors } from '../../theme/colors';
import { useRecoveryStore } from '../../store/recovery';
import { recoveryService } from '../../services/recovery.service';
import type { PlanStage, PlanGoal, RecoveryPlan } from '../../types/recovery.types';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: colors.mutedForeground, label: 'Pending' },
  in_progress: { color: colors.primary, label: 'In Progress' },
  completed: { color: colors.success, label: 'Completed' },
};

export default function RecoveryPlanScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [pastPlans, setPastPlans] = useState<RecoveryPlan[]>([]);

  const activePlan = useRecoveryStore((s) => s.activePlan);
  const fetchActivePlan = useRecoveryStore((s) => s.fetchActivePlan);

  useFocusEffect(
    useCallback(() => {
      fetchActivePlan();
      recoveryService
        .getPlanHistory()
        .then((plans) => {
          setPastPlans(Array.isArray(plans) ? plans.filter((p) => p.status !== 'active') : []);
        })
        .catch(() => {});
    }, [fetchActivePlan])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActivePlan();
    setRefreshing(false);
  };

  const handleGoalToggle = async (stage: PlanStage, goal: PlanGoal) => {
    const newStatus = goal.status === 'completed' ? 'pending' : 'completed';
    try {
      await recoveryService.updateGoalStatus(stage._id, goal._id, newStatus);
      await fetchActivePlan();
    } catch {}
  };

  if (!activePlan && pastPlans.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <Header title="Recovery Plan" onBack={() => navigation.goBack()} />
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}
        >
          <Target size={48} color={colors.mutedForeground} />
          <Text
            style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginTop: 16 }}
          >
            No Recovery Plan
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.mutedForeground,
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            Your care team hasn't created a recovery plan yet. This will appear once your specialist
            sets up your treatment goals.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Header title="Recovery Plan" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {activePlan && (
          <>
            {/* Progress Hero */}
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: `#f59e0b30`,
                borderRadius: 20,
                padding: 20,
                alignItems: 'center',
              }}
            >
              <Target size={24} color="#f59e0b" />
              <Text
                style={{ fontSize: 36, fontWeight: '800', color: colors.foreground, marginTop: 4 }}
              >
                {Math.round(activePlan.progress_percentage || 0)}%
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '600' }}>
                Overall Progress
              </Text>
              <View
                style={{
                  width: '100%',
                  height: 8,
                  backgroundColor: colors.muted,
                  borderRadius: 4,
                  marginTop: 12,
                }}
              >
                <View
                  style={{
                    height: 8,
                    width: `${Math.min(activePlan.progress_percentage || 0, 100)}%`,
                    backgroundColor: '#f59e0b',
                    borderRadius: 4,
                  }}
                />
              </View>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 6 }}>
                {activePlan.stages?.filter((s) => s.status === 'completed').length || 0} of{' '}
                {activePlan.stages?.length || 0} stages complete
              </Text>
            </View>

            {/* Stages */}
            {activePlan.stages?.map((stage, idx) => {
              const isExpanded = expandedStage === stage._id;
              const statusCfg = STATUS_CONFIG[stage.status] ??
                STATUS_CONFIG.pending ?? { color: colors.mutedForeground, label: 'Pending' };
              const completedGoals =
                stage.goals?.filter((g) => g.status === 'completed').length || 0;
              const totalGoals = stage.goals?.length || 0;

              return (
                <View
                  key={stage._id}
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor:
                      stage.status === 'in_progress' ? `${colors.primary}40` : colors.border,
                    borderRadius: 16,
                    overflow: 'hidden',
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setExpandedStage(isExpanded ? null : stage._id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${stage.name}, ${statusCfg.label}, ${completedGoals} of ${totalGoals} goals`}
                    accessibilityState={{ expanded: isExpanded }}
                    style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: `${statusCfg.color}20`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: statusCfg.color }}>
                        {idx + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                        {stage.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                        {completedGoals}/{totalGoals} goals{' '}
                        {stage.estimated_weeks ? `· ~${stage.estimated_weeks} weeks` : ''}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: `${statusCfg.color}15`,
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: statusCfg.color }}>
                        {statusCfg.label}
                      </Text>
                    </View>
                    {isExpanded ? (
                      <ChevronDown size={16} color={colors.mutedForeground} />
                    ) : (
                      <ChevronRight size={16} color={colors.mutedForeground} />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
                      {stage.description && (
                        <Text
                          style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 4 }}
                        >
                          {stage.description}
                        </Text>
                      )}
                      {stage.goals?.map((goal) => (
                        <TouchableOpacity
                          key={goal._id}
                          activeOpacity={0.7}
                          onPress={() => handleGoalToggle(stage, goal)}
                          accessibilityRole="checkbox"
                          accessibilityLabel={goal.description}
                          accessibilityState={{ checked: goal.status === 'completed' }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            paddingVertical: 6,
                          }}
                        >
                          {goal.status === 'completed' ? (
                            <CheckCircle2 size={18} color={colors.success} />
                          ) : (
                            <Circle size={18} color={colors.mutedForeground} />
                          )}
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 13,
                              color:
                                goal.status === 'completed'
                                  ? colors.mutedForeground
                                  : colors.foreground,
                              textDecorationLine:
                                goal.status === 'completed' ? 'line-through' : 'none',
                            }}
                          >
                            {goal.description}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Past Plans */}
        {pastPlans.length > 0 && (
          <View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: colors.foreground,
                marginBottom: 10,
              }}
            >
              Past Plans
            </Text>
            {pastPlans.map((plan) => (
              <View
                key={plan._id}
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <FileText size={16} color={colors.mutedForeground} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
                    {plan.title || 'Recovery Plan'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                    {plan.status} · {Math.round(plan.progress_percentage || 0)}% complete
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
