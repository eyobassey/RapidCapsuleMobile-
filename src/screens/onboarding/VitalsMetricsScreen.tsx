import React, { useState, useEffect, useMemo } from 'react';
import { View, Alert } from 'react-native';
import { Input, Text } from '../../components/ui';
import SectionScreenLayout from '../../components/onboarding/SectionScreenLayout';
import SelectPicker from '../../components/onboarding/SelectPicker';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/auth';
import { useOnboardingStore } from '../../store/onboarding';
import { usersService } from '../../services/users.service';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'VitalsMetrics'>;

const BLOOD_TYPE_OPTIONS = [
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' },
];

const GENOTYPE_OPTIONS = [
  { label: 'AA', value: 'AA' },
  { label: 'AS', value: 'AS' },
  { label: 'SS', value: 'SS' },
  { label: 'AC', value: 'AC' },
  { label: 'SC', value: 'SC' },
  { label: 'CC', value: 'CC' },
];

export default function VitalsMetricsScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const clearDraft = useOnboardingStore((s) => s.clearDraft);

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [genotype, setGenotype] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      const p = user.profile;
      const h = p.height?.value || p.basic_health_info?.height?.value;
      const w = p.weight?.value || p.basic_health_info?.weight?.value;
      if (h) setHeight(String(h));
      if (w) setWeight(String(w));
      setBloodType(p.blood_type || '');
      setGenotype(p.genotype || '');
    }
  }, [user]);

  const bmi = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const hm = h / 100;
      return (w / (hm * hm)).toFixed(1);
    }
    return null;
  }, [height, weight]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    const val = parseFloat(bmi);
    if (val < 18.5) return { label: 'Underweight', color: colors.secondary };
    if (val < 25) return { label: 'Normal', color: colors.success };
    if (val < 30) return { label: 'Overweight', color: colors.secondary };
    return { label: 'Obese', color: colors.destructive };
  }, [bmi]);

  const hasSomething = height.trim() || weight.trim() || bloodType || genotype;

  const handleSave = async () => {
    setLoading(true);
    try {
      await usersService.updateProfile({
        profile: {
          height: height.trim() ? { value: parseFloat(height), unit: 'cm' } : undefined,
          weight: weight.trim() ? { value: parseFloat(weight), unit: 'kg' } : undefined,
          blood_type: bloodType || undefined,
          genotype: genotype || undefined,
        },
      });
      clearDraft('vitalsMetrics');
      await fetchUser();
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionScreenLayout
      title="Vitals & Health Metrics"
      description="Your basic health measurements help us calculate health indicators like BMI."
      onBack={() => navigation.goBack()}
      onSave={handleSave}
      saveLabel={hasSomething ? 'Save & Continue' : 'Skip for Now'}
      loading={loading}
    >
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Input
              label="Height (cm)"
              placeholder="170"
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Weight (kg)"
              placeholder="70"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* BMI display */}
        {bmi ? (
          <View
            accessibilityRole="text"
            accessibilityLabel={`BMI ${bmi}, ${bmiCategory?.label || ''}`}
            style={{
              backgroundColor: `${bmiCategory?.color || colors.primary}15`,
              borderWidth: 1,
              borderColor: `${bmiCategory?.color || colors.primary}30`,
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: '600' }}>
                BMI (Body Mass Index)
              </Text>
              <Text
                style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginTop: 2 }}
              >
                {bmi}
              </Text>
            </View>
            {bmiCategory ? (
              <View
                style={{
                  backgroundColor: `${bmiCategory.color}25`,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: bmiCategory.color }}>
                  {bmiCategory.label}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <SelectPicker
              label="Blood Type"
              placeholder="Select"
              value={bloodType}
              options={BLOOD_TYPE_OPTIONS}
              onChange={setBloodType}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SelectPicker
              label="Genotype"
              placeholder="Select"
              value={genotype}
              options={GENOTYPE_OPTIONS}
              onChange={setGenotype}
            />
          </View>
        </View>
      </View>
    </SectionScreenLayout>
  );
}
