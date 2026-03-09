import React, {useState, useEffect} from 'react';
import {View, Alert} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {FormInput} from '../../components/ui';
import SectionScreenLayout from '../../components/onboarding/SectionScreenLayout';
import SelectPicker from '../../components/onboarding/SelectPicker';
import {useAuthStore} from '../../store/auth';
import {useOnboardingStore} from '../../store/onboarding';
import {usersService} from '../../services/users.service';
import {
  personalDetailsSchema,
  type PersonalDetailsFormData,
} from '../../utils/validation';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {OnboardingStackParamList} from '../../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PersonalDetails'>;

const GENDER_OPTIONS = [
  {label: 'Male', value: 'Male'},
  {label: 'Female', value: 'Female'},
];

const MARITAL_OPTIONS = [
  {label: 'Single', value: 'Single'},
  {label: 'Married', value: 'Married'},
  {label: 'Divorced', value: 'Divorced'},
  {label: 'Widowed', value: 'Widowed'},
];

export default function PersonalDetailsScreen({navigation}: Props) {
  const user = useAuthStore(s => s.user);
  const fetchUser = useAuthStore(s => s.fetchUser);
  const clearDraft = useOnboardingStore(s => s.clearDraft);

  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: {errors},
    reset,
  } = useForm<PersonalDetailsFormData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
      phone_number: '',
      marital_status: '',
      occupation: '',
    },
  });

  // Pre-fill from user data
  useEffect(() => {
    if (user?.profile) {
      const p = user.profile as any;
      reset({
        first_name: p.first_name || '',
        last_name: p.last_name || '',
        date_of_birth: p.date_of_birth ? p.date_of_birth.split('T')[0] : '',
        gender: p.gender || '',
        phone_number:
          p.contact?.phone?.number || p.phone?.number || p.phone_number || '',
        marital_status: p.marital_status || '',
        occupation: p.occupation || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: PersonalDetailsFormData) => {
    setLoading(true);
    try {
      await usersService.updateProfile({
        profile: {
          first_name: data.first_name.trim(),
          last_name: data.last_name.trim(),
          date_of_birth: data.date_of_birth.trim() || undefined,
          gender: data.gender || undefined,
          marital_status: data.marital_status || undefined,
          occupation: data.occupation?.trim() || undefined,
        },
        ...(data.phone_number?.trim()
          ? {phone: {country_code: '+234', number: data.phone_number.trim()}}
          : {}),
      });
      clearDraft('personalDetails');
      await fetchUser();
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Failed to save. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionScreenLayout
      title="Personal Details"
      description="Basic information to set up your health profile. Name and date of birth are required."
      onBack={() => navigation.goBack()}
      onSave={handleSubmit(onSubmit)}
      saveDisabled={false}
      loading={loading}>
      <View style={{gap: 16}}>
        <FormInput
          control={control}
          name="first_name"
          label="First Name"
          required
          placeholder="Enter first name"
          error={errors.first_name?.message}
          autoCapitalize="words"
        />

        <FormInput
          control={control}
          name="last_name"
          label="Last Name"
          required
          placeholder="Enter last name"
          error={errors.last_name?.message}
          autoCapitalize="words"
        />

        <FormInput
          control={control}
          name="date_of_birth"
          label="Date of Birth"
          required
          placeholder="YYYY-MM-DD"
          error={errors.date_of_birth?.message}
          keyboardType="numbers-and-punctuation"
        />

        <Controller
          control={control}
          name="gender"
          render={({field: {onChange, value}}) => (
            <SelectPicker
              label="Gender"
              placeholder="Select gender"
              value={value || ''}
              options={GENDER_OPTIONS}
              onChange={onChange}
              error={errors.gender?.message}
            />
          )}
        />

        <FormInput
          control={control}
          name="phone_number"
          label="Phone Number"
          placeholder="08012345678"
          error={errors.phone_number?.message}
          keyboardType="phone-pad"
        />

        <Controller
          control={control}
          name="marital_status"
          render={({field: {onChange, value}}) => (
            <SelectPicker
              label="Marital Status"
              placeholder="Select status"
              value={value || ''}
              options={MARITAL_OPTIONS}
              onChange={onChange}
              error={errors.marital_status?.message}
            />
          )}
        />

        <FormInput
          control={control}
          name="occupation"
          label="Occupation"
          placeholder="e.g. Software Engineer"
          error={errors.occupation?.message}
          autoCapitalize="words"
        />
      </View>
    </SectionScreenLayout>
  );
}
