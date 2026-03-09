import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Heart, Check, ChevronRight} from 'lucide-react-native';
import {Header, Button} from '../../components/ui';
import {colors} from '../../theme/colors';
import {recoveryService} from '../../services/recovery.service';
import {useRecoveryStore} from '../../store/recovery';
import type {SubstanceHistory, CareLevel} from '../../types/recovery.types';

const SUBSTANCES = [
  'alcohol', 'opioids', 'cannabis', 'cocaine', 'amphetamines',
  'benzodiazepines', 'tobacco', 'inhalants', 'hallucinogens', 'sedatives', 'other',
];

const CARE_LEVELS: Array<{value: CareLevel; label: string; desc: string}> = [
  {value: 'outpatient', label: 'Outpatient', desc: 'Regular scheduled visits'},
  {value: 'intensive_outpatient', label: 'Intensive Outpatient', desc: 'Multiple sessions per week'},
  {value: 'aftercare', label: 'Aftercare', desc: 'Post-treatment support'},
  {value: 'maintenance', label: 'Maintenance', desc: 'Long-term recovery management'},
];

export default function RecoveryEnrollScreen() {
  const navigation = useNavigation<any>();
  const fetchProfile = useRecoveryStore(s => s.fetchProfile);

  const [selectedSubstances, setSelectedSubstances] = useState<string[]>([]);
  const [primarySubstance, setPrimarySubstance] = useState<string | null>(null);
  const [careLevel, setCareLevel] = useState<CareLevel>('outpatient');
  const [sobrietyDate, setSobrietyDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: substances, 1: details, 2: consent

  const toggleSubstance = (s: string) => {
    setSelectedSubstances(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s],
    );
    if (primarySubstance === s) setPrimarySubstance(null);
  };

  const handleEnroll = async () => {
    if (selectedSubstances.length === 0) {
      Alert.alert('Required', 'Please select at least one substance.');
      return;
    }

    setLoading(true);
    try {
      const substance_use_history: SubstanceHistory[] = selectedSubstances.map(s => ({
        substance: s,
        is_primary: s === primarySubstance,
      }));

      await recoveryService.createProfile({
        substance_use_history,
        sobriety_start_date: sobrietyDate.toISOString(),
        care_level: careLevel,
        consent: {
          treatment_consent: true,
          ai_companion_consent: true,
          data_sharing_consent: true,
        },
      });

      await fetchProfile();
      navigation.replace('RecoveryDashboard');
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Failed to create recovery profile.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Recovery Program" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{padding: 20, paddingBottom: 40}}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{alignItems: 'center', marginBottom: 24}}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: `${colors.accent}15`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}>
            <Heart size={32} color={colors.accent} />
          </View>
          <Text style={{fontSize: 20, fontWeight: '700', color: colors.foreground, textAlign: 'center'}}>
            Begin Your Recovery Journey
          </Text>
          <Text style={{fontSize: 13, color: colors.mutedForeground, textAlign: 'center', marginTop: 6, lineHeight: 20}}>
            We're here to support you every step of the way with evidence-based tools and compassionate care.
          </Text>
        </View>

        {/* Step indicator */}
        <View style={{flexDirection: 'row', gap: 8, marginBottom: 24}}>
          {['Substances', 'Details', 'Confirm'].map((label, i) => (
            <View key={i} style={{flex: 1, alignItems: 'center', gap: 4}}>
              <View
                style={{
                  height: 4,
                  width: '100%',
                  borderRadius: 2,
                  backgroundColor: i <= step ? colors.accent : colors.muted,
                }}
              />
              <Text style={{fontSize: 10, color: i <= step ? colors.accent : colors.mutedForeground, fontWeight: '600'}}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Step 0: Substances */}
        {step === 0 && (
          <View style={{gap: 12}}>
            <Text style={{fontSize: 15, fontWeight: '700', color: colors.foreground}}>
              Which substances apply to you?
            </Text>
            <Text style={{fontSize: 12, color: colors.mutedForeground, lineHeight: 18}}>
              Select all that apply. Tap again to set as primary.
            </Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4}}>
              {SUBSTANCES.map(s => {
                const isSelected = selectedSubstances.includes(s);
                const isPrimary = primarySubstance === s;
                return (
                  <TouchableOpacity
                    key={s}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (isSelected && !isPrimary) {
                        setPrimarySubstance(s);
                      } else {
                        toggleSubstance(s);
                      }
                    }}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`${s.replace('_', ' ')}${isPrimary ? ', primary' : ''}`}
                    accessibilityState={{checked: isSelected}}
                    style={{
                      backgroundColor: isPrimary
                        ? colors.accent
                        : isSelected
                        ? `${colors.accent}20`
                        : colors.muted,
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    {isSelected && <Check size={14} color={isPrimary ? colors.white : colors.accent} />}
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: isPrimary
                          ? colors.white
                          : isSelected
                          ? colors.accent
                          : colors.foreground,
                        textTransform: 'capitalize',
                      }}>
                      {s.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              variant="primary"
              onPress={() => setStep(1)}
              disabled={selectedSubstances.length === 0}
              style={{marginTop: 16}}>
              Continue
            </Button>
          </View>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <View style={{gap: 16}}>
            {/* Sobriety date */}
            <View>
              <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8}}>
                Sobriety Start Date
              </Text>
              {/* Quick date presets */}
              <View style={{gap: 8}}>
                {[
                  {label: 'Today', days: 0},
                  {label: '1 Week Ago', days: 7},
                  {label: '1 Month Ago', days: 30},
                  {label: '3 Months Ago', days: 90},
                  {label: '6 Months Ago', days: 180},
                  {label: '1 Year Ago', days: 365},
                ].map(preset => {
                  const presetDate = new Date();
                  presetDate.setDate(presetDate.getDate() - preset.days);
                  const isSelected = sobrietyDate.toDateString() === presetDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={preset.days}
                      activeOpacity={0.7}
                      onPress={() => setSobrietyDate(presetDate)}
                      accessibilityRole="radio"
                      accessibilityLabel={preset.label}
                      accessibilityState={{selected: isSelected}}
                      style={{
                        backgroundColor: isSelected ? `${colors.accent}15` : colors.card,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.accent : colors.border,
                        borderRadius: 12,
                        padding: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <Text style={{fontSize: 13, fontWeight: '600', color: isSelected ? colors.accent : colors.foreground}}>
                        {preset.label}
                      </Text>
                      <Text style={{fontSize: 12, color: colors.mutedForeground}}>
                        {presetDate.toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Care level */}
            <View>
              <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8}}>
                Care Level
              </Text>
              {CARE_LEVELS.map(cl => (
                <TouchableOpacity
                  key={cl.value}
                  activeOpacity={0.7}
                  onPress={() => setCareLevel(cl.value)}
                  accessibilityRole="radio"
                  accessibilityLabel={`${cl.label}, ${cl.desc}`}
                  accessibilityState={{selected: careLevel === cl.value}}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    backgroundColor: careLevel === cl.value ? `${colors.accent}10` : colors.card,
                    borderWidth: 1,
                    borderColor: careLevel === cl.value ? colors.accent : colors.border,
                    borderRadius: 12,
                    marginBottom: 8,
                  }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: careLevel === cl.value ? colors.accent : colors.mutedForeground,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {careLevel === cl.value && (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: colors.accent,
                        }}
                      />
                    )}
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={{fontSize: 13, fontWeight: '600', color: colors.foreground}}>
                      {cl.label}
                    </Text>
                    <Text style={{fontSize: 11, color: colors.mutedForeground}}>
                      {cl.desc}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{flexDirection: 'row', gap: 10}}>
              <Button variant="outline" onPress={() => setStep(0)} style={{flex: 1}}>
                Back
              </Button>
              <Button variant="primary" onPress={() => setStep(2)} style={{flex: 1}}>
                Continue
              </Button>
            </View>
          </View>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <View style={{gap: 16}}>
            {/* Summary */}
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 16,
                gap: 10,
              }}>
              <Text style={{fontSize: 14, fontWeight: '700', color: colors.foreground}}>
                Program Summary
              </Text>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={{fontSize: 12, color: colors.mutedForeground}}>Substances</Text>
                <Text style={{fontSize: 12, fontWeight: '600', color: colors.foreground}}>
                  {selectedSubstances.map(s => s.replace('_', ' ')).join(', ')}
                </Text>
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={{fontSize: 12, color: colors.mutedForeground}}>Sobriety Date</Text>
                <Text style={{fontSize: 12, fontWeight: '600', color: colors.foreground}}>
                  {sobrietyDate.toLocaleDateString()}
                </Text>
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={{fontSize: 12, color: colors.mutedForeground}}>Care Level</Text>
                <Text style={{fontSize: 12, fontWeight: '600', color: colors.foreground, textTransform: 'capitalize'}}>
                  {careLevel.replace('_', ' ')}
                </Text>
              </View>
            </View>

            {/* Consent notice */}
            <View
              style={{
                backgroundColor: `${colors.primary}08`,
                borderRadius: 12,
                padding: 14,
              }}>
              <Text style={{fontSize: 11, color: colors.mutedForeground, lineHeight: 18}}>
                By enrolling, you consent to treatment tracking, AI companion support,
                and secure data sharing with your care team. You can withdraw at any time.
              </Text>
            </View>

            <View style={{flexDirection: 'row', gap: 10}}>
              <Button variant="outline" onPress={() => setStep(1)} style={{flex: 1}}>
                Back
              </Button>
              <Button
                variant="primary"
                onPress={handleEnroll}
                disabled={loading}
                style={{flex: 1}}>
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  'Enroll Now'
                )}
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
