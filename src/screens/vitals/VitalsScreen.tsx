import { useNavigation } from '@react-navigation/native';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Droplets,
  Flame,
  Footprints,
  GlassWater,
  Heart,
  HeartPulse,
  Moon,
  Percent,
  Plus,
  Scale,
  Thermometer,
  TrendingUp,
  Wind,
  Zap,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header, Skeleton, StatusBadge } from '../../components/ui';
import { Text } from '../../components/ui/Text';
import { useRecentVitalsQuery, useVitalsQuery } from '../../hooks/queries';
import { colors } from '../../theme/colors';
import type { VitalStatus, VitalTypeConfig } from '../../types/vital.types';
import { VITAL_TYPES } from '../../utils/constants';
import { formatVitalValue, timeAgo } from '../../utils/formatters';

// Map icon string names to actual components
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Heart,
  HeartPulse,
  Thermometer,
  Droplets,
  Wind,
  Activity,
  Scale,
  Footprints,
  Moon,
  Flame,
  Brain,
  Percent,
  GlassWater,
  Zap,
};

function getIconComponent(iconName: string) {
  return ICON_MAP[iconName] || Activity;
}

function getVitalStatus(value: number, config: VitalTypeConfig): VitalStatus {
  const { min, max } = config.normalRange;
  if (value < min * 0.8 || value > max * 1.3) return 'Critical';
  if (value < min) return 'Low';
  if (value > max) return 'High';
  return 'Normal';
}

/**
 * Get the latest reading for a vital key.
 * Prefers recentVitals (GET /vitals/recent — single latest per type).
 * Falls back to vitalsData arrays (GET /vitals — full history).
 */
function getLatestReading(
  recentVitals: Record<string, any>,
  vitalsData: Record<string, any>,
  vitalKey: string
) {
  // 1. Check recentVitals first (flat object: { value, unit, updatedAt })
  const recent = recentVitals[vitalKey];
  if (recent && recent.value != null) {
    return recent;
  }

  // 2. Fallback to vitalsData arrays
  const readings = vitalsData[vitalKey];
  if (!readings) return null;

  if (Array.isArray(readings) && readings.length > 0) {
    // Sort by updatedAt descending and return the most recent
    const sorted = [...readings].sort((a, b) => {
      const da = new Date(a.updatedAt || 0).getTime();
      const db = new Date(b.updatedAt || 0).getTime();
      return db - da;
    });
    return sorted[0];
  }

  if (readings.value != null) {
    return readings;
  }

  return null;
}

export default function VitalsScreen() {
  const navigation = useNavigation<any>();

  const {
    data: vitalsData = {},
    isLoading: vitalsLoading,
    refetch: refetchVitals,
  } = useVitalsQuery();

  const {
    data: recentVitals = {},
    isLoading: recentLoading,
    refetch: refetchRecent,
  } = useRecentVitalsQuery();

  const isLoading = vitalsLoading || recentLoading;
  const hasData = Object.keys(vitalsData).length > 0;

  const onRefresh = async () => {
    await Promise.allSettled([refetchVitals(), refetchRecent()]);
  };

  // Compute stats
  const stats = useMemo(() => {
    let totalTracked = 0;
    let normalCount = 0;
    let alertCount = 0;

    VITAL_TYPES.forEach((config) => {
      const reading = getLatestReading(recentVitals, vitalsData, config.key);
      if (reading) {
        totalTracked++;
        const numValue = parseFloat(
          config.key === 'blood_pressure'
            ? String(reading.value).split('/')[0]
            : String(reading.value)
        );
        if (!isNaN(numValue)) {
          const status = getVitalStatus(numValue, config);
          if (status === 'Normal') normalCount++;
          else alertCount++;
        }
      }
    });

    return { totalTracked, normalCount, alertCount };
  }, [vitalsData, recentVitals]);

  if (isLoading && !hasData) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Health Vitals" onBack={() => navigation.goBack()} />
        <ScrollView className="flex-1 px-5 pt-4">
          <View className="flex-row gap-3 mb-6">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="flex-1 bg-card border border-border rounded-2xl p-3 items-center"
              >
                <Skeleton width={32} height={32} borderRadius={16} className="mb-2" />
                <Skeleton width={40} height={24} className="mb-1" />
                <Skeleton width={60} height={12} />
              </View>
            ))}
          </View>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="bg-card border border-border rounded-2xl p-4 mb-3">
              <View className="flex-row items-center gap-3">
                <Skeleton width={44} height={44} borderRadius={22} />
                <View className="flex-1">
                  <Skeleton width={120} height={16} className="mb-2" />
                  <Skeleton width={80} height={14} />
                </View>
                <Skeleton width={60} height={22} borderRadius={11} />
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Health Vitals" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-4 pb-28"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Stats Row */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-card border border-border rounded-2xl p-3 items-center">
            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mb-1.5">
              <TrendingUp size={16} color={colors.primary} />
            </View>
            <Text className="text-2xl font-bold text-foreground">{stats.totalTracked}</Text>
            <Text className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Tracked
            </Text>
          </View>

          <View className="flex-1 bg-card border border-border rounded-2xl p-3 items-center">
            <View className="w-8 h-8 rounded-full bg-success/10 items-center justify-center mb-1.5">
              <CheckCircle size={16} color={colors.success} />
            </View>
            <Text className="text-2xl font-bold text-foreground">{stats.normalCount}</Text>
            <Text className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Normal
            </Text>
          </View>

          <View className="flex-1 bg-card border border-border rounded-2xl p-3 items-center">
            <View className="w-8 h-8 rounded-full bg-destructive/10 items-center justify-center mb-1.5">
              <AlertTriangle size={16} color={colors.destructive} />
            </View>
            <Text className="text-2xl font-bold text-foreground">{stats.alertCount}</Text>
            <Text className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Alerts
            </Text>
          </View>
        </View>

        {/* Vital Type Cards */}
        {VITAL_TYPES.map((config) => {
          const IconComponent = getIconComponent(config.icon);
          const reading = getLatestReading(recentVitals, vitalsData, config.key);
          const displayValue =
            reading?.value != null ? formatVitalValue(String(reading.value), config.key) : null;

          let status: VitalStatus | null = null;
          if (reading?.value != null) {
            const numVal = parseFloat(
              config.key === 'blood_pressure'
                ? String(reading.value).split('/')[0]
                : String(reading.value)
            );
            if (!isNaN(numVal)) {
              status = getVitalStatus(numVal, config);
            }
          }

          return (
            <TouchableOpacity
              key={config.key}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${config.name}${
                reading?.value != null
                  ? `, ${formatVitalValue(String(reading.value), config.key)} ${config.unit}`
                  : ', no data recorded'
              }${status ? `, Status: ${status}` : ''}`}
              accessibilityHint="Double tap to view details"
              onPress={() => navigation.navigate('VitalDetail', { vitalType: config.key })}
              className="bg-card border border-border rounded-2xl p-4 mb-3"
            >
              <View className="flex-row items-center gap-3">
                {/* Colored icon circle */}
                <View
                  style={{
                    backgroundColor: `${config.color}20`,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconComponent size={22} color={config.color} />
                </View>

                {/* Info */}
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{config.name}</Text>
                  {reading ? (
                    <View className="flex-row items-baseline gap-1 mt-0.5">
                      <Text className="text-lg font-bold text-foreground">{displayValue}</Text>
                      <Text className="text-xs text-muted-foreground">{config.unit}</Text>
                    </View>
                  ) : (
                    <Text className="text-xs text-muted-foreground mt-0.5">No data recorded</Text>
                  )}
                  {reading?.updatedAt && (
                    <Text className="text-[10px] text-muted-foreground mt-0.5">
                      {timeAgo(reading.updatedAt)}
                    </Text>
                  )}
                </View>

                {/* Status badge or no data indicator */}
                {status ? (
                  <StatusBadge status={status} />
                ) : (
                  <Text className="text-xs text-muted-foreground">--</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* FAB: Log Vitals */}
      <View className="absolute bottom-6 left-5 right-5">
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Log vitals"
          onPress={() => navigation.navigate('LogVitals')}
          className="bg-primary rounded-2xl h-14 flex-row items-center justify-center shadow-lg"
        >
          <Plus size={20} color={colors.white} />
          <Text className="text-base font-bold text-white ml-2">Log Vitals</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
