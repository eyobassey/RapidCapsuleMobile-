import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Linking, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Shield,
  Phone,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info,
  Heart,
} from 'lucide-react-native';
import {Header} from '../../components/ui';
import {colors} from '../../theme/colors';
import {recoveryService} from '../../services/recovery.service';
import type {HarmReductionSubstance, SubstanceGuidance} from '../../types/recovery.types';

const HELPLINES = [
  {name: 'Emergency Services', number: '999', desc: 'Life-threatening emergencies'},
  {name: 'Samaritans', number: '116 123', desc: '24/7 emotional support'},
  {name: 'FRANK', number: '0300 123 6600', desc: 'Drug advice & support'},
  {name: 'NHS 111', number: '111', desc: 'Non-emergency medical help'},
];

export default function HarmReductionScreen() {
  const navigation = useNavigation<any>();
  const [substances, setSubstances] = useState<HarmReductionSubstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<Record<string, SubstanceGuidance>>({});
  const [loadingGuidance, setLoadingGuidance] = useState<string | null>(null);

  useEffect(() => {
    loadSubstances();
  }, []);

  const loadSubstances = async () => {
    try {
      const data = await recoveryService.getHarmReductionSubstances();
      setSubstances(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const toggleSubstance = async (substance: string) => {
    if (expanded === substance) {
      setExpanded(null);
      return;
    }
    setExpanded(substance);
    if (!guidance[substance]) {
      setLoadingGuidance(substance);
      try {
        const data = await recoveryService.getSubstanceGuidance(substance);
        setGuidance(prev => ({...prev, [substance]: data}));
      } catch {} finally {
        setLoadingGuidance(null);
      }
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Harm Reduction" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{padding: 16, paddingBottom: 40, gap: 16}}
        showsVerticalScrollIndicator={false}>
        {/* Emergency Resources Banner */}
        <View
          style={{
            backgroundColor: `${colors.destructive}10`,
            borderWidth: 1,
            borderColor: `${colors.destructive}30`,
            borderRadius: 16,
            padding: 16,
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12}}>
            <Phone size={16} color={colors.destructive} />
            <Text style={{fontSize: 13, fontWeight: '700', color: colors.foreground}}>
              Emergency Resources
            </Text>
          </View>
          {HELPLINES.map((line, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => Linking.openURL(`tel:${line.number.replace(/\s/g, '')}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: `${colors.destructive}15`,
              }}>
              <View>
                <Text style={{fontSize: 13, fontWeight: '600', color: colors.foreground}}>
                  {line.name}
                </Text>
                <Text style={{fontSize: 11, color: colors.mutedForeground}}>{line.desc}</Text>
              </View>
              <View
                style={{
                  backgroundColor: `${colors.destructive}15`,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}>
                <Text style={{fontSize: 12, fontWeight: '700', color: colors.destructive}}>
                  {line.number}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Notice */}
        <View
          style={{
            backgroundColor: `${colors.primary}10`,
            borderRadius: 12,
            padding: 12,
            flexDirection: 'row',
            gap: 10,
          }}>
          <Info size={16} color={colors.primary} style={{marginTop: 2}} />
          <Text style={{flex: 1, fontSize: 12, color: colors.mutedForeground, lineHeight: 18}}>
            Harm reduction provides practical strategies to reduce risks. This information does not encourage substance use.
          </Text>
        </View>

        {/* Substance Cards */}
        {loading ? (
          <View style={{paddingTop: 40, alignItems: 'center'}}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : substances.length === 0 ? (
          <View style={{alignItems: 'center', paddingTop: 40, paddingHorizontal: 40}}>
            <Shield size={40} color={colors.mutedForeground} />
            <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground, marginTop: 12}}>
              No substance guides available
            </Text>
          </View>
        ) : (
          <View style={{gap: 10}}>
            <Text style={{fontSize: 13, fontWeight: '700', color: colors.foreground}}>
              Substance Safety Guides
            </Text>
            {substances.map(sub => {
              const isOpen = expanded === sub.substance;
              const g = guidance[sub.substance];
              const isLoadingThis = loadingGuidance === sub.substance;

              return (
                <View
                  key={sub.substance}
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: isOpen ? `${colors.primary}40` : colors.border,
                    borderRadius: 14,
                    overflow: 'hidden',
                  }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleSubstance(sub.substance)}
                    style={{padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10}}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: `${colors.primary}15`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Shield size={16} color={colors.primary} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>
                        {sub.display_name || sub.substance}
                      </Text>
                      {sub.category && (
                        <Text style={{fontSize: 11, color: colors.mutedForeground}}>{sub.category}</Text>
                      )}
                    </View>
                    {isOpen ? (
                      <ChevronDown size={16} color={colors.mutedForeground} />
                    ) : (
                      <ChevronRight size={16} color={colors.mutedForeground} />
                    )}
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={{paddingHorizontal: 14, paddingBottom: 14}}>
                      {isLoadingThis ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{paddingVertical: 16}} />
                      ) : g ? (
                        <View style={{gap: 12}}>
                          {g.safer_use_tips?.length > 0 && (
                            <GuidanceSection
                              title="Safer Use Tips"
                              items={g.safer_use_tips}
                              color={colors.success}
                            />
                          )}
                          {g.overdose_signs?.length > 0 && (
                            <GuidanceSection
                              title="Overdose Signs"
                              items={g.overdose_signs}
                              color={colors.destructive}
                            />
                          )}
                          {g.overdose_response && g.overdose_response.length > 0 && (
                            <GuidanceSection
                              title="Overdose Response"
                              items={g.overdose_response}
                              color="#f59e0b"
                            />
                          )}
                          {g.mixing_dangers && g.mixing_dangers.length > 0 && (
                            <View>
                              <Text style={{fontSize: 12, fontWeight: '700', color: colors.foreground, marginBottom: 6}}>
                                Mixing Dangers
                              </Text>
                              {g.mixing_dangers.map((md, mi) => (
                                <View key={mi} style={{flexDirection: 'row', gap: 8, marginBottom: 4}}>
                                  <View style={{width: 5, height: 5, borderRadius: 3, backgroundColor: '#f97316', marginTop: 6}} />
                                  <Text style={{flex: 1, fontSize: 12, color: colors.mutedForeground, lineHeight: 18}}>
                                    <Text style={{fontWeight: '600', color: colors.foreground}}>{md.substance}: </Text>
                                    {md.risk}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                          {g.withdrawal_warnings && g.withdrawal_warnings.length > 0 && (
                            <GuidanceSection
                              title="Withdrawal Warnings"
                              items={g.withdrawal_warnings}
                              color="#ef4444"
                            />
                          )}
                          {g.long_term_risks && g.long_term_risks.length > 0 && (
                            <GuidanceSection
                              title="Long-Term Risks"
                              items={g.long_term_risks}
                              color="#6366f1"
                            />
                          )}
                          {g.recovery_position && (
                            <View>
                              <Text style={{fontSize: 12, fontWeight: '700', color: colors.foreground, marginBottom: 4}}>
                                Recovery Position
                              </Text>
                              <Text style={{fontSize: 12, color: colors.mutedForeground, lineHeight: 18}}>
                                {g.recovery_position}
                              </Text>
                            </View>
                          )}
                        </View>
                      ) : (
                        <Text style={{fontSize: 12, color: colors.mutedForeground}}>
                          No guidance available for this substance.
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function GuidanceSection({title, items, color}: {title: string; items: string[]; color: string}) {
  return (
    <View>
      <Text style={{fontSize: 12, fontWeight: '700', color: colors.foreground, marginBottom: 6}}>
        {title}
      </Text>
      {items.map((item, i) => (
        <View key={i} style={{flexDirection: 'row', gap: 8, marginBottom: 4}}>
          <View style={{width: 5, height: 5, borderRadius: 3, backgroundColor: color, marginTop: 6}} />
          <Text style={{flex: 1, fontSize: 12, color: colors.mutedForeground, lineHeight: 18}}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}
