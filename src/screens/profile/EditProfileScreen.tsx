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
import {Camera, Check, User, Phone, Calendar, Users} from 'lucide-react-native';

import {useAuthStore} from '../../store/auth';
import {usersService} from '../../services/users.service';
import {Header, Avatar, Input, Button} from '../../components/ui';
import {colors} from '../../theme/colors';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore(s => s.user);
  const fetchUser = useAuthStore(s => s.fetchUser);

  const [saving, setSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState(user?.profile?.first_name || '');
  const [lastName, setLastName] = useState(user?.profile?.last_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.profile?.phone_number || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.profile?.date_of_birth || '');
  const [gender, setGender] = useState<string>(user?.profile?.gender || '');

  // Emergency contact (first one if exists)
  const emergencyContact = user?.emergency_contacts?.[0] || null;
  const [ecName, setEcName] = useState(emergencyContact?.name || '');
  const [ecRelationship, setEcRelationship] = useState(emergencyContact?.relationship || '');
  const [ecPhone, setEcPhone] = useState(emergencyContact?.phone_number || '');

  const profileImage = user?.profile?.profile_photo || user?.profile?.profile_image;

  const hasChanges = useMemo(() => {
    const original = user?.profile;
    if (!original) return true;
    return (
      firstName !== (original.first_name || '') ||
      lastName !== (original.last_name || '') ||
      phoneNumber !== (original.phone_number || '') ||
      dateOfBirth !== (original.date_of_birth || '') ||
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
          phone_number: phoneNumber.trim() || undefined,
          date_of_birth: dateOfBirth.trim() || undefined,
          gender: gender || undefined,
        },
      };

      // Include emergency contacts if filled
      if (ecName.trim() && ecPhone.trim()) {
        updateData.emergency_contacts = [
          {
            name: ecName.trim(),
            relationship: ecRelationship.trim() || undefined,
            phone_number: ecPhone.trim(),
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
            <TouchableOpacity activeOpacity={0.7} className="relative">
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
