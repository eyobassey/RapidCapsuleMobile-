import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Mail} from 'lucide-react-native';
import {Button} from '../../components/ui';
import {colors} from '../../theme/colors';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export default function VerifyEmailScreen({navigation}: Props) {
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
      <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-6">
        <Mail size={40} color={colors.primary} />
      </View>

      <Text className="font-bold text-2xl text-foreground mb-2 text-center">
        Check your email
      </Text>
      <Text className="text-foreground/70 text-sm text-center mb-8 max-w-xs">
        We've sent a verification link to your email address. Please click the link to verify your account.
      </Text>

      <Button onPress={() => navigation.navigate('EmailVerified')}>
        Open Email App
      </Button>

      <TouchableOpacity
        onPress={() => navigation.navigate('Splash')}
        className="mt-6">
        <Text className="text-sm text-muted-foreground">Back to home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
