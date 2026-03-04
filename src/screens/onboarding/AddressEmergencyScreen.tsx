import React, {useState, useEffect} from 'react';
import {View, Text, Alert} from 'react-native';
import {Input} from '../../components/ui';
import SectionScreenLayout from '../../components/onboarding/SectionScreenLayout';
import SelectPicker from '../../components/onboarding/SelectPicker';
import ArrayFieldList from '../../components/onboarding/ArrayFieldList';
import {colors} from '../../theme/colors';
import {useAuthStore} from '../../store/auth';
import {useOnboardingStore} from '../../store/onboarding';
import {usersService} from '../../services/users.service';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {OnboardingStackParamList} from '../../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'AddressEmergency'>;

const COUNTRY_OPTIONS = [
  {label: 'Nigeria', value: 'Nigeria'},
  {label: 'Ghana', value: 'Ghana'},
  {label: 'Kenya', value: 'Kenya'},
  {label: 'South Africa', value: 'South Africa'},
  {label: 'United Kingdom', value: 'United Kingdom'},
  {label: 'United States', value: 'United States'},
  {label: 'Canada', value: 'Canada'},
];

const RELATIONSHIP_OPTIONS = [
  {label: 'Spouse', value: 'spouse'},
  {label: 'Parent', value: 'parent'},
  {label: 'Sibling', value: 'sibling'},
  {label: 'Child', value: 'child'},
  {label: 'Friend', value: 'friend'},
  {label: 'Other', value: 'other'},
];

interface ContactForm {
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
}

export default function AddressEmergencyScreen({navigation}: Props) {
  const user = useAuthStore(s => s.user);
  const fetchUser = useAuthStore(s => s.fetchUser);
  const clearDraft = useOnboardingStore(s => s.clearDraft);

  // Address fields
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [postalCode, setPostalCode] = useState('');

  // Emergency contacts
  const [contacts, setContacts] = useState<ContactForm[]>([
    {firstName: '', lastName: '', relationship: '', phone: ''},
  ]);

  const [loading, setLoading] = useState(false);

  // Pre-fill
  // Backend stores home address under profile.contact, NOT delivery_addresses
  useEffect(() => {
    if (user) {
      const contact = (user.profile as any)?.contact;
      if (contact) {
        setStreet(contact.address1 || '');
        setCity(contact.city || '');
        setState(contact.state || '');
        setCountry(contact.country || 'Nigeria');
        setPostalCode(contact.zip_code || '');
      }

      // Emergency contacts
      if (user.emergency_contacts?.length) {
        setContacts(
          user.emergency_contacts.map((c: any) => ({
            firstName: c.first_name || c.name?.split(' ')[0] || '',
            lastName: c.last_name || c.name?.split(' ').slice(1).join(' ') || '',
            relationship: c.relationship || '',
            phone: c.phone?.number || c.phone_number || c.phone || '',
          })),
        );
      }
    }
  }, [user]);

  const updateContact = (index: number, field: keyof ContactForm, value: string) => {
    setContacts(prev => {
      const updated = [...prev];
      updated[index] = {...updated[index], [field]: value};
      return updated;
    });
  };

  // At least one contact with name + phone is required
  const isValid =
    contacts.length > 0 &&
    contacts[0].firstName.trim() !== '' &&
    contacts[0].phone.trim() !== '';

  const handleSave = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const payload: any = {};

      // Delivery address
      if (street.trim() || city.trim()) {
        payload.delivery_addresses = [
          {
            label: 'Home',
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            country,
            postal_code: postalCode.trim(),
            is_default: true,
          },
        ];
      }

      // Emergency contacts
      payload.emergency_contacts = contacts
        .filter(c => c.firstName.trim())
        .map(c => ({
          first_name: c.firstName.trim(),
          last_name: c.lastName.trim(),
          relationship: c.relationship || 'other',
          phone: {
            country_code: '+234',
            number: c.phone.trim(),
          },
        }));

      await usersService.updateProfile(payload);
      clearDraft('addressEmergency');
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
      title="Address & Emergency"
      description="Your address and at least one emergency contact are required for your safety."
      onBack={() => navigation.goBack()}
      onSave={handleSave}
      saveDisabled={!isValid}
      loading={loading}>
      {/* Address section */}
      <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: colors.foreground,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingBottom: 8,
          marginBottom: 16,
        }}>
        Your Address
      </Text>

      <View style={{gap: 16, marginBottom: 24}}>
        <Input
          label="Street Address"
          placeholder="123 Main Street"
          value={street}
          onChangeText={setStreet}
        />

        <View style={{flexDirection: 'row', gap: 12}}>
          <View style={{flex: 1}}>
            <Input
              label="City"
              placeholder="Lagos"
              value={city}
              onChangeText={setCity}
            />
          </View>
          <View style={{flex: 1}}>
            <Input
              label="State"
              placeholder="Lagos"
              value={state}
              onChangeText={setState}
            />
          </View>
        </View>

        <View style={{flexDirection: 'row', gap: 12}}>
          <View style={{flex: 1}}>
            <SelectPicker
              label="Country"
              value={country}
              options={COUNTRY_OPTIONS}
              onChange={setCountry}
            />
          </View>
          <View style={{flex: 1}}>
            <Input
              label="Postal Code"
              placeholder="100001"
              value={postalCode}
              onChangeText={setPostalCode}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>

      {/* Emergency contacts */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingBottom: 8,
          marginBottom: 16,
        }}>
        <Text style={{fontSize: 14, fontWeight: '700', color: colors.foreground}}>
          Emergency Contacts
        </Text>
        <Text style={{fontSize: 11, color: colors.destructive, fontWeight: '600'}}>
          *Required
        </Text>
      </View>

      <ArrayFieldList
        items={contacts}
        onAdd={() =>
          setContacts(prev => [
            ...prev,
            {firstName: '', lastName: '', relationship: '', phone: ''},
          ])
        }
        onRemove={index => {
          if (contacts.length <= 1) return; // Keep at least one
          setContacts(prev => prev.filter((_, i) => i !== index));
        }}
        addLabel="Add Emergency Contact"
        maxItems={3}
        renderItem={(contact, index) => (
          <View style={{gap: 12}}>
            <View style={{flexDirection: 'row', gap: 12}}>
              <View style={{flex: 1}}>
                <Input
                  label="First Name"
                  required={index === 0}
                  placeholder="Jane"
                  value={contact.firstName}
                  onChangeText={v => updateContact(index, 'firstName', v)}
                  autoCapitalize="words"
                />
              </View>
              <View style={{flex: 1}}>
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  value={contact.lastName}
                  onChangeText={v => updateContact(index, 'lastName', v)}
                  autoCapitalize="words"
                />
              </View>
            </View>
            <SelectPicker
              label="Relationship"
              placeholder="Select relationship"
              value={contact.relationship}
              options={RELATIONSHIP_OPTIONS}
              onChange={v => updateContact(index, 'relationship', v)}
            />
            <Input
              label="Phone"
              required={index === 0}
              placeholder="08012345678"
              value={contact.phone}
              onChangeText={v => updateContact(index, 'phone', v)}
              keyboardType="phone-pad"
            />
          </View>
        )}
      />
    </SectionScreenLayout>
  );
}
