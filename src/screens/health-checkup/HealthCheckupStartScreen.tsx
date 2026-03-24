import { useNavigation } from '@react-navigation/native';
import {
  Activity,
  Brain,
  ChevronRight,
  Clock,
  History,
  Shield,
  Stethoscope,
} from 'lucide-react-native';
import React, { useCallback, useEffect } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header } from '../../components/ui';
import { Text } from '../../components/ui/Text';
import { useHealthCheckupStore } from '../../store/healthCheckup';
import { colors } from '../../theme/colors';
import { formatDate } from '../../utils/formatters';

const TRIAGE_COLORS: Record<string, string> = {
  emergency: colors.destructive,
  severe: colors.destructive,
  moderate: colors.secondary,
  non_urgent: colors.success,
};

export default function HealthCheckupStartScreen() {
  const navigation = useNavigation<any>();
  const { history, fetchHistory, reset } = useHealthCheckupStore();

  useEffect(() => {
    void fetchHistory({ limit: 5 });
  }, [fetchHistory]);

  const handleStart = useCallback(() => {
    reset();
    navigation.navigate('HealthCheckupPatientInfo');
  }, [navigation, reset]);

  const handleViewHistory = useCallback(() => {
    navigation.navigate('HealthCheckupHistory');
  }, [navigation]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Health Checkup" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View className="bg-card border border-border rounded-3xl p-6 mt-4 items-center">
          <View className="bg-primary/10 rounded-full p-5 mb-4">
            <Stethoscope size={40} color={colors.primary} />
          </View>
          <Text className="text-xl font-bold text-foreground text-center">
            AI Health Assessment
          </Text>
          <Text className="text-sm text-muted-foreground text-center mt-2 leading-relaxed">
            Get an AI-powered health assessment based on your symptoms. Our system uses Infermedica
            to analyze your condition and provide recommendations.
          </Text>

          <Button
            variant="primary"
            onPress={handleStart}
            className="mt-6 w-full"
            icon={<Activity size={18} color={colors.white} />}
          >
            Start New Checkup
          </Button>
        </View>

        {/* How it works */}
        <Text className="text-sm font-bold text-foreground mt-6 mb-3 px-1">How It Works</Text>
        <View className="bg-card border border-border rounded-2xl p-4 gap-4">
          {[
            { icon: Shield, label: 'Confirm your basic info (age, gender)' },
            { icon: Activity, label: 'Select risk factors that apply to you' },
            { icon: Brain, label: 'Describe your symptoms' },
            { icon: Stethoscope, label: 'Answer follow-up questions from AI' },
            { icon: Clock, label: 'Review your diagnosis and recommendations' },
          ].map((step, i) => (
            <View key={i} className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                <Text className="text-xs font-bold text-primary">{i + 1}</Text>
              </View>
              <Text className="text-sm text-foreground flex-1">{step.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Checkups */}
        {history.length > 0 && (
          <>
            <View className="flex-row items-center justify-between mt-6 mb-3 px-1">
              <Text className="text-sm font-bold text-foreground">Recent Checkups</Text>
              <TouchableOpacity
                onPress={handleViewHistory}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="View all checkup history"
              >
                <Text className="text-xs font-semibold text-primary">View All</Text>
              </TouchableOpacity>
            </View>

            {history.slice(0, 3).map((checkup: any) => {
              const topCondition = checkup.response?.data?.conditions?.[0];
              const triage = checkup.response?.data?.triage_level;
              return (
                <TouchableOpacity
                  key={checkup._id}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${
                    topCondition?.common_name || topCondition?.name || 'Health Checkup'
                  }${triage ? `, ${triage.replace('_', ' ')}` : ''}`}
                  accessibilityHint="Double tap to view checkup details"
                  onPress={() => navigation.navigate('HealthCheckupDetail', { id: checkup._id })}
                  className="bg-card border border-border rounded-2xl p-4 mb-2 flex-row items-center gap-3"
                >
                  <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
                    <History size={18} color={colors.mutedForeground} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                      {topCondition?.common_name || topCondition?.name || 'Health Checkup'}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <Text className="text-xs text-muted-foreground">
                        {formatDate(checkup.created_at || checkup.createdAt)}
                      </Text>
                      {triage && (
                        <View
                          style={{
                            backgroundColor: `${TRIAGE_COLORS[triage] || colors.muted}33`,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: TRIAGE_COLORS[triage] || colors.mutedForeground,
                              fontSize: 10,
                              fontWeight: '600',
                            }}
                          >
                            {triage.replace('_', ' ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
