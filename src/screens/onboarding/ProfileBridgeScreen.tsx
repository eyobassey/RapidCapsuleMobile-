import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {User, Plus} from 'lucide-react-native';
import {Button} from '../../components/ui';
import {useAuthStore} from '../../store/auth';
import {colors} from '../../theme/colors';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {OnboardingStackParamList} from '../../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ProfileBridge'>;

export default function ProfileBridgeScreen({navigation}: Props) {
  const user = useAuthStore(s => s.user);
  const firstName = user?.profile?.first_name || 'there';

  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
      {/* Avatar placeholder */}
      <View className="w-24 h-24 rounded-full border-4 border-card bg-muted items-center justify-center mb-6 relative">
        <User size={40} color={colors.mutedForeground} />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Add profile photo" className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full border-2 border-background items-center justify-center">
          <Plus size={16} color={colors.white} />
        </TouchableOpacity>
      </View>

      <Text className="font-bold text-3xl text-foreground mb-3">
        Hi, {firstName}!
      </Text>
      <Text className="text-foreground/70 text-base text-center mb-10 max-w-xs leading-relaxed">
        Welcome to Rapid Capsule. Let us guide you through setting up your health profile.
      </Text>

      <Button
        variant="highContrast"
        onPress={() => navigation.navigate('OnboardingDashboard')}>
        Get Started
      </Button>
    </SafeAreaView>
  );
}
