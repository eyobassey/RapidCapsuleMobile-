import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import {
  Activity,
  Brain,
  Clock,
  Droplets,
  Flame,
  Footprints,
  GlassWater,
  Heart,
  HeartPulse,
  Info,
  Moon,
  Percent,
  Plus,
  Scale,
  Thermometer,
  TrendingUp,
  Wind,
  Zap,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Path, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';

import { EmptyState, Header, Skeleton, StatusBadge, TabBar } from '../../components/ui';
import { Text } from '../../components/ui/Text';
import { useVitalChartQuery, useVitalsQuery } from '../../hooks/queries';
import type { HomeStackParamList } from '../../navigation/stacks/HomeStack';
import { colors } from '../../theme/colors';
import type { VitalStatus, VitalTypeConfig } from '../../types/vital.types';
import { VITAL_TYPES } from '../../utils/constants';
import { formatDate, formatDateTime, formatVitalValue, timeAgo } from '../../utils/formatters';

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

const PERIOD_TABS = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
];

function getVitalStatus(value: number, config: VitalTypeConfig): VitalStatus {
  const { min, max } = config.normalRange;
  if (value < min * 0.8 || value > max * 1.3) return 'Critical';
  if (value < min) return 'Low';
  if (value > max) return 'High';
  return 'Normal';
}

// Simple line chart component using react-native-svg
function SimpleLineChart({
  data,
  config,
  width,
}: {
  data: { value: number; date: string }[];
  config: VitalTypeConfig;
  width: number;
}) {
  if (!data || data.length === 0) {
    return (
      <View className="h-48 items-center justify-center bg-muted/30 rounded-2xl">
        <TrendingUp size={32} color={colors.mutedForeground} />
        <Text className="text-sm text-muted-foreground mt-2">No chart data available</Text>
      </View>
    );
  }

  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartInnerHeight = chartHeight - paddingY * 2;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values, config.normalRange.min);
  const maxVal = Math.max(...values, config.normalRange.max);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: paddingX + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: paddingY + chartInnerHeight - ((d.value - minVal) / range) * chartInnerHeight,
  }));

  // Build SVG path
  let pathD = '';
  points.forEach((p, i) => {
    if (i === 0) pathD += `M ${p.x} ${p.y}`;
    else pathD += ` L ${p.x} ${p.y}`;
  });

  // Normal range band
  const normalMinY =
    paddingY + chartInnerHeight - ((config.normalRange.min - minVal) / range) * chartInnerHeight;
  const normalMaxY =
    paddingY + chartInnerHeight - ((config.normalRange.max - minVal) / range) * chartInnerHeight;

  return (
    <View className="bg-card border border-border rounded-2xl p-3 overflow-hidden">
      <Svg width={width - 32} height={chartHeight}>
        {/* Normal range band */}
        <Path
          d={`M ${paddingX} ${normalMaxY} L ${paddingX + chartWidth} ${normalMaxY} L ${
            paddingX + chartWidth
          } ${normalMinY} L ${paddingX} ${normalMinY} Z`}
          fill={`${colors.success}15`}
        />
        {/* Normal range lines */}
        <Line
          x1={paddingX}
          y1={normalMaxY}
          x2={paddingX + chartWidth}
          y2={normalMaxY}
          stroke={`${colors.success}40`}
          strokeDasharray="4,4"
        />
        <Line
          x1={paddingX}
          y1={normalMinY}
          x2={paddingX + chartWidth}
          y2={normalMinY}
          stroke={`${colors.success}40`}
          strokeDasharray="4,4"
        />

        {/* Y-axis labels */}
        <SvgText
          x={paddingX - 6}
          y={normalMaxY + 4}
          fontSize={9}
          fill={colors.mutedForeground}
          textAnchor="end"
        >
          {config.normalRange.max}
        </SvgText>
        <SvgText
          x={paddingX - 6}
          y={normalMinY + 4}
          fontSize={9}
          fill={colors.mutedForeground}
          textAnchor="end"
        >
          {config.normalRange.min}
        </SvgText>

        {/* Data line */}
        <Path
          d={pathD}
          fill="none"
          stroke={config.color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <SvgCircle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={config.color}
            stroke={colors.card}
            strokeWidth={2}
          />
        ))}

        {/* X-axis labels (show first, middle, last) */}
        {data.length > 0 && (
          <>
            <SvgText
              x={paddingX}
              y={chartHeight - 6}
              fontSize={9}
              fill={colors.mutedForeground}
              textAnchor="start"
            >
              {formatDate(data[0].date).split(',')[0]}
            </SvgText>
            {data.length > 2 && (
              <SvgText
                x={paddingX + chartWidth / 2}
                y={chartHeight - 6}
                fontSize={9}
                fill={colors.mutedForeground}
                textAnchor="middle"
              >
                {formatDate(data[Math.floor(data.length / 2)].date).split(',')[0]}
              </SvgText>
            )}
            <SvgText
              x={paddingX + chartWidth}
              y={chartHeight - 6}
              fontSize={9}
              fill={colors.mutedForeground}
              textAnchor="end"
            >
              {formatDate(data[data.length - 1].date).split(',')[0]}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}

export default function VitalDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<HomeStackParamList, 'VitalDetail'>>();
  const vitalType = route.params.vitalType;

  const [period, setPeriod] = useState('7d');
  const [chartWidth, setChartWidth] = useState(340);

  // React Query hooks
  const {
    data: vitalsData = {},
    isLoading: vitalsLoading,
    refetch: refetchVitals,
  } = useVitalsQuery();

  const {
    data: chartData,
    isLoading: chartLoading,
    refetch: refetchChart,
  } = useVitalChartQuery(vitalType, '90d');

  const isLoading = vitalsLoading || chartLoading;

  const config = useMemo(() => VITAL_TYPES.find((v) => v.key === vitalType), [vitalType]);

  const IconComponent = config ? ICON_MAP[config.icon] || Activity : Activity;

  const onRefresh = useCallback(async () => {
    await Promise.allSettled([refetchVitals(), refetchChart()]);
  }, [refetchVitals, refetchChart]);

  // Extract history entries for this vital from the merged vitals object
  const history = useMemo(() => {
    const entries: { value: string; unit: string; date: string; status: VitalStatus }[] = [];
    const readings = vitalsData[vitalType];

    if (Array.isArray(readings)) {
      for (const r of readings) {
        const numVal = parseFloat(
          vitalType === 'blood_pressure' ? String(r.value).split('/')[0] : String(r.value)
        );
        entries.push({
          value: String(r.value),
          unit: r.unit || config?.unit || '',
          date: r.updatedAt || r.created_at,
          status: !isNaN(numVal) && config ? getVitalStatus(numVal, config) : 'Normal',
        });
      }
    } else if (readings && readings.value != null) {
      // Single flat reading
      const numVal = parseFloat(
        vitalType === 'blood_pressure'
          ? String(readings.value).split('/')[0]
          : String(readings.value)
      );
      entries.push({
        value: String(readings.value),
        unit: readings.unit || config?.unit || '',
        date: readings.updatedAt || readings.created_at,
        status: !isNaN(numVal) && config ? getVitalStatus(numVal, config) : 'Normal',
      });
    }

    // Sort newest first
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return entries;
  }, [vitalsData, vitalType, config]);

  // Latest reading (always from full history, not filtered)
  const latest = history[0] || null;

  // Period cutoff date
  const periodCutoff = useMemo(() => {
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }, [period]);

  // Chart data points — parse all, then filter by period
  const chartPoints = useMemo(() => {
    let allPoints: { value: number; date: string }[] = [];

    // Backend returns: [{ date: "2025-03-01", data: [{value, unit, updatedAt}] }, ...]
    if (chartData && Array.isArray(chartData) && chartData.length > 0) {
      // Check if items have nested `data` array (backend chart format)
      if (chartData[0]?.data && Array.isArray(chartData[0].data)) {
        allPoints = chartData
          .filter((d: any) => d.data && d.data.length > 0)
          .map((d: any) => {
            const reading = d.data[0];
            const rawValue = String(reading.value || '');
            const numValue =
              parseFloat(vitalType === 'blood_pressure' ? rawValue.split('/')[0] : rawValue) || 0;
            return { value: numValue, date: d.date };
          });
      } else {
        // Flat array format: [{ value, date }]
        allPoints = chartData.map((d: any) => ({
          value:
            parseFloat(
              vitalType === 'blood_pressure'
                ? String(d.value || '').split('/')[0]
                : String(d.value || '')
            ) || 0,
          date: d.date || d.createdAt || d.updatedAt,
        }));
      }
    } else if (chartData?.data && Array.isArray(chartData.data)) {
      // Object with .data array
      allPoints = chartData.data.map((d: any) => ({
        value:
          parseFloat(
            vitalType === 'blood_pressure'
              ? String(d.value || '').split('/')[0]
              : String(d.value || '')
          ) || 0,
        date: d.date || d.createdAt || d.updatedAt,
      }));
    } else {
      // Fallback: use history for chart
      allPoints = history
        .slice()
        .reverse()
        .map((h) => ({
          value: parseFloat(vitalType === 'blood_pressure' ? h.value.split('/')[0] : h.value) || 0,
          date: h.date,
        }));
    }

    // Filter by selected period
    return allPoints.filter((p) => new Date(p.date) >= periodCutoff);
  }, [chartData, history, vitalType, periodCutoff]);

  // History filtered by period (for the Reading History list)
  const filteredHistory = useMemo(
    () => history.filter((h) => new Date(h.date) >= periodCutoff),
    [history, periodCutoff]
  );

  if (!config) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Vital Detail" onBack={() => navigation.goBack()} />
        <EmptyState
          icon={<Activity size={32} color={colors.mutedForeground} />}
          title="Unknown vital type"
          subtitle="This vital type is not recognized."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title={config.name} onBack={() => navigation.goBack()} />

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
        {/* Current Value Card */}
        <View className="bg-card border border-border rounded-2xl p-5 mb-4">
          <View className="flex-row items-center gap-4">
            <View
              style={{
                backgroundColor: `${config.color}20`,
                width: 56,
                height: 56,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconComponent size={28} color={config.color} />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Current Reading
              </Text>
              {latest ? (
                <>
                  <View className="flex-row items-baseline gap-2">
                    <Text className="text-3xl font-bold text-foreground">
                      {formatVitalValue(latest.value, config.key)}
                    </Text>
                    <Text className="text-sm text-muted-foreground">{config.unit}</Text>
                  </View>
                  <Text className="text-xs text-muted-foreground mt-1">
                    Last updated {timeAgo(latest.date)}
                  </Text>
                </>
              ) : (
                <Text className="text-lg text-muted-foreground">No readings yet</Text>
              )}
            </View>
            {latest && <StatusBadge status={latest.status} size="md" />}
          </View>
        </View>

        {/* Period Selector */}
        <View className="mb-4">
          <TabBar tabs={PERIOD_TABS} activeTab={period} onChange={setPeriod} />
        </View>

        {/* Chart Area */}
        <View className="mb-6" onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
          {isLoading && chartPoints.length === 0 ? (
            <View className="bg-card border border-border rounded-2xl p-3">
              <Skeleton height={180} borderRadius={16} />
            </View>
          ) : (
            <SimpleLineChart data={chartPoints} config={config} width={chartWidth} />
          )}
        </View>

        {/* Normal Range Reference */}
        <View className="flex-row items-center gap-2 bg-card border border-border rounded-2xl p-3 mb-6">
          <View className="w-8 h-8 rounded-full bg-success/10 items-center justify-center">
            <Info size={16} color={colors.success} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-foreground">Normal Range</Text>
            <Text className="text-xs text-muted-foreground">
              {config.normalRange.min} - {config.normalRange.max} {config.unit}
            </Text>
          </View>
        </View>

        {/* History */}
        <Text className="text-sm font-bold text-foreground mb-3 px-1">Reading History</Text>

        {filteredHistory.length === 0 ? (
          <View className="bg-card border border-border rounded-2xl p-8 items-center">
            <Clock size={32} color={colors.mutedForeground} />
            <Text className="text-sm text-muted-foreground mt-2">No readings in this period</Text>
          </View>
        ) : (
          filteredHistory.map((entry, index) => (
            <View
              key={`${entry.date}-${index}`}
              className="bg-card border border-border rounded-2xl p-4 mb-2"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground mb-0.5">
                    {formatDateTime(entry.date)}
                  </Text>
                  <View className="flex-row items-baseline gap-1.5">
                    <Text className="text-lg font-bold text-foreground">
                      {formatVitalValue(entry.value, config.key)}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {entry.unit || config.unit}
                    </Text>
                  </View>
                </View>
                <StatusBadge status={entry.status} />
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB: Log Reading */}
      <View className="absolute bottom-6 left-5 right-5">
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Log ${config?.name || 'vital'} reading`}
          onPress={() => navigation.navigate('LogVitals', { vitalType })}
          className="bg-primary rounded-2xl h-14 flex-row items-center justify-center shadow-lg"
        >
          <Plus size={20} color={colors.white} />
          <Text className="text-base font-bold text-white ml-2">Log Reading</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
