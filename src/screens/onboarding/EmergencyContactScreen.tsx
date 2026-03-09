import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Switch} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft} from 'lucide-react-native';
import {Button, Input} from '../../components/ui';
import {colors} from '../../theme/colors';
import api from '../../services/api';
import {useAuthStore} from '../../store/auth';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
type Props = NativeStackScreenProps<any>;

export default function EmergencyContactScreen({navigation}: Props) {
  const [street, setStreet] = useState('');
  const [contactName, setContactName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [sameAddress, setSameAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const fetchUser = useAuthStore(s => s.fetchUser);

  const handleSave = async () => {
    setLoading(true);
    try {
      const user = useAuthStore.getState().user;
      await api.patch(`/users/${user?._id}`, {
        delivery_addresses: [{street_address: street, country: 'Nigeria', state: 'Lagos'}],
        emergency_contacts: [
          {
            name: contactName,
            relationship,
            phone: contactPhone,
          },
        ],
      });
      await fetchUser();
      // After saving emergency contacts, the auth store's needsOnboarding will flip
      // and RootNavigator will auto-route to Main
    } catch (err: any) {
      // TODO: show error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-2 pb-4 px-4 bg-card border-b border-border flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-10 h-10 rounded-full items-center justify-center">
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        {/* Progress dots */}
        <View className="flex-1 flex-row gap-1 justify-center">
          <View className="w-2 h-2 rounded-full bg-success" />
          <View className="w-6 h-2 rounded-full bg-primary" />
          <View className="w-2 h-2 rounded-full bg-border" />
          <View className="w-2 h-2 rounded-full bg-border" />
        </View>
        <TouchableOpacity onPress={handleSave} accessibilityRole="button" accessibilityLabel="Save">
          <Text className="text-sm font-medium text-primary">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-6" contentContainerClassName="pb-28 gap-8">
        <View>
          <Text className="font-bold text-2xl text-foreground mb-1">
            Address & Emergency
          </Text>
          <Text className="text-sm text-muted-foreground">
            We need this information to serve you better and in case of emergencies.
          </Text>
        </View>

        {/* Address section */}
        <View className="gap-4">
          <Text className="font-bold text-foreground border-b border-border pb-2">
            Your Address
          </Text>
          <Input
            label="Street Address"
            placeholder="123 Main St"
            value={street}
            onChangeText={setStreet}
          />
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Input label="Country" placeholder="Nigeria" editable={false} />
            </View>
            <View className="flex-1">
              <Input label="State" placeholder="Lagos" editable={false} />
            </View>
          </View>
        </View>

        {/* Emergency contact section */}
        <View className="gap-4">
          <View className="flex-row justify-between items-center border-b border-border pb-2">
            <Text className="font-bold text-foreground">Primary Emergency Contact</Text>
            <Text className="text-destructive text-xs">*Required</Text>
          </View>

          <Input
            label="Full Name"
            required
            placeholder="Jane Doe"
            value={contactName}
            onChangeText={setContactName}
          />

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Input
                label="Relationship"
                required
                placeholder="Spouse"
                value={relationship}
                onChangeText={setRelationship}
              />
            </View>
            <View className="flex-1">
              <Input
                label="Phone"
                required
                placeholder="Phone"
                keyboardType="phone-pad"
                value={contactPhone}
                onChangeText={setContactPhone}
              />
            </View>
          </View>

          <View className="flex-row items-center gap-3 mt-2">
            <Switch
              value={sameAddress}
              onValueChange={setSameAddress}
              trackColor={{false: colors.border, true: colors.primary}}
              thumbColor={colors.white}
              style={{transform: [{scaleX: 0.8}, {scaleY: 0.8}]}}
              accessibilityRole="switch"
              accessibilityLabel="Same address as patient"
              accessibilityState={{checked: sameAddress}}
            />
            <Text className="text-sm text-foreground">Same address as patient</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
          onPress={handleSave}
          loading={loading}
          disabled={!contactName || !contactPhone}>
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
}
