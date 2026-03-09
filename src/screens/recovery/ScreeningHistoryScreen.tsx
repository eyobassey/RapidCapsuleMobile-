import React, {useCallback, useState} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator, ScrollView} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {ClipboardCheck} from 'lucide-react-native';
import {Header} from '../../components/ui';
import RiskBadge from '../../components/recovery/RiskBadge';
import LineChart from '../../components/charts/LineChart';
import {colors} from '../../theme/colors';
import {useRecoveryStore} from '../../store/recovery';
import {formatDate} from '../../utils/formatters';
import type {ScreeningResult, ScreeningInstrument} from '../../types/recovery.types';

const INSTRUMENTS: Array<{value: string | null; label: string}> = [
  {value: null, label: 'All'},
  {value: 'audit', label: 'AUDIT'},
  {value: 'dast10', label: 'DAST-10'},
  {value: 'cage', label: 'CAGE'},
  {value: 'assist', label: 'ASSIST'},
  {value: 'ciwa_ar', label: 'CIWA-Ar'},
  {value: 'cows', label: 'COWS'},
];

export default function ScreeningHistoryScreen() {
  const navigation = useNavigation<any>();
  const history = useRecoveryStore(s => s.screeningHistory);
  const isLoading = useRecoveryStore(s => s.isLoading);
  const fetchScreeningHistory = useRecoveryStore(s => s.fetchScreeningHistory);
  const [filter, setFilter] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchScreeningHistory();
    }, []),
  );

  const filtered = filter
    ? history.filter(s => s.instrument === filter)
    : history;

  // Build chart data from filtered history (oldest first)
  const chartData = [...filtered]
    .reverse()
    .map(s => ({date: s.created_at, value: s.total_score}));

  const renderHeader = () => (
    <View style={{gap: 12, marginBottom: 16}}>
      {/* Instrument Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow: 0}}>
        <View style={{flexDirection: 'row', gap: 6}}>
          {INSTRUMENTS.map(inst => (
            <TouchableOpacity
              key={inst.value || 'all'}
              activeOpacity={0.7}
              onPress={() => setFilter(inst.value)}
              accessibilityRole="tab"
              accessibilityLabel={inst.label}
              accessibilityState={{selected: filter === inst.value}}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 10,
                backgroundColor: filter === inst.value ? colors.primary : colors.muted,
              }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: filter === inst.value ? colors.white : colors.mutedForeground,
                }}>
                {inst.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Score Trend Chart */}
      {chartData.length > 1 && (
        <LineChart
          data={chartData}
          color={colors.primary}
          height={150}
          label="Score Trend"
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Screening History" onBack={() => navigation.goBack()} />

      <FlashList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={{padding: 16}}
        ListHeaderComponent={renderHeader}
        estimatedItemSize={80}
        renderItem={({item}) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('ScreeningResult', {
                screeningId: item._id,
                result: item,
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`${item.instrument?.toUpperCase()} screening, score ${item.total_score}`}
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${colors.primary}15`,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <ClipboardCheck size={18} color={colors.primary} />
            </View>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>
                {item.instrument?.toUpperCase()}
              </Text>
              <Text style={{fontSize: 11, color: colors.mutedForeground, marginTop: 2}}>
                Score: {item.total_score} {'\u2022'} {formatDate(item.created_at)}
              </Text>
            </View>
            <RiskBadge level={item.risk_level} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={{alignItems: 'center', paddingTop: 60}}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={{alignItems: 'center', paddingTop: 60, paddingHorizontal: 40}}>
              <ClipboardCheck size={40} color={colors.mutedForeground} />
              <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground, marginTop: 12}}>
                No screenings yet
              </Text>
              <Text style={{fontSize: 12, color: colors.mutedForeground, textAlign: 'center', marginTop: 4}}>
                Complete a screening to track your progress over time.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

