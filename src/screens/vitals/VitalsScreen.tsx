import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
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
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';

import {useVitalsStore} from '../../store/vitals';
import {Header, StatusBadge, Skeleton, EmptyState} from '../../components/ui';
import {colors} from '../../theme/colors';
import {VITAL_TYPES} from '../../utils/constants';
import {formatVitalValue, timeAgo} from '../../utils/formatters';
import type {VitalTypeConfig, VitalStatus} from '../../types/vital.types';

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

function getVitalStatus(
  value: number,
  config: VitalTypeConfig,
): VitalStatus {
  const {min, max} = config.normalRange;
  if (value < min * 0.8 || value > max * 1.3) return 'Critical';
  if (value < min) return 'Low';
  if (value > max) return 'High';
  return 'Normal';
}

function getLatestReading(vitals: any[], vitalKey: string) {
  // Vitals data can come in different shapes. We look for the vital key
  // in each record and find the most recent reading.
  for (const record of vitals) {
    const readings = record[vitalKey];
    if (readings && Array.isArray(readings) && readings.length > 0) {
      return readings[readings.length - 1];
    }
    // Or if the record itself is a flat vital entry
    if (record.vital_type === vitalKey && record.value != null) {
      return {
        value: record.value,
        unit: record.unit,
        updatedAt: record.updated_at || record.created_at,
      };
    }
  }
  return null;
}

export default function VitalsScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  const {vitals, isLoading, fetchVitals} = useVitalsStore();

  useEffect(() => {
    fetchVitals();
  }, [fetchVitals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVitals();
    setRefreshing(false);
  }, [fetchVitals]);

  // Compute stats
  const stats = useMemo(() => {
    let totalTracked = 0;
    let normalCount = 0;
    let alertCount = 0;

    VITAL_TYPES.forEach(config => {
      const reading = getLatestReading(vitals, config.key);
      if (reading) {
        totalTracked++;
        const numValue = parseFloat(
          config.key === 'blood_pressure'
            ? String(reading.value).split('/')[0]
            : String(reading.value),
        );
        if (!isNaN(numValue)) {
          const status = getVitalStatus(numValue, config);
          if (status === 'Normal') normalCount++;
          else alertCount++;
        }
      }
    });

    return {totalTracked, normalCount, alertCount};
  }, [vitals]);

  if (isLoading && vitals.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Health Vitals" onBack={() => navigation.goBack()} />
        <ScrollView className="flex-1 px-5 pt-4">
          <View className="flex-row gap-3 mb-6">
            {[1, 2, 3].map(i => (
              <View key={i} className="flex-1 bg-card border border-border rounded-2xl p-3 items-center">
                <Skeleton width={32} height={32} borderRadius={16} className="mb-2" />
                <Skeleton width={40} height={24} className="mb-1" />
                <Skeleton width={60} height={12} />
              </View>
            ))}
          </View>
          {[1, 2, 3, 4, 5].map(i => (
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
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        {/* Stats Row */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-card border border-border rounded-2xl p-3 items-center">
            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mb-1.5">
              <TrendingUp size={16} color={colors.primary} />
            </View>
            <Text className="text-2xl font-bold text-foreground">
              {stats.totalTracked}
            </Text>
            <Text className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Tracked
            </Text>
          </View>

          <View className="flex-1 bg-card border border-border rounded-2xl p-3 items-center">
            <View className="w-8 h-8 rounded-full bg-success/10 items-center justify-center mb-1.5">
              <CheckCircle size={16} color={colors.success} />
            </View>
            <Text className="text-2xl font-bold text-foreground">
              {stats.normalCount}
            </Text>
            <Text className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Normal
            </Text>
          </View>

          <View className="flex-1 bg-card border border-border rounded-2xl p-3 items-center">
            <View className="w-8 h-8 rounded-full bg-destructive/10 items-center justify-center mb-1.5">
              <AlertTriangle size={16} color={colors.destructive} />
            </View>
            <Text className="text-2xl font-bold text-foreground">
              {stats.alertCount}
            </Text>
            <Text className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Alerts
            </Text>
          </View>
        </View>

        {/* Vital Type Cards */}
        {VITAL_TYPES.map(config => {
          const IconComponent = getIconComponent(config.icon);
          const reading = getLatestReading(vitals, config.key);
          const displayValue = reading
            ? formatVitalValue(String(reading.value), config.key)
            : null;

          let status: VitalStatus | null = null;
          if (reading) {
            const numVal = parseFloat(
              config.key === 'blood_pressure'
                ? String(reading.value).split('/')[0]
                : String(reading.value),
            );
            if (!isNaN(numVal)) {
              status = getVitalStatus(numVal, config);
            }
          }

          return (
            <TouchableOpacity
              key={config.key}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('VitalDetail', {vitalType: config.key})
              }
              className="bg-card border border-border rounded-2xl p-4 mb-3">
              <View className="flex-row items-center gap-3">
                {/* Colored icon circle */}
                <View
                  style={{backgroundColor: `${config.color}20`}}
                  className="w-11 h-11 rounded-full items-center justify-center">
                  <IconComponent size={22} color={config.color} />
                </View>

                {/* Info */}
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    {config.name}
                  </Text>
                  {reading ? (
                    <View className="flex-row items-baseline gap-1 mt-0.5">
                      <Text className="text-lg font-bold text-foreground">
                        {displayValue}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {config.unit}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      No data recorded
                    </Text>
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
          onPress={() => navigation.navigate('LogVitals')}
          className="bg-primary rounded-2xl h-14 flex-row items-center justify-center shadow-lg">
          <Plus size={20} color={colors.white} />
          <Text className="text-base font-bold text-white ml-2">
            Log Vitals
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
