import React, {useState, useMemo} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {User, Calendar} from 'lucide-react-native';
import {Header, Button, Input} from '../../components/ui';
import {useAuthStore} from '../../store/auth';
import {useHealthCheckupStore} from '../../store/healthCheckup';
import {colors} from '../../theme/colors';

const GENDER_OPTIONS = ['Male', 'Female'] as const;

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function PatientInfoScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore(s => s.user);
  const {beginCheckup, setPatientInfo, fetchRiskFactors, isLoading} = useHealthCheckupStore();

  const profileGender = user?.profile?.gender?.toLowerCase() || '';
  const profileDob = user?.profile?.date_of_birth || '';

  const [gender, setGender] = useState<string>(
    profileGender === 'male' || profileGender === 'female' ? profileGender : '',
  );
  const [dateOfBirth, setDateOfBirth] = useState(profileDob);

  const age = useMemo(() => {
    if (!dateOfBirth) return 0;
    return calculateAge(dateOfBirth);
  }, [dateOfBirth]);

  const handleNext = async () => {
    if (!gender) {
      Alert.alert('Required', 'Please select your biological sex.');
      return;
    }
    if (age < 12) {
      Alert.alert('Age Requirement', 'Health checkup requires a minimum age of 12 years.');
      return;
    }
    if (age <= 0 || age > 120) {
      Alert.alert('Invalid Age', 'Please enter a valid date of birth.');
      return;
    }

    try {
      setPatientInfo(gender, age);
      await beginCheckup({
        health_check_for: 'Self',
        checkup_owner_id: user?._id || '',
      });
      await fetchRiskFactors(age);
      navigation.navigate('HealthCheckupRiskFactors');
    } catch {
      // Error handled in store
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Patient Info" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-6 pb-6"
        showsVerticalScrollIndicator={false}>
        {/* Step indicator */}
        <View className="flex-row items-center gap-2 mb-6">
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-border rounded-full" />
          <View className="h-1.5 flex-1 bg-border rounded-full" />
          <View className="h-1.5 flex-1 bg-border rounded-full" />
          <View className="h-1.5 flex-1 bg-border rounded-full" />
        </View>

        <Text className="text-lg font-bold text-foreground mb-1">
          Confirm Your Information
        </Text>
        <Text className="text-sm text-muted-foreground mb-6">
          We need this to provide an accurate assessment.
        </Text>

        {/* Gender */}
        <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-3 ml-1">
          Biological Sex
        </Text>
        <View className="flex-row gap-3 mb-6">
          {GENDER_OPTIONS.map(option => {
            const isSelected = gender === option.toLowerCase();
            return (
              <TouchableOpacity
                key={option}
                activeOpacity={0.7}
                onPress={() => setGender(option.toLowerCase())}
                className={`flex-1 h-12 rounded-2xl items-center justify-center border ${
                  isSelected ? 'bg-primary/10 border-primary' : 'bg-card border-border'
                }`}>
                <Text
                  className={`text-sm font-medium ${
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date of Birth */}
        <View className="mb-4">
          <Input
            label="Date of Birth"
            placeholder="YYYY-MM-DD"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            icon={<Calendar size={18} color={colors.mutedForeground} />}
          />
        </View>

        {/* Age display */}
        {age > 0 && (
          <View className="bg-card border border-border rounded-2xl p-4 flex-row items-center gap-3 mb-6">
            <User size={20} color={colors.primary} />
            <Text className="text-sm text-foreground">
              Age: <Text className="font-bold">{age} years</Text>
            </Text>
          </View>
        )}
      </ScrollView>

      <View className="bg-background border-t border-border px-5 pt-3 pb-8">
        <Button variant="primary" onPress={handleNext} loading={isLoading}>
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
}
