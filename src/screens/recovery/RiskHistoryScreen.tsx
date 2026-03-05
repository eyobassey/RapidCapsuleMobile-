import React, {useCallback, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {TrendingUp, AlertTriangle, ChevronDown, ChevronRight} from 'lucide-react-native';
import {Header} from '../../components/ui';
import RiskBadge from '../../components/recovery/RiskBadge';
import LineChart from '../../components/charts/LineChart';
import {colors} from '../../theme/colors';
import {recoveryService} from '../../services/recovery.service';
import type {RiskReport} from '../../types/recovery.types';

export default function RiskHistoryScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [currentRisk, setCurrentRisk] = useState<RiskReport | null>(null);
  const [history, setHistory] = useState<RiskReport[]>([]);
  const [reports, setReports] = useState<RiskReport[]>([]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');

  const loadAll = useCallback(async () => {
    await Promise.allSettled([
      recoveryService.getCurrentRisk().then(setCurrentRisk).catch(() => {}),
      recoveryService.getRiskHistory(period).then(data => setHistory(data)).catch(() => {}),
      recoveryService.getRiskAssessmentReports({limit: 20}).then(setReports).catch(() => {}),
    ]);
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const chartData = history.map(r => ({date: r.created_at, value: r.risk_score}));

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Risk Assessment" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{padding: 16, paddingBottom: 40, gap: 16}}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }>
        {/* Current Risk Hero */}
        {currentRisk && (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 20,
              padding: 20,
              alignItems: 'center',
            }}>
            <AlertTriangle size={24} color="#f97316" />
            <Text style={{fontSize: 40, fontWeight: '800', color: colors.foreground, marginTop: 4}}>
              {currentRisk.risk_score}
            </Text>
            <Text style={{fontSize: 12, color: colors.mutedForeground, fontWeight: '600', marginBottom: 8}}>
              Risk Score (0-100)
            </Text>
            <RiskBadge level={currentRisk.risk_level} size="md" />

            {currentRisk.signals && currentRisk.signals.length > 0 && (
              <View style={{width: '100%', marginTop: 16, gap: 6}}>
                <Text style={{fontSize: 12, fontWeight: '700', color: colors.foreground}}>
                  Top Risk Factors
                </Text>
                {currentRisk.signals.slice(0, 5).map((sig, i) => (
                  <View key={i} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                    <Text style={{fontSize: 12, color: colors.mutedForeground, flex: 1}}>
                      {sig.name}
                    </Text>
                    <Text style={{fontSize: 12, fontWeight: '600', color: colors.foreground}}>
                      {sig.weight}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Period Selector */}
        <View style={{flexDirection: 'row', gap: 8}}>
          {['7d', '30d', '90d'].map(p => (
            <TouchableOpacity
              key={p}
              activeOpacity={0.7}
              onPress={() => setPeriod(p)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: period === p ? colors.primary : colors.muted,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: period === p ? colors.white : colors.mutedForeground,
                }}>
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Risk Trend Chart */}
        {chartData.length > 1 && (
          <LineChart
            data={chartData}
            color="#f97316"
            height={160}
            label="Risk Score Trend"
            range={{min: 0, max: 100}}
          />
        )}

        {/* Risk Assessment Reports */}
        {reports.length > 0 && (
          <View style={{gap: 10}}>
            <Text style={{fontSize: 13, fontWeight: '700', color: colors.foreground}}>
              Assessment Reports
            </Text>
            {reports.map(report => {
              const isOpen = expandedReport === report._id;
              return (
                <View
                  key={report._id}
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    overflow: 'hidden',
                  }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setExpandedReport(isOpen ? null : report._id)}
                    style={{padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10}}>
                    <View style={{flex: 1}}>
                      <Text style={{fontSize: 13, fontWeight: '600', color: colors.foreground}}>
                        Score: {report.risk_score}
                      </Text>
                      <Text style={{fontSize: 11, color: colors.mutedForeground}}>
                        {formatDate(report.created_at)}
                      </Text>
                    </View>
                    <RiskBadge level={report.risk_level} />
                    {isOpen ? (
                      <ChevronDown size={14} color={colors.mutedForeground} />
                    ) : (
                      <ChevronRight size={14} color={colors.mutedForeground} />
                    )}
                  </TouchableOpacity>

                  {isOpen && report.factors && report.factors.length > 0 && (
                    <View style={{paddingHorizontal: 14, paddingBottom: 14, gap: 4}}>
                      <Text style={{fontSize: 12, fontWeight: '700', color: colors.foreground, marginBottom: 4}}>
                        Contributing Factors
                      </Text>
                      {report.factors.map((factor, i) => (
                        <View key={i} style={{flexDirection: 'row', gap: 8}}>
                          <View style={{width: 4, height: 4, borderRadius: 2, backgroundColor: '#f97316', marginTop: 6}} />
                          <Text style={{flex: 1, fontSize: 12, color: colors.mutedForeground}}>{factor}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {!currentRisk && reports.length === 0 && (
          <View style={{alignItems: 'center', paddingTop: 40, paddingHorizontal: 40}}>
            <TrendingUp size={40} color={colors.mutedForeground} />
            <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground, marginTop: 12}}>
              No risk assessments yet
            </Text>
            <Text style={{fontSize: 12, color: colors.mutedForeground, textAlign: 'center', marginTop: 4}}>
              Risk scores are calculated based on your check-ins and activity.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
}
