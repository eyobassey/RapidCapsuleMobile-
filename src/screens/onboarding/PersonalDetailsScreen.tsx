import React, {useState, useEffect} from 'react';
import {View, Alert} from 'react-native';
import {Input} from '../../components/ui';
import SectionScreenLayout from '../../components/onboarding/SectionScreenLayout';
import SelectPicker from '../../components/onboarding/SelectPicker';
import {useAuthStore} from '../../store/auth';
import {useOnboardingStore} from '../../store/onboarding';
import {usersService} from '../../services/users.service';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {OnboardingStackParamList} from '../../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PersonalDetails'>;

const GENDER_OPTIONS = [
  {label: 'Male', value: 'MALE'},
  {label: 'Female', value: 'FEMALE'},
];

const MARITAL_OPTIONS = [
  {label: 'Single', value: 'SINGLE'},
  {label: 'Married', value: 'MARRIED'},
  {label: 'Divorced', value: 'DIVORCED'},
  {label: 'Widowed', value: 'WIDOWED'},
];

export default function PersonalDetailsScreen({navigation}: Props) {
  const user = useAuthStore(s => s.user);
  const fetchUser = useAuthStore(s => s.fetchUser);
  const clearDraft = useOnboardingStore(s => s.clearDraft);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [occupation, setOccupation] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill from user data
  useEffect(() => {
    if (user?.profile) {
      const p = user.profile;
      setFirstName(p.first_name || '');
      setLastName(p.last_name || '');
      setDob(p.date_of_birth || '');
      setGender(p.gender || '');
      setPhone(p.phone_number || p.phone?.number || '');
      setMaritalStatus((p as any).marital_status || '');
      setOccupation((p as any).occupation || '');
    }
  }, [user]);

  const isValid = !!(firstName.trim() && lastName.trim() && dob.trim());

  const handleSave = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await usersService.updateProfile({
        profile: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dob.trim() || undefined,
          gender: gender || undefined,
          marital_status: maritalStatus || undefined,
          occupation: occupation.trim() || undefined,
        },
        ...(phone.trim()
          ? {phone: {country_code: '+234', number: phone.trim()}}
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
      onSave={handleSave}
      saveDisabled={!isValid}
      loading={loading}>
      <View style={{gap: 16}}>
        <Input
          label="First Name"
          required
          placeholder="Enter first name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />

        <Input
          label="Last Name"
          required
          placeholder="Enter last name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />

        <Input
          label="Date of Birth"
          required
          placeholder="YYYY-MM-DD"
          value={dob}
          onChangeText={setDob}
          keyboardType="numbers-and-punctuation"
        />

        <SelectPicker
          label="Gender"
          placeholder="Select gender"
          value={gender}
          options={GENDER_OPTIONS}
          onChange={setGender}
        />

        <Input
          label="Phone Number"
          placeholder="08012345678"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <SelectPicker
          label="Marital Status"
          placeholder="Select status"
          value={maritalStatus}
          options={MARITAL_OPTIONS}
          onChange={setMaritalStatus}
        />

        <Input
          label="Occupation"
          placeholder="e.g. Software Engineer"
          value={occupation}
          onChangeText={setOccupation}
          autoCapitalize="words"
        />
      </View>
    </SectionScreenLayout>
  );
}
