import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { ChevronRight, History, Stethoscope } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, Header } from '../../components/ui';
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

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { history, isLoading, fetchHistory } = useHealthCheckupStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void fetchHistory({ limit: 50 });
  }, [fetchHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory({ limit: 50 });
    setRefreshing(false);
  }, [fetchHistory]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Checkup History" onBack={() => navigation.goBack()} />

      <FlashList
        data={history}
        keyExtractor={(item: any) => item._id || item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 40,
        }}
        estimatedItemSize={80}
        renderItem={({ item }) => {
          const topCondition = item.response?.data?.conditions?.[0];
          const triage = item.response?.data?.triage_level;
          const condCount = item.response?.data?.conditions?.length || 0;

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${
                topCondition?.common_name || topCondition?.name || 'Health Checkup'
              }${triage ? `, ${triage.replace('_', ' ')}` : ''}`}
              accessibilityHint="Double tap to view checkup details"
              onPress={() => navigation.navigate('HealthCheckupDetail', { id: item._id })}
              className="bg-card border border-border rounded-2xl p-4 mb-2 flex-row items-center gap-3"
            >
              <View className="w-11 h-11 rounded-full bg-muted items-center justify-center">
                <History size={20} color={colors.mutedForeground} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                  {topCondition?.common_name || topCondition?.name || 'Health Checkup'}
                </Text>
                <View className="flex-row items-center gap-2 mt-1">
                  <Text className="text-xs text-muted-foreground">
                    {formatDate(item.created_at || item.createdAt)}
                  </Text>
                  {condCount > 1 && (
                    <Text className="text-xs text-muted-foreground">+{condCount - 1} more</Text>
                  )}
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
                          textTransform: 'capitalize',
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
        }}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon={<Stethoscope size={40} color={colors.mutedForeground} />}
              title="No checkups yet"
              subtitle="Start a health checkup to see your history here."
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
