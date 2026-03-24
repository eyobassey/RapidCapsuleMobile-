import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Pill, Activity, ClipboardCheck, Calendar } from 'lucide-react-native';
import { Header } from '../../components/ui';
import { colors } from '../../theme/colors';
import { useRecoveryStore } from '../../store/recovery';
import type { MATMedication } from '../../types/recovery.types';

const COMPLIANCE_CONFIG: Record<string, { color: string; bg: string }> = {
  excellent: { color: colors.success, bg: `${colors.success}20` },
  good: { color: colors.primary, bg: `${colors.primary}20` },
  fair: { color: '#f59e0b', bg: '#f59e0b20' },
  poor: { color: colors.destructive, bg: `${colors.destructive}20` },
};

export default function MATDashboardScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  const matCompliance = useRecoveryStore((s) => s.matCompliance);
  const fetchMATCompliance = useRecoveryStore((s) => s.fetchMATCompliance);

  useFocusEffect(
    useCallback(() => {
      fetchMATCompliance();
    }, [fetchMATCompliance])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMATCompliance();
    setRefreshing(false);
  };

  if (!matCompliance) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <Header title="Medication" onBack={() => navigation.goBack()} />
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <Pill size={48} color={colors.mutedForeground} />
          <Text
            style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginTop: 16 }}
          >
            No MAT Medications
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.mutedForeground,
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            You don't have any medication-assisted treatment prescribed. This will appear if your
            specialist prescribes MAT medications.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const compCfg = COMPLIANCE_CONFIG[matCompliance.compliance_level] ??
    COMPLIANCE_CONFIG.fair ?? { color: colors.secondary, bg: `${colors.secondary}20` };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Header title="Medication" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Compliance Hero */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            padding: 20,
            alignItems: 'center',
          }}
        >
          <Activity size={24} color={compCfg.color} />
          <View
            style={{
              backgroundColor: compCfg.bg,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 6,
              marginTop: 10,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: compCfg.color,
                textTransform: 'capitalize',
              }}
            >
              {matCompliance.compliance_level}
            </Text>
          </View>
          <Text
            style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '600', marginTop: 4 }}
          >
            Compliance Level
          </Text>

          <View style={{ flexDirection: 'row', gap: 24, marginTop: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
                {Math.round(matCompliance.check_in_rate || 0)}%
              </Text>
              <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: '600' }}>
                Check-in Rate
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
                {matCompliance.screening_completion || 0}
              </Text>
              <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: '600' }}>
                Screenings
              </Text>
            </View>
          </View>
        </View>

        {/* Medications List */}
        {matCompliance.medications && matCompliance.medications.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }}>
              Prescribed Medications
            </Text>
            {matCompliance.medications.map((med, i) => (
              <MedicationCard key={med._id || i} medication={med} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MedicationCard({ medication }: { medication: MATMedication }) {
  const drugName = medication.drug?.name || 'Unknown';
  const startDate = medication.start_date
    ? new Date(medication.start_date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: `${colors.primary}15`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Pill size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
            {drugName}
          </Text>
          {medication.drug?.strength && (
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              {medication.drug.strength}
            </Text>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        {medication.dosage && <InfoChip label="Dosage" value={medication.dosage} />}
        {medication.frequency && <InfoChip label="Frequency" value={medication.frequency} />}
      </View>

      {(startDate || medication.condition) && (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          {startDate && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={11} color={colors.mutedForeground} />
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Since {startDate}</Text>
            </View>
          )}
          {medication.condition && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ClipboardCheck size={11} color={colors.mutedForeground} />
              <Text
                style={{ fontSize: 11, color: colors.mutedForeground, textTransform: 'capitalize' }}
              >
                {medication.condition}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.muted,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>{value}</Text>
    </View>
  );
}
