import { useNavigation } from '@react-navigation/native';
import {
  Apple,
  Brain,
  Check,
  Dumbbell,
  Droplets,
  Moon,
  Pill,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, Header, Skeleton } from '../../components/ui';
import { Text } from '../../components/ui/Text';
import {
  useDismissTipMutation,
  useGenerateTipsMutation,
  useHealthTipsQuery,
  useMarkActedMutation,
} from '../../hooks/queries';
import type { TipCategory, TipPriority } from '../../services/healthTips.service';
import { colors } from '../../theme/colors';
import { timeAgo } from '../../utils/formatters';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<TipPriority, string> = {
  urgent: '#f43f5e',
  high: '#f59e0b',
  medium: '#0ea5e9',
  low: '#10b981',
};

const PRIORITY_LABELS: Record<TipPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const CATEGORY_CONFIG: Record<TipCategory, { icon: React.ElementType; label: string }> = {
  nutrition: { icon: Apple, label: 'Nutrition' },
  exercise: { icon: Dumbbell, label: 'Exercise' },
  sleep: { icon: Moon, label: 'Sleep' },
  mental_health: { icon: Brain, label: 'Mental Health' },
  preventive: { icon: ShieldCheck, label: 'Preventive' },
  hydration: { icon: Droplets, label: 'Hydration' },
  medication: { icon: Pill, label: 'Medication' },
};

type FilterCategory = 'all' | TipCategory;

const FILTER_CHIPS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'exercise', label: 'Exercise' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'mental_health', label: 'Mental Health' },
  { key: 'preventive', label: 'Preventive' },
  { key: 'hydration', label: 'Hydration' },
  { key: 'medication', label: 'Medication' },
];

// ─── Tip Card ─────────────────────────────────────────────────────────────────

function TipCard({
  tip,
  onDismiss,
  onMarkActed,
}: {
  tip: any;
  onDismiss: (id: string) => void;
  onMarkActed: (id: string) => void;
}) {
  const category = CATEGORY_CONFIG[tip.category as TipCategory];
  const priorityColor = PRIORITY_COLORS[tip.priority as TipPriority] || PRIORITY_COLORS.low;
  const priorityLabel = PRIORITY_LABELS[tip.priority as TipPriority] || 'Low';
  const IconComponent = category?.icon || ShieldCheck;

  return (
    <View className="mx-5 mb-3 bg-card border border-border rounded-2xl p-4">
      {/* Priority + Category row */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColor }} />
          <Text
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: priorityColor }}
          >
            {priorityLabel}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5 bg-muted rounded-full px-2.5 py-1">
          <IconComponent size={12} color={colors.mutedForeground} />
          <Text className="text-[10px] font-medium text-muted-foreground">
            {category?.label || tip.category}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text className="text-sm font-bold text-foreground mb-1.5">{tip.title}</Text>

      {/* Content */}
      <Text className="text-xs text-muted-foreground leading-relaxed">{tip.content}</Text>

      {/* Timestamp */}
      <Text className="text-[10px] text-muted-foreground/60 mt-1.5 mb-3">
        {timeAgo(tip.created_at || tip.createdAt)}
      </Text>

      {/* Actions */}
      <View className="flex-row items-center gap-2">
        {!tip.is_acted && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onMarkActed(tip._id)}
            accessibilityRole="button"
            accessibilityLabel="Mark as done"
            className="flex-1 flex-row items-center justify-center gap-1.5 bg-primary/10 rounded-xl py-2.5"
          >
            <Check size={14} color={colors.primary} />
            <Text className="text-xs font-semibold text-primary">Mark as Done</Text>
          </TouchableOpacity>
        )}

        {tip.is_acted && (
          <View className="flex-1 flex-row items-center justify-center gap-1.5 bg-success/10 rounded-xl py-2.5">
            <Check size={14} color={colors.success} />
            <Text className="text-xs font-semibold" style={{ color: colors.success }}>
              Completed
            </Text>
          </View>
        )}

        {!tip.is_dismissed && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onDismiss(tip._id)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss tip"
            className="flex-row items-center justify-center gap-1 bg-muted rounded-xl py-2.5 px-4"
          >
            <X size={14} color={colors.mutedForeground} />
            <Text className="text-xs font-medium text-muted-foreground">Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function TipSkeleton() {
  return (
    <View className="mx-5 mb-3 bg-card border border-border rounded-2xl p-4">
      <View className="flex-row items-center justify-between mb-3">
        <Skeleton width={60} height={12} />
        <Skeleton width={80} height={20} borderRadius={10} />
      </View>
      <Skeleton width="80%" height={14} />
      <View className="mt-2">
        <Skeleton width="100%" height={10} />
      </View>
      <View className="mt-1">
        <Skeleton width="60%" height={10} />
      </View>
      <View className="flex-row items-center gap-2 mt-3">
        <Skeleton width={120} height={32} borderRadius={12} />
        <Skeleton width={80} height={32} borderRadius={12} />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HealthInsightsScreen() {
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 20,
      ...(selectedCategory !== 'all' ? { category: selectedCategory } : {}),
    }),
    [selectedCategory]
  );

  const { data, isLoading, refetch } = useHealthTipsQuery(queryParams);
  const generateMutation = useGenerateTipsMutation();
  const dismissMutation = useDismissTipMutation();
  const markActedMutation = useMarkActedMutation();

  const tips = data?.tips || [];

  const handleDismiss = useCallback(
    (id: string) => {
      dismissMutation.mutate(id);
    },
    [dismissMutation]
  );

  const handleMarkActed = useCallback(
    (id: string) => {
      markActedMutation.mutate(id);
    },
    [markActedMutation]
  );

  const handleGenerate = useCallback(() => {
    generateMutation.mutate();
  }, [generateMutation]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Health Insights" onBack={() => navigation.goBack()} />

      {/* Category filter chips */}
      <View className="border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 16,
            gap: 10,
          }}
        >
          {FILTER_CHIPS.map((chip) => {
            const isActive = selectedCategory === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                activeOpacity={0.7}
                onPress={() => setSelectedCategory(chip.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Filter by ${chip.label}`}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isActive ? colors.primary : colors.muted,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: isActive ? colors.white : colors.mutedForeground,
                  }}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={tips}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }) => (
          <TipCard tip={item} onDismiss={handleDismiss} onMarkActed={handleMarkActed} />
        )}
        contentContainerStyle={tips.length === 0 ? { flex: 1 } : { paddingBottom: 40 }}
        ListEmptyComponent={
          isLoading ? (
            <View>
              <TipSkeleton />
              <TipSkeleton />
              <TipSkeleton />
            </View>
          ) : (
            <EmptyState
              icon={<Sparkles size={40} color={colors.mutedForeground} />}
              title="No health insights yet"
              subtitle="Generate personalized health tips based on your profile and health data."
              actionLabel={generateMutation.isPending ? 'Generating...' : 'Generate Insights'}
              onAction={handleGenerate}
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
