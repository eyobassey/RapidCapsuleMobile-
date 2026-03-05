import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {CalendarCheck, SmilePlus, Flame, Brain} from 'lucide-react-native';
import {Header} from '../../components/ui';
import {colors} from '../../theme/colors';
import {recoveryService} from '../../services/recovery.service';
import {formatDate} from '../../utils/formatters';
import type {SobrietyLog} from '../../types/recovery.types';

export default function CheckInHistoryScreen() {
  const navigation = useNavigation<any>();
  const [logs, setLogs] = useState<SobrietyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await recoveryService.getLogs({limit: 30});
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const renderLog = ({item}: {item: SobrietyLog}) => (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 14,
      }}>
      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10}}>
        <Text style={{fontSize: 13, fontWeight: '600', color: colors.foreground}}>
          {formatDate(item.log_date)}
        </Text>
        <View
          style={{
            backgroundColor: item.sober_today ? `${colors.success}20` : `${colors.destructive}20`,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: item.sober_today ? colors.success : colors.destructive,
            }}>
            {item.sober_today ? 'Sober' : 'Relapse'}
          </Text>
        </View>
      </View>

      <View style={{flexDirection: 'row', gap: 8}}>
        {item.mood_score != null && (
          <MetricPill icon={<SmilePlus size={12} color={colors.primary} />} label="Mood" value={`${item.mood_score}/10`} />
        )}
        {item.craving_intensity != null && (
          <MetricPill icon={<Flame size={12} color={colors.secondary} />} label="Craving" value={`${item.craving_intensity}/10`} />
        )}
        {item.anxiety_level != null && (
          <MetricPill icon={<Brain size={12} color="#8b5cf6" />} label="Anxiety" value={`${item.anxiety_level}/10`} />
        )}
      </View>

      {item.gratitude_note ? (
        <Text
          numberOfLines={2}
          style={{fontSize: 11, color: colors.mutedForeground, marginTop: 8, fontStyle: 'italic'}}>
          "{item.gratitude_note}"
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Check-in History" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item._id}
          contentContainerStyle={{padding: 16, gap: 10}}
          renderItem={renderLog}
          ListEmptyComponent={
            <View style={{alignItems: 'center', paddingTop: 60, paddingHorizontal: 40}}>
              <CalendarCheck size={40} color={colors.mutedForeground} />
              <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground, marginTop: 12}}>
                No check-ins yet
              </Text>
              <Text style={{fontSize: 12, color: colors.mutedForeground, textAlign: 'center', marginTop: 4}}>
                Start your daily check-ins to track your progress.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function MetricPill({icon, label, value}: {icon: React.ReactNode; label: string; value: string}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.muted,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}>
      {icon}
      <Text style={{fontSize: 10, color: colors.mutedForeground}}>{label}</Text>
      <Text style={{fontSize: 10, fontWeight: '700', color: colors.foreground}}>{value}</Text>
    </View>
  );
}
