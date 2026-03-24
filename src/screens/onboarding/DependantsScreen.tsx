import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { Input, DatePickerInput, Text } from '../../components/ui';
import SectionScreenLayout from '../../components/onboarding/SectionScreenLayout';
import SelectPicker from '../../components/onboarding/SelectPicker';
import ArrayFieldList from '../../components/onboarding/ArrayFieldList';
import { useAuthStore } from '../../store/auth';
import { useOnboardingStore } from '../../store/onboarding';
import { usersService } from '../../services/users.service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dependantsSchema, type DependantsFormData } from '../../utils/validation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Dependants'>;

const RELATIONSHIP_OPTIONS = [
  { label: 'Child', value: 'Child' },
  { label: 'Spouse', value: 'Spouse' },
  { label: 'Wife', value: 'Wife' },
  { label: 'Husband', value: 'Husband' },
  { label: 'Parent', value: 'Parent' },
  { label: 'Sibling', value: 'Sibling' },
  { label: 'Guardian', value: 'Guardian' },
  { label: 'Other', value: 'Other' },
];

const GENDER_OPTIONS = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
];

const defaultDependant = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  relationship: '',
  gender: '',
};

export default function DependantsScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const clearDraft = useOnboardingStore((s) => s.clearDraft);
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DependantsFormData>({
    resolver: zodResolver(dependantsSchema),
    defaultValues: {
      dependants: [defaultDependant],
    },
  });

  const dependants = watch('dependants');

  useEffect(() => {
    if (user?.dependants?.length) {
      setValue(
        'dependants',
        user.dependants.map((d: any) => ({
          firstName: d.first_name || d.name?.split(' ')[0] || '',
          lastName: d.last_name || d.name?.split(' ').slice(1).join(' ') || '',
          dateOfBirth: d.date_of_birth ? d.date_of_birth.split('T')[0] : '',
          relationship: d.relationship || '',
          gender: d.gender || '',
        }))
      );
    }
  }, [user, setValue]);

  const updateDependant = (index: number, field: keyof typeof defaultDependant, value: string) => {
    const updated = [...dependants];
    updated[index] = { ...defaultDependant, ...updated[index], [field]: value };
    setValue('dependants', updated);
  };

  const onSubmit = async (data: DependantsFormData) => {
    setLoading(true);
    try {
      await usersService.updateProfile({
        dependants: data.dependants
          .filter((d) => d.firstName.trim())
          .map((d) => ({
            first_name: d.firstName.trim(),
            last_name: (d.lastName ?? '').trim(),
            date_of_birth: d.dateOfBirth || undefined,
            relationship: d.relationship || undefined,
            gender: d.gender || undefined,
          })),
      });
      clearDraft('dependants');
      await fetchUser();
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  const hasFilled = dependants.some(
    (d) =>
      d.firstName.trim() || (d.lastName ?? '').trim() || d.dateOfBirth || d.relationship || d.gender
  );

  return (
    <SectionScreenLayout
      title="Dependants"
      description="Add family members or dependants who may use your account for health services."
      onBack={() => navigation.goBack()}
      onSave={handleSubmit(onSubmit)}
      saveLabel={hasFilled ? 'Save & Continue' : 'Skip for Now'}
      loading={loading}
    >
      {errors.dependants?.message && (
        <View
          style={{
            marginBottom: 12,
            padding: 12,
            backgroundColor: 'rgba(239,68,68,0.1)',
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 13, color: '#dc2626' }}>{errors.dependants.message}</Text>
        </View>
      )}
      <ArrayFieldList
        items={dependants}
        onAdd={() => setValue('dependants', [...dependants, { ...defaultDependant }])}
        onRemove={(index) =>
          setValue(
            'dependants',
            dependants.filter((_, i) => i !== index)
          )
        }
        addLabel="Add Dependant"
        maxItems={10}
        emptyText="No dependants added yet. Tap below to add a family member or dependant."
        renderItem={(dep, index) => (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="First Name"
                  placeholder="First name"
                  value={dep.firstName ?? ''}
                  onChangeText={(v) => updateDependant(index, 'firstName', v)}
                  autoCapitalize="words"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Last Name"
                  placeholder="Last name"
                  value={dep.lastName ?? ''}
                  onChangeText={(v) => updateDependant(index, 'lastName', v)}
                  autoCapitalize="words"
                />
              </View>
            </View>
            <DatePickerInput
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={dep.dateOfBirth ?? ''}
              onChange={(v) => updateDependant(index, 'dateOfBirth', v)}
              maximumDate={new Date()}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <SelectPicker
                  label="Relationship"
                  value={dep.relationship ?? ''}
                  options={RELATIONSHIP_OPTIONS}
                  onChange={(v) => updateDependant(index, 'relationship', v)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <SelectPicker
                  label="Gender"
                  value={dep.gender ?? ''}
                  options={GENDER_OPTIONS}
                  onChange={(v) => updateDependant(index, 'gender', v)}
                />
              </View>
            </View>
          </View>
        )}
      />
    </SectionScreenLayout>
  );
}
