import React, {useState, useEffect} from 'react';
import {View, Text, Alert} from 'react-native';
import {useForm, useFieldArray, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {FormInput} from '../../components/ui';
import SectionScreenLayout from '../../components/onboarding/SectionScreenLayout';
import SelectPicker from '../../components/onboarding/SelectPicker';
import ArrayFieldList from '../../components/onboarding/ArrayFieldList';
import {colors} from '../../theme/colors';
import {useAuthStore} from '../../store/auth';
import {useOnboardingStore} from '../../store/onboarding';
import {usersService} from '../../services/users.service';
import {
  addressSchema,
  emergencyContactSchema,
} from '../../utils/validation';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {OnboardingStackParamList} from '../../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'AddressEmergency'>;

// Combined schema for address + emergency contacts
const addressEmergencySchema = z.object({
  address: addressSchema,
  contacts: z
    .array(emergencyContactSchema)
    .min(1, 'At least one emergency contact is required'),
});
type AddressEmergencyFormData = z.infer<typeof addressEmergencySchema>;

const COUNTRY_OPTIONS = [
  {label: 'Nigeria', value: 'Nigeria'},
  {label: 'Ghana', value: 'Ghana'},
  {label: 'Kenya', value: 'Kenya'},
  {label: 'South Africa', value: 'South Africa'},
  {label: 'United Kingdom', value: 'United Kingdom'},
  {label: 'United States', value: 'United States'},
  {label: 'Canada', value: 'Canada'},
  {label: 'India', value: 'India'},
  {label: 'Australia', value: 'Australia'},
  {label: 'Germany', value: 'Germany'},
];

const RELATIONSHIP_OPTIONS = [
  {label: 'Spouse', value: 'Spouse'},
  {label: 'Wife', value: 'Wife'},
  {label: 'Husband', value: 'Husband'},
  {label: 'Parent', value: 'Parent'},
  {label: 'Sibling', value: 'Sibling'},
  {label: 'Child', value: 'Child'},
  {label: 'Friend', value: 'Friend'},
  {label: 'Other', value: 'Other'},
];

export default function AddressEmergencyScreen({navigation}: Props) {
  const user = useAuthStore(s => s.user);
  const fetchUser = useAuthStore(s => s.fetchUser);
  const clearDraft = useOnboardingStore(s => s.clearDraft);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: {errors},
    reset,
  } = useForm<AddressEmergencyFormData>({
    resolver: zodResolver(addressEmergencySchema),
    defaultValues: {
      address: {
        street: '',
        city: '',
        state: '',
        country: 'Nigeria',
        postal_code: '',
      },
      contacts: [{firstName: '', lastName: '', relationship: '', phone: ''}],
    },
  });

  const {fields, append, remove} = useFieldArray({
    control,
    name: 'contacts',
  });

  // Pre-fill
  useEffect(() => {
    if (user) {
      const contact = (user.profile as any)?.contact;
      const addressData = {
        street: contact?.address1 || '',
        city: contact?.city || '',
        state: contact?.state || '',
        country: contact?.country || 'Nigeria',
        postal_code: contact?.zip_code || '',
      };

      let contactsData = [{firstName: '', lastName: '', relationship: '', phone: ''}];
      if (user.emergency_contacts?.length) {
        contactsData = user.emergency_contacts.map((c: any) => ({
          firstName: c.first_name || c.name?.split(' ')[0] || '',
          lastName: c.last_name || c.name?.split(' ').slice(1).join(' ') || '',
          relationship: c.relationship || '',
          phone: c.phone?.number || c.phone_number || c.phone || '',
        }));
      }

      reset({address: addressData, contacts: contactsData});
    }
  }, [user, reset]);

  const onSubmit = async (data: AddressEmergencyFormData) => {
    setLoading(true);
    try {
      const payload: any = {};

      // Delivery address
      if (data.address.street?.trim() || data.address.city?.trim()) {
        payload.delivery_addresses = [
          {
            label: 'Home',
            street: data.address.street?.trim() || '',
            city: data.address.city?.trim() || '',
            state: data.address.state?.trim() || '',
            country: data.address.country,
            postal_code: data.address.postal_code?.trim() || '',
            is_default: true,
          },
        ];
      }

      // Emergency contacts
      payload.emergency_contacts = data.contacts
        .filter(c => c.firstName.trim())
        .map(c => ({
          first_name: c.firstName.trim(),
          last_name: c.lastName?.trim() || '',
          relationship: c.relationship || 'Other',
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
      onSave={handleSubmit(onSubmit)}
      saveDisabled={false}
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
        <FormInput
          control={control}
          name="address.street"
          label="Street Address"
          placeholder="123 Main Street"
          error={errors.address?.street?.message}
        />

        <View style={{flexDirection: 'row', gap: 12}}>
          <View style={{flex: 1}}>
            <FormInput
              control={control}
              name="address.city"
              label="City"
              placeholder="Lagos"
              error={errors.address?.city?.message}
            />
          </View>
          <View style={{flex: 1}}>
            <FormInput
              control={control}
              name="address.state"
              label="State"
              placeholder="Lagos"
              error={errors.address?.state?.message}
            />
          </View>
        </View>

        <View style={{flexDirection: 'row', gap: 12}}>
          <View style={{flex: 1}}>
            <Controller
              control={control}
              name="address.country"
              render={({field: {onChange, value}}) => (
                <SelectPicker
                  label="Country"
                  value={value}
                  options={COUNTRY_OPTIONS}
                  onChange={onChange}
                  error={errors.address?.country?.message}
                />
              )}
            />
          </View>
          <View style={{flex: 1}}>
            <FormInput
              control={control}
              name="address.postal_code"
              label="Postal Code"
              placeholder="100001"
              error={errors.address?.postal_code?.message}
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

      {/* Show array-level error */}
      {errors.contacts?.root?.message || errors.contacts?.message ? (
        <Text style={{fontSize: 11, color: colors.destructive, marginBottom: 8, marginLeft: 4}}>
          {errors.contacts?.root?.message || errors.contacts?.message}
        </Text>
      ) : null}

      <ArrayFieldList
        items={fields}
        onAdd={() =>
          append({firstName: '', lastName: '', relationship: '', phone: ''})
        }
        onRemove={index => {
          if (fields.length <= 1) return;
          remove(index);
        }}
        addLabel="Add Emergency Contact"
        maxItems={3}
        renderItem={(_contact, index) => (
          <View style={{gap: 12}}>
            <View style={{flexDirection: 'row', gap: 12}}>
              <View style={{flex: 1}}>
                <FormInput
                  control={control}
                  name={`contacts.${index}.firstName`}
                  label="First Name"
                  required={index === 0}
                  placeholder="Jane"
                  error={errors.contacts?.[index]?.firstName?.message}
                  autoCapitalize="words"
                />
              </View>
              <View style={{flex: 1}}>
                <FormInput
                  control={control}
                  name={`contacts.${index}.lastName`}
                  label="Last Name"
                  placeholder="Doe"
                  error={errors.contacts?.[index]?.lastName?.message}
                  autoCapitalize="words"
                />
              </View>
            </View>
            <Controller
              control={control}
              name={`contacts.${index}.relationship`}
              render={({field: {onChange, value}}) => (
                <SelectPicker
                  label="Relationship"
                  placeholder="Select relationship"
                  value={value || ''}
                  options={RELATIONSHIP_OPTIONS}
                  onChange={onChange}
                  error={errors.contacts?.[index]?.relationship?.message}
                />
              )}
            />
            <FormInput
              control={control}
              name={`contacts.${index}.phone`}
              label="Phone"
              required={index === 0}
              placeholder="08012345678"
              error={errors.contacts?.[index]?.phone?.message}
              keyboardType="phone-pad"
            />
          </View>
        )}
      />
    </SectionScreenLayout>
  );
}
