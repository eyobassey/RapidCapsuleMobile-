import React from 'react';
import {View, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CheckCircle2} from 'lucide-react-native';
import {Button} from '../../components/ui';
import {colors} from '../../theme/colors';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailVerified'>;

export default function EmailVerifiedScreen({navigation}: Props) {
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
      <View className="w-24 h-24 bg-success/10 rounded-full items-center justify-center mb-6">
        <CheckCircle2 size={48} color={colors.success} />
      </View>

      <Text className="font-bold text-2xl text-foreground mb-2 text-center">
        Email Verified!
      </Text>
      <Text className="text-foreground/70 text-sm text-center mb-8 max-w-xs">
        Your email address has been successfully verified. You can now sign in to your account.
      </Text>

      <Button variant="highContrast" onPress={() => navigation.navigate('Login')}>
        Proceed to Login
      </Button>
    </SafeAreaView>
  );
}
