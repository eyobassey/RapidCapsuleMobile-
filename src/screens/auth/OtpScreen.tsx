import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield } from 'lucide-react-native';
import { Button, OtpInput, Text } from '../../components/ui';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

export default function OtpScreen({ navigation, route }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(45);
  const verify2FA = useAuthStore((s) => s.verify2FA);
  const resendOTP = useAuthStore((s) => s.resendOTP);
  const email = route.params?.email || '';
  const method = route.params?.method || 'email';
  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 's***h@example.com';

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    setLoading(true);
    try {
      await verify2FA(code, method, email);
      // Auth store will route via RootNavigator
    } catch (err: any) {
      Alert.alert(
        'Verification Failed',
        err?.response?.data?.message || 'Invalid or expired code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOTP(email, method);
      setTimer(45);
    } catch {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background items-center px-6 pt-12">
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="absolute top-14 left-6 w-10 h-10 rounded-full bg-card border border-border items-center justify-center z-10"
      >
        <ArrowLeft size={20} color={colors.foreground} />
      </TouchableOpacity>

      <View className="w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center mb-6 mt-12">
        <Shield size={32} color={colors.primary} />
      </View>

      <Text className="font-bold text-2xl text-foreground mb-2">Two-Factor Auth</Text>
      <Text className="text-foreground/70 text-sm text-center mb-8 max-w-[280px]">
        Enter the 6-digit code sent to your email {maskedEmail}
      </Text>

      <View className="mb-8 w-full">
        <OtpInput onComplete={setCode} />
      </View>

      <Button onPress={handleVerify} loading={loading} disabled={code.length < 6}>
        Verify Code
      </Button>

      <Text className="mt-8 text-sm text-muted-foreground text-center">
        Didn't receive a code?{'\n'}
        {timer > 0 ? (
          <Text className="text-primary font-medium">
            Resend in 0:{timer.toString().padStart(2, '0')}
          </Text>
        ) : (
          <TouchableOpacity
            onPress={handleResend}
            accessibilityRole="button"
            accessibilityLabel="Resend verification code"
          >
            <Text className="text-primary font-medium">Resend Code</Text>
          </TouchableOpacity>
        )}
      </Text>
    </SafeAreaView>
  );
}
