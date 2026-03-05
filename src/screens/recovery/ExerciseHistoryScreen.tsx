import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  Dumbbell,
  Clock,
  Star,
  Flame,
  Wind,
  Brain,
  Heart,
  BookOpen,
} from 'lucide-react-native';
import {Header} from '../../components/ui';
import {colors} from '../../theme/colors';
import {useRecoveryStore} from '../../store/recovery';
import {recoveryService} from '../../services/recovery.service';
import type {ExerciseRecord, ExerciseStats} from '../../types/recovery.types';

const CATEGORY_ICONS: Record<string, {icon: any; color: string}> = {
  breathing: {icon: Wind, color: '#06b6d4'},
  mindfulness: {icon: Brain, color: '#8b5cf6'},
  grounding: {icon: Heart, color: '#ec4899'},
  physical: {icon: Dumbbell, color: '#10b981'},
  journaling: {icon: BookOpen, color: '#f59e0b'},
  dbt: {icon: Brain, color: '#6366f1'},
  relapse_prevention: {icon: Flame, color: '#ef4444'},
  motivational_interviewing: {icon: Star, color: '#f97316'},
};

const WELLNESS_CONFIG: Record<string, {color: string; bg: string}> = {
  optimal: {color: colors.success, bg: `${colors.success}20`},
  moderate: {color: '#f59e0b', bg: '#f59e0b20'},
  low: {color: colors.destructive, bg: `${colors.destructive}20`},
};

export default function ExerciseHistoryScreen() {
  const navigation = useNavigation<any>();
  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const exerciseStats = useRecoveryStore(s => s.exerciseStats);
  const fetchExerciseStats = useRecoveryStore(s => s.fetchExerciseStats);

  const loadAll = useCallback(async () => {
    await Promise.allSettled([
      fetchExerciseStats(),
      recoveryService.getExerciseHistory({limit: 30}).then(setExercises).catch(() => {}),
    ]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll().then(() => setLoading(false));
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={{gap: 16, marginBottom: 16}}>
      {/* Stats Hero */}
      {exerciseStats && (
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            padding: 20,
          }}>
          {/* Wellness Score */}
          <View style={{alignItems: 'center', marginBottom: 16}}>
            <Dumbbell size={24} color="#14b8a6" />
            <Text style={{fontSize: 36, fontWeight: '800', color: colors.foreground, marginTop: 4}}>
              {exerciseStats.wellness_score || 0}
            </Text>
            <Text style={{fontSize: 12, color: colors.mutedForeground, fontWeight: '600'}}>
              Wellness Score
            </Text>
            {exerciseStats.wellness_level && (
              <View
                style={{
                  backgroundColor: (WELLNESS_CONFIG[exerciseStats.wellness_level] || WELLNESS_CONFIG.moderate).bg,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  marginTop: 6,
                }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: (WELLNESS_CONFIG[exerciseStats.wellness_level] || WELLNESS_CONFIG.moderate).color,
                    textTransform: 'capitalize',
                  }}>
                  {exerciseStats.wellness_level}
                </Text>
              </View>
            )}
          </View>

          {/* Stats Row */}
          <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
            <StatItem value={exerciseStats.total_sessions} label="Sessions" />
            <StatItem value={exerciseStats.total_minutes} label="Minutes" />
            <StatItem value={exerciseStats.streak} label="Streak" />
            <StatItem value={`${Math.round(exerciseStats.completion_rate || 0)}%`} label="Complete" />
          </View>
        </View>
      )}

      {/* Category Breakdown */}
      {exerciseStats?.by_category && Object.keys(exerciseStats.by_category).length > 0 && (
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 16,
          }}>
          <Text style={{fontSize: 13, fontWeight: '700', color: colors.foreground, marginBottom: 12}}>
            By Category
          </Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
            {Object.entries(exerciseStats.by_category).map(([cat, count]) => {
              const cfg = CATEGORY_ICONS[cat.toLowerCase()] || {icon: Dumbbell, color: '#14b8a6'};
              const IconComponent = cfg.icon;
              return (
                <View
                  key={cat}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: `${cfg.color}15`,
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}>
                  <IconComponent size={14} color={cfg.color} />
                  <Text style={{fontSize: 12, fontWeight: '600', color: colors.foreground, textTransform: 'capitalize'}}>
                    {cat.replace(/_/g, ' ')}
                  </Text>
                  <Text style={{fontSize: 12, fontWeight: '700', color: cfg.color}}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <Text style={{fontSize: 13, fontWeight: '700', color: colors.foreground}}>
        Recent Exercises
      </Text>
    </View>
  );

  const renderExercise = ({item}: {item: ExerciseRecord}) => {
    const cfg = CATEGORY_ICONS[item.category?.toLowerCase()] || {icon: Dumbbell, color: '#14b8a6'};
    const IconComponent = cfg.icon;

    return (
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          padding: 14,
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: `${cfg.color}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <IconComponent size={16} color={cfg.color} />
          </View>
          <View style={{flex: 1}}>
            <Text style={{fontSize: 13, fontWeight: '600', color: colors.foreground}}>
              {item.name}
            </Text>
            <Text style={{fontSize: 11, color: colors.mutedForeground, textTransform: 'capitalize'}}>
              {item.category?.replace(/_/g, ' ')}
            </Text>
          </View>
          {item.effectiveness_rating != null && (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 2}}>
              <Star size={12} color="#f59e0b" />
              <Text style={{fontSize: 12, fontWeight: '700', color: colors.foreground}}>
                {item.effectiveness_rating}
              </Text>
            </View>
          )}
        </View>

        <View style={{flexDirection: 'row', gap: 12, marginTop: 10}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
            <Clock size={11} color={colors.mutedForeground} />
            <Text style={{fontSize: 11, color: colors.mutedForeground}}>
              {item.duration_minutes} min
            </Text>
          </View>
          <Text style={{fontSize: 11, color: colors.mutedForeground}}>
            {formatDate(item.completed_at)}
          </Text>
        </View>

        {item.ai_summary && (
          <Text numberOfLines={2} style={{fontSize: 11, color: colors.mutedForeground, marginTop: 8, fontStyle: 'italic'}}>
            {item.ai_summary}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Exercises" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={item => item._id}
          contentContainerStyle={{padding: 16, gap: 10}}
          ListHeaderComponent={renderHeader}
          renderItem={renderExercise}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={{alignItems: 'center', paddingTop: 40, paddingHorizontal: 40}}>
              <Dumbbell size={40} color={colors.mutedForeground} />
              <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground, marginTop: 12}}>
                No exercises yet
              </Text>
              <Text style={{fontSize: 12, color: colors.mutedForeground, textAlign: 'center', marginTop: 4}}>
                Complete exercises through your AI companion to see them here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function StatItem({value, label}: {value: number | string; label: string}) {
  return (
    <View style={{alignItems: 'center'}}>
      <Text style={{fontSize: 18, fontWeight: '700', color: colors.foreground}}>{value}</Text>
      <Text style={{fontSize: 10, color: colors.mutedForeground, fontWeight: '600'}}>{label}</Text>
    </View>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});
}
