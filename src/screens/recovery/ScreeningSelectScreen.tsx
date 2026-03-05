import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {ClipboardCheck, Star, Clock, ChevronRight} from 'lucide-react-native';
import {Header} from '../../components/ui';
import {colors} from '../../theme/colors';
import {recoveryService} from '../../services/recovery.service';

const INSTRUMENTS = [
  {
    id: 'audit',
    name: 'AUDIT',
    full: 'Alcohol Use Disorders Identification Test',
    desc: 'Screens for hazardous and harmful alcohol use.',
    time: '2-3 min',
    target: 'Alcohol',
    color: '#f59e0b',
  },
  {
    id: 'dast10',
    name: 'DAST-10',
    full: 'Drug Abuse Screening Test',
    desc: 'Identifies drug use problems.',
    time: '2-3 min',
    target: 'All drugs',
    color: '#8b5cf6',
  },
  {
    id: 'cage',
    name: 'CAGE',
    full: 'CAGE Questionnaire',
    desc: 'Quick alcohol dependence screening.',
    time: '1-2 min',
    target: 'Alcohol',
    color: '#10b981',
  },
  {
    id: 'assist',
    name: 'ASSIST',
    full: 'Alcohol, Smoking, Substance Involvement Screening Test',
    desc: 'Comprehensive multi-substance screening.',
    time: '5-10 min',
    target: 'Multiple',
    color: '#0ea5e9',
  },
];

export default function ScreeningSelectScreen() {
  const navigation = useNavigation<any>();
  const [recommended, setRecommended] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    loadRecommended();
  }, []);

  const loadRecommended = async () => {
    try {
      const data = await recoveryService.getRecommendedInstrument();
      setRecommended(data.instrument);
      setReason(data.reason);
    } catch {
      // ignore
    }
  };

  const startScreening = async (instrumentId: string) => {
    setStarting(instrumentId);
    try {
      const data = await recoveryService.beginScreening(instrumentId as any);
      navigation.navigate('ScreeningFlow', {
        instrument: instrumentId,
        questions: data.questions,
      });
    } catch {
      // ignore
    } finally {
      setStarting(null);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Screening Tools" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{padding: 16, paddingBottom: 40, gap: 12}}
        showsVerticalScrollIndicator={false}>
        <Text style={{fontSize: 13, color: colors.mutedForeground, lineHeight: 20, marginBottom: 4}}>
          Validated screening instruments to assess your current status and track progress over time.
        </Text>

        {INSTRUMENTS.map(inst => {
          const isRecommended = recommended === inst.id;
          return (
            <TouchableOpacity
              key={inst.id}
              activeOpacity={0.7}
              onPress={() => startScreening(inst.id)}
              disabled={starting !== null}
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: isRecommended ? `${colors.accent}40` : colors.border,
                borderRadius: 16,
                padding: 16,
              }}>
              {isRecommended && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    marginBottom: 8,
                    backgroundColor: `${colors.accent}15`,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    alignSelf: 'flex-start',
                  }}>
                  <Star size={10} color={colors.accent} />
                  <Text style={{fontSize: 10, fontWeight: '700', color: colors.accent}}>
                    RECOMMENDED
                  </Text>
                </View>
              )}

              <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: `${inst.color}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <ClipboardCheck size={20} color={inst.color} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={{fontSize: 15, fontWeight: '700', color: colors.foreground}}>
                    {inst.name}
                  </Text>
                  <Text style={{fontSize: 11, color: colors.mutedForeground, marginTop: 1}}>
                    {inst.full}
                  </Text>
                  <Text style={{fontSize: 12, color: colors.foreground, marginTop: 4, lineHeight: 18}}>
                    {inst.desc}
                  </Text>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                      <Clock size={10} color={colors.mutedForeground} />
                      <Text style={{fontSize: 10, color: colors.mutedForeground}}>{inst.time}</Text>
                    </View>
                    <Text style={{fontSize: 10, color: colors.mutedForeground}}>
                      Target: {inst.target}
                    </Text>
                  </View>
                </View>
                {starting === inst.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <ChevronRight size={16} color={colors.mutedForeground} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
