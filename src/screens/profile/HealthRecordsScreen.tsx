import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  FileText,
  Activity,
  AlertTriangle,
  Stethoscope,
  Pill,
  Heart,
  ChevronRight,
  Clock,
  Shield,
  Users,
} from 'lucide-react-native';

import {useAuthStore} from '../../store/auth';
import {healthCheckupService} from '../../services/healthCheckup.service';
import {Header} from '../../components/ui';
import {colors} from '../../theme/colors';
import {formatDate} from '../../utils/formatters';

export default function HealthRecordsScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore(s => s.user);
  const [checkups, setCheckups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const history = await healthCheckupService.getHistory({limit: 5});
      setCheckups(Array.isArray(history) ? history : history?.checkups || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Extract data from user object
  const medHistory = user?.medical_history || (user?.profile as any)?.medical_history;
  const allergies = user?.allergies;
  const preExisting = user?.pre_existing_conditions;
  const profile = user?.profile as any;

  // Counts
  const conditionsCount = medHistory?.chronic_conditions?.length || 0;
  const medicationsCount = medHistory?.current_medications?.length || 0;
  const surgeriesCount = medHistory?.past_surgeries?.length || 0;
  const allergyCount =
    (allergies?.drug_allergies?.length || 0) +
    (allergies?.food_allergies?.length || 0) +
    (allergies?.environmental_allergies?.length || 0) +
    (allergies?.other_allergies?.length || 0);
  const hasAllergies = allergies?.has_allergies;
  const preExistingCount = preExisting?.length || 0;

  // Vitals
  const height = profile?.height?.value || profile?.basic_health_info?.height?.value;
  const weight = profile?.weight?.value || profile?.basic_health_info?.weight?.value;
  const bloodType = profile?.blood_type;
  const genotype = profile?.genotype;
  let bmi: string | null = null;
  if (height && weight) {
    const hm = parseFloat(height) / 100;
    bmi = (parseFloat(weight) / (hm * hm)).toFixed(1);
  }

  const getTriageColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'emergency':
        return colors.destructive;
      case 'consultation':
        return colors.secondary;
      case 'consultation_24':
        return colors.accent;
      case 'self_care':
        return colors.success;
      default:
        return colors.mutedForeground;
    }
  };

  const getTriageLabel = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'emergency':
        return 'Emergency';
      case 'consultation':
        return 'See Doctor';
      case 'consultation_24':
        return 'Within 24h';
      case 'self_care':
        return 'Self Care';
      default:
        return level || 'Unknown';
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Health Records" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{padding: 16, paddingBottom: 40, gap: 16}}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }>
          {/* Vitals Summary */}
          <SectionCard
            icon={<Activity size={18} color={colors.primary} />}
            title="Vitals & Metrics"
            onPress={() => navigation.navigate('VitalsMetrics')}>
            {height || weight || bloodType || genotype ? (
              <View style={{gap: 8, marginTop: 12}}>
                <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                  {height ? (
                    <MetricBadge label="Height" value={`${height} cm`} />
                  ) : null}
                  {weight ? (
                    <MetricBadge label="Weight" value={`${weight} kg`} />
                  ) : null}
                  {bmi ? <MetricBadge label="BMI" value={bmi} /> : null}
                  {bloodType ? (
                    <MetricBadge label="Blood" value={bloodType} />
                  ) : null}
                  {genotype ? (
                    <MetricBadge label="Genotype" value={genotype} />
                  ) : null}
                </View>
              </View>
            ) : (
              <EmptyState text="No vitals recorded yet" />
            )}
          </SectionCard>

          {/* Medical History */}
          <SectionCard
            icon={<Stethoscope size={18} color={colors.accent} />}
            title="Medical History"
            onPress={() => navigation.navigate('MedicalHistory')}>
            {conditionsCount + medicationsCount + surgeriesCount > 0 ? (
              <View style={{gap: 6, marginTop: 12}}>
                {conditionsCount > 0 ? (
                  <InfoRow
                    label="Chronic Conditions"
                    value={medHistory.chronic_conditions.slice(0, 3).join(', ')}
                    count={conditionsCount}
                  />
                ) : null}
                {medicationsCount > 0 ? (
                  <InfoRow
                    label="Medications"
                    value={medHistory.current_medications
                      .slice(0, 2)
                      .map((m: any) => (typeof m === 'string' ? m : m.name || ''))
                      .join(', ')}
                    count={medicationsCount}
                  />
                ) : null}
                {surgeriesCount > 0 ? (
                  <InfoRow
                    label="Surgeries"
                    value={medHistory.past_surgeries
                      .slice(0, 2)
                      .map((s: any) => (typeof s === 'string' ? s : s.procedure || ''))
                      .join(', ')}
                    count={surgeriesCount}
                  />
                ) : null}
              </View>
            ) : (
              <EmptyState text="No medical history recorded" />
            )}
          </SectionCard>

          {/* Allergies */}
          <SectionCard
            icon={<AlertTriangle size={18} color={colors.secondary} />}
            title="Allergies"
            onPress={() => navigation.navigate('Allergies')}>
            {hasAllergies === false ? (
              <View
                style={{
                  marginTop: 12,
                  backgroundColor: `${colors.success}15`,
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                }}>
                <Text style={{fontSize: 13, color: colors.success, fontWeight: '600'}}>
                  No known allergies
                </Text>
              </View>
            ) : allergyCount > 0 ? (
              <View style={{gap: 6, marginTop: 12}}>
                {(allergies?.drug_allergies?.length || 0) > 0 ? (
                  <InfoRow
                    label="Drug"
                    value={allergies.drug_allergies
                      .slice(0, 2)
                      .map((a: any) => a.drug_name || '')
                      .join(', ')}
                    count={allergies.drug_allergies.length}
                  />
                ) : null}
                {(allergies?.food_allergies?.length || 0) > 0 ? (
                  <InfoRow
                    label="Food"
                    value={allergies.food_allergies
                      .slice(0, 2)
                      .map((a: any) => a.food_name || '')
                      .join(', ')}
                    count={allergies.food_allergies.length}
                  />
                ) : null}
                {(allergies?.environmental_allergies?.length || 0) > 0 ? (
                  <InfoRow
                    label="Environmental"
                    value={allergies.environmental_allergies
                      .slice(0, 2)
                      .map((a: any) => a.allergen || '')
                      .join(', ')}
                    count={allergies.environmental_allergies.length}
                  />
                ) : null}
              </View>
            ) : (
              <EmptyState text="No allergy data recorded" />
            )}
          </SectionCard>

          {/* Dependants */}
          <SectionCard
            icon={<Users size={18} color={colors.primary} />}
            title="Dependants"
            onPress={() => navigation.navigate('Dependants')}>
            {user?.dependants?.length ? (
              <View style={{gap: 6, marginTop: 12}}>
                {user.dependants.slice(0, 4).map((d: any, i: number) => {
                  const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || d.name || 'Unnamed';
                  return (
                    <InfoRow
                      key={i}
                      label={d.relationship || 'Dependant'}
                      value={name}
                      count={i + 1}
                    />
                  );
                })}
                {user.dependants.length > 4 && (
                  <Text style={{fontSize: 12, color: colors.mutedForeground}}>
                    +{user.dependants.length - 4} more
                  </Text>
                )}
              </View>
            ) : (
              <EmptyState text="No dependants added yet" />
            )}
          </SectionCard>

          {/* Pre-existing Conditions */}
          {preExistingCount > 0 ? (
            <SectionCard
              icon={<Shield size={18} color={colors.destructive} />}
              title="Pre-existing Conditions">
              <View style={{gap: 4, marginTop: 12}}>
                {preExisting!.slice(0, 5).map((condition: any, i: number) => (
                  <Text key={i} style={{fontSize: 13, color: colors.foreground}}>
                    {typeof condition === 'string' ? condition : condition.name || condition.condition || ''}
                  </Text>
                ))}
                {preExistingCount > 5 ? (
                  <Text style={{fontSize: 12, color: colors.mutedForeground}}>
                    +{preExistingCount - 5} more
                  </Text>
                ) : null}
              </View>
            </SectionCard>
          ) : null}

          {/* Recent Health Checkups */}
          <View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}>
              <Text style={{fontSize: 16, fontWeight: '700', color: colors.foreground}}>
                Recent Health Checkups
              </Text>
              {checkups.length > 0 ? (
                <TouchableOpacity onPress={() => navigation.navigate('Home' as any, {screen: 'HealthCheckupHistory'})}>
                  <Text style={{fontSize: 13, color: colors.primary, fontWeight: '600'}}>
                    View All
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {checkups.length > 0 ? (
              <View style={{gap: 10}}>
                {checkups.map((checkup: any, index: number) => {
                  const triageLevel =
                    checkup.response?.data?.triage_level ||
                    checkup.triage_level ||
                    '';
                  const conditions =
                    checkup.response?.data?.conditions || checkup.conditions || [];
                  const topCondition = conditions[0];
                  const date = checkup.created_at || checkup.createdAt;

                  return (
                    <TouchableOpacity
                      key={checkup._id || index}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Health checkup: ${topCondition?.common_name || topCondition?.name || 'Health Checkup'}, ${getTriageLabel(triageLevel)}`}
                      accessibilityHint="Double tap to view details"
                      onPress={() => {
                        if (checkup._id) {
                          navigation.navigate('Home' as any, {
                            screen: 'HealthCheckupDetail',
                            params: {id: checkup._id},
                          });
                        }
                      }}
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: `${getTriageColor(triageLevel)}15`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Heart size={18} color={getTriageColor(triageLevel)} />
                      </View>
                      <View style={{flex: 1}}>
                        <Text
                          style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}
                          numberOfLines={1}>
                          {topCondition?.common_name || topCondition?.name || 'Health Checkup'}
                        </Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3}}>
                          <View
                            style={{
                              backgroundColor: `${getTriageColor(triageLevel)}20`,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 8,
                            }}>
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '700',
                                color: getTriageColor(triageLevel),
                              }}>
                              {getTriageLabel(triageLevel)}
                            </Text>
                          </View>
                          {date ? (
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 3}}>
                              <Clock size={10} color={colors.mutedForeground} />
                              <Text style={{fontSize: 11, color: colors.mutedForeground}}>
                                {formatDate(date)}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                      <ChevronRight size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 24,
                  alignItems: 'center',
                }}>
                <FileText size={32} color={colors.mutedForeground} />
                <Text style={{fontSize: 13, color: colors.mutedForeground, marginTop: 8}}>
                  No health checkups yet
                </Text>
                <Text style={{fontSize: 11, color: colors.mutedForeground, marginTop: 2}}>
                  Start a health checkup to get AI-powered insights
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  onPress,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      accessibilityHint={onPress ? 'Double tap to view details' : undefined}
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 16,
      }}>
      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {icon}
          </View>
          <Text style={{fontSize: 15, fontWeight: '700', color: colors.foreground}}>
            {title}
          </Text>
        </View>
        {onPress ? <ChevronRight size={16} color={colors.mutedForeground} /> : null}
      </View>
      {children}
    </TouchableOpacity>
  );
}

function MetricBadge({label, value}: {label: string; value: string}) {
  return (
    <View
      style={{
        backgroundColor: `${colors.primary}10`,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}>
      <Text style={{fontSize: 10, color: colors.mutedForeground, fontWeight: '600'}}>{label}</Text>
      <Text style={{fontSize: 14, color: colors.foreground, fontWeight: '700'}}>{value}</Text>
    </View>
  );
}

function InfoRow({label, value, count}: {label: string; value: string; count: number}) {
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
      <View
        style={{
          backgroundColor: `${colors.accent}20`,
          borderRadius: 6,
          paddingHorizontal: 6,
          paddingVertical: 2,
        }}>
        <Text style={{fontSize: 10, fontWeight: '700', color: colors.accent}}>{count}</Text>
      </View>
      <Text style={{fontSize: 12, color: colors.mutedForeground, fontWeight: '600'}}>{label}:</Text>
      <Text style={{flex: 1, fontSize: 12, color: colors.foreground}} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function EmptyState({text}: {text: string}) {
  return (
    <View
      style={{
        marginTop: 12,
        backgroundColor: colors.muted,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
      }}>
      <Text style={{fontSize: 12, color: colors.mutedForeground}}>{text}</Text>
    </View>
  );
}
