import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Camera,
  Check,
  User,
  Phone,
  Calendar,
  Users,
  ChevronRight,
  MapPin,
  Activity,
  AlertTriangle,
  Stethoscope,
  Briefcase,
  Smartphone,
} from 'lucide-react-native';

import {useAuthStore} from '../../store/auth';
import {useOnboardingStore} from '../../store/onboarding';
import {usersService} from '../../services/users.service';
import {Header, Avatar, Input, Button, ProgressRing} from '../../components/ui';
import SelectPicker from '../../components/onboarding/SelectPicker';
import {colors} from '../../theme/colors';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;

const MARITAL_OPTIONS = [
  {label: 'Single', value: 'Single'},
  {label: 'Married', value: 'Married'},
  {label: 'Divorced', value: 'Divorced'},
  {label: 'Widowed', value: 'Widowed'},
];

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore(s => s.user);
  const fetchUser = useAuthStore(s => s.fetchUser);
  const {progress, completedSections} = useOnboardingStore();
  const completedCount = Object.values(completedSections).filter(Boolean).length;
  const totalSections = Object.keys(completedSections).length;

  const [saving, setSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState(user?.profile?.first_name || '');
  const [lastName, setLastName] = useState(user?.profile?.last_name || '');
  // Phone: profile.contact.phone.number → profile.phone.number → profile.phone_number
  const [phoneNumber, setPhoneNumber] = useState(
    (user?.profile as any)?.contact?.phone?.number ||
    user?.profile?.phone?.number ||
    user?.profile?.phone_number || '',
  );
  // Strip ISO date format for DOB
  const rawDob = user?.profile?.date_of_birth || '';
  const [dateOfBirth, setDateOfBirth] = useState(rawDob ? rawDob.split('T')[0] : '');
  const [gender, setGender] = useState<string>(user?.profile?.gender || '');
  const [maritalStatus, setMaritalStatus] = useState(
    (user?.profile as any)?.marital_status || '',
  );
  const [occupation, setOccupation] = useState(
    (user?.profile as any)?.occupation || '',
  );

  // Emergency contact (first one if exists)
  // Backend stores: {first_name, last_name, relationship, phone: {country_code, number}}
  const emergencyContact = user?.emergency_contacts?.[0] || null;
  const ecFullName = emergencyContact
    ? [emergencyContact.first_name, emergencyContact.last_name].filter(Boolean).join(' ') ||
      emergencyContact.name || ''
    : '';
  const [ecName, setEcName] = useState(ecFullName);
  const [ecRelationship, setEcRelationship] = useState(emergencyContact?.relationship || '');
  const [ecPhone, setEcPhone] = useState(
    emergencyContact?.phone?.number || emergencyContact?.phone_number || '',
  );

  const profileImage = user?.profile?.profile_photo || user?.profile?.profile_image;

  const hasChanges = useMemo(() => {
    const original = user?.profile as any;
    if (!original) return true;
    const origPhone = original?.contact?.phone?.number || original?.phone?.number || original?.phone_number || '';
    const origDob = original?.date_of_birth ? original.date_of_birth.split('T')[0] : '';
    return (
      firstName !== (original.first_name || '') ||
      lastName !== (original.last_name || '') ||
      phoneNumber !== origPhone ||
      dateOfBirth !== origDob ||
      gender !== (original.gender || '')
    );
  }, [firstName, lastName, phoneNumber, dateOfBirth, gender, user]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Validation', 'First name is required.');
      return;
    }
    if (!lastName.trim()) {
      Alert.alert('Validation', 'Last name is required.');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        profile: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dateOfBirth.trim() || undefined,
          gender: gender || undefined,
          marital_status: maritalStatus || undefined,
          occupation: occupation.trim() || undefined,
        },
      };

      // Include emergency contacts if filled
      // Backend expects: {first_name, last_name, relationship, phone: {country_code, number}}
      if (ecName.trim() && ecPhone.trim()) {
        const nameParts = ecName.trim().split(' ');
        const ecFirstName = nameParts[0] || '';
        const ecLastName = nameParts.slice(1).join(' ') || '';
        updateData.emergency_contacts = [
          {
            first_name: ecFirstName,
            last_name: ecLastName,
            relationship: ecRelationship.trim() || 'Other',
            phone: {
              country_code: '+234',
              number: ecPhone.trim(),
            },
          },
        ];
      }

      await usersService.updateProfile(updateData);
      await fetchUser();

      Alert.alert('Success', 'Your profile has been updated.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || err?.message || 'Failed to update profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header
        title="Edit Profile"
        onBack={() => navigation.goBack()}
        rightAction={
          saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <TouchableOpacity
              onPress={handleSave}
              accessibilityRole="button"
              accessibilityLabel="Save profile"
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Check size={24} color={colors.primary} />
            </TouchableOpacity>
          )
        }
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-6 pb-32"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Avatar with camera overlay */}
          <View className="items-center mb-8">
            <TouchableOpacity activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Change profile photo" className="relative">
              <Avatar
                uri={profileImage}
                firstName={firstName}
                lastName={lastName}
                size="lg"
              />
              <View
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary items-center justify-center border-2"
                style={{borderColor: colors.background}}>
                <Camera size={14} color={colors.white} />
              </View>
            </TouchableOpacity>
            <Text className="text-xs text-muted-foreground mt-2">
              Tap to change photo
            </Text>
          </View>

          {/* Profile Completion Card */}
          {progress < 100 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('OnboardingDashboard')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                gap: 14,
              }}>
              <ProgressRing progress={progress} size={48} strokeWidth={4}>
                <Text style={{fontSize: 11, fontWeight: '700', color: colors.foreground}}>
                  {progress}%
                </Text>
              </ProgressRing>
              <View style={{flex: 1}}>
                <Text style={{fontSize: 14, fontWeight: '700', color: colors.foreground}}>
                  Profile Completion
                </Text>
                <Text style={{fontSize: 11, color: colors.mutedForeground, marginTop: 2}}>
                  {completedCount}/{totalSections} sections complete
                </Text>
              </View>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}

          {/* Section: Basic Information */}
          <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-semibold">
            Basic Information
          </Text>

          <View className="mb-4">
            <Input
              label="First Name"
              required
              placeholder="Enter first name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              icon={<User size={18} color={colors.mutedForeground} />}
            />
          </View>

          <View className="mb-4">
            <Input
              label="Last Name"
              required
              placeholder="Enter last name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              icon={<User size={18} color={colors.mutedForeground} />}
            />
          </View>

          <View className="mb-4">
            <Input
              label="Phone Number"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              icon={<Phone size={18} color={colors.mutedForeground} />}
            />
          </View>

          <View className="mb-4">
            <Input
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              icon={<Calendar size={18} color={colors.mutedForeground} />}
            />
          </View>

          {/* Gender Selector */}
          <View className="mb-6">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2 ml-1">
              Gender
            </Text>
            <View className="flex-row gap-3">
              {GENDER_OPTIONS.map(option => {
                const isSelected = gender.toLowerCase() === option.toLowerCase();
                return (
                  <TouchableOpacity
                    key={option}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityLabel={option}
                    accessibilityState={{selected: isSelected}}
                    onPress={() => setGender(option)}
                    className={`flex-1 h-12 rounded-2xl items-center justify-center border ${
                      isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border'
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
          </View>

          {/* Marital Status & Occupation */}
          <View className="mb-4">
            <SelectPicker
              label="Marital Status"
              placeholder="Select"
              value={maritalStatus}
              options={MARITAL_OPTIONS}
              onChange={setMaritalStatus}
            />
          </View>

          <View className="mb-6">
            <Input
              label="Occupation"
              placeholder="e.g. Software Engineer"
              value={occupation}
              onChangeText={setOccupation}
              autoCapitalize="words"
              icon={<Briefcase size={18} color={colors.mutedForeground} />}
            />
          </View>

          {/* Quick links to other profile sections */}
          <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-semibold">
            Health & Personal Data
          </Text>
          <View className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
            {[
              {
                icon: <MapPin size={18} color={colors.primary} />,
                title: 'Address & Emergency Contacts',
                subtitle: 'Home address, up to 3 emergency contacts',
                screen: 'AddressEmergency',
              },
              {
                icon: <Users size={18} color={colors.accent} />,
                title: 'Dependants',
                subtitle: 'Family members on your account',
                screen: 'Dependants',
              },
              {
                icon: <Activity size={18} color={colors.success} />,
                title: 'Vitals & Metrics',
                subtitle: 'Height, weight, blood type, genotype',
                screen: 'VitalsMetrics',
              },
              {
                icon: <Stethoscope size={18} color={colors.secondary} />,
                title: 'Medical History',
                subtitle: 'Conditions, medications, lifestyle',
                screen: 'MedicalHistory',
              },
              {
                icon: <AlertTriangle size={18} color={colors.destructive} />,
                title: 'Allergies',
                subtitle: 'Drug, food & environmental allergies',
                screen: 'Allergies',
              },
              {
                icon: <Smartphone size={18} color={colors.primary} />,
                title: 'Devices & Health Apps',
                subtitle: 'Connect Apple Health, Fitbit, Google Fit',
                screen: 'DeviceIntegration',
              },
            ].map((item, index, arr) => (
              <TouchableOpacity
                key={item.screen}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(item.screen as any)}
                className={`flex-row items-center p-4 gap-3 ${
                  index < arr.length - 1 ? 'border-b border-border' : ''
                }`}>
                <View className="w-9 h-9 rounded-full bg-muted items-center justify-center">
                  {item.icon}
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-medium">{item.title}</Text>
                  <Text className="text-muted-foreground text-xs mt-0.5">{item.subtitle}</Text>
                </View>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Section: Emergency Contact */}
          <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-4 mt-4 font-semibold">
            Emergency Contact
          </Text>

          <View className="mb-4">
            <Input
              label="Contact Name"
              placeholder="Enter emergency contact name"
              value={ecName}
              onChangeText={setEcName}
              autoCapitalize="words"
              icon={<Users size={18} color={colors.mutedForeground} />}
            />
          </View>

          <View className="mb-4">
            <Input
              label="Relationship"
              placeholder="e.g. Spouse, Parent, Sibling"
              value={ecRelationship}
              onChangeText={setEcRelationship}
              autoCapitalize="words"
            />
          </View>

          <View className="mb-6">
            <Input
              label="Contact Phone"
              placeholder="Enter phone number"
              value={ecPhone}
              onChangeText={setEcPhone}
              keyboardType="phone-pad"
              icon={<Phone size={18} color={colors.mutedForeground} />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Save Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-5 pt-3 pb-8">
        <Button
          variant="primary"
          onPress={handleSave}
          loading={saving}>
          Save Changes
        </Button>
      </View>
    </SafeAreaView>
  );
}
