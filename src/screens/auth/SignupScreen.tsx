import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FormInput, Text } from '../../components/ui';
import { useAuthStore } from '../../store/auth';
import { isAppleAuthAvailable, USER_CANCELLED } from '../../services/socialAuth.service';
import { colors } from '../../theme/colors';
import { signupSchema, type SignupFormData } from '../../utils/validation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const signup = useAuthStore((s) => s.signup);
  const signupWithGoogle = useAuthStore((s) => s.signupWithGoogle);
  const loginWithApple = useAuthStore((s) => s.loginWithApple);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    try {
      await signup({
        profile: {
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone,
          date_of_birth: data.date_of_birth,
        },
        email: data.email,
        password: data.password,
      });
      navigation.navigate('VerifyEmail', { email: data.email });
    } catch {
      // TODO: show error toast
    } finally {
      setLoading(false);
    }
  };

  const isCancelError = (e: unknown): boolean => {
    const msg = e instanceof Error ? e.message : String(e);
    const msgLower = msg.toLowerCase();
    const code = (e as { code?: number | string })?.code;
    return (
      msg === USER_CANCELLED ||
      msgLower.includes('cancel') ||
      msgLower.includes('cancelled') ||
      msgLower.includes('dismissed') ||
      code === 1001 ||
      code === '1001' ||
      code === -5
    );
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading('google');
    try {
      await signupWithGoogle();
    } catch (e) {
      if (!isCancelError(e)) {
        const msg = e instanceof Error ? e.message : 'Google sign-in failed';
        Alert.alert('Sign-in Failed', msg);
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setSocialLoading('apple');
    try {
      await loginWithApple();
    } catch (e) {
      if (!isCancelError(e)) {
        const msg = e instanceof Error ? e.message : 'Apple sign-in failed';
        Alert.alert('Sign-in Failed', msg);
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="h-28 bg-card border-b border-border justify-end px-6 pb-4 overflow-hidden">
        <View className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full opacity-60" />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="absolute top-4 left-6 w-10 h-10 rounded-full bg-background border border-border items-center justify-center z-10"
        >
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View className="ml-14">
          <Text className="font-bold text-2xl text-foreground">Sign Up</Text>
          <Text className="text-foreground/60 text-xs mt-0.5">Create your patient profile</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Name row */}
        <View className="flex-row gap-4 mb-5">
          <View className="flex-1">
            <FormInput
              control={control}
              name="first_name"
              label="First Name"
              required
              placeholder="John"
              error={errors.first_name?.message}
            />
          </View>
          <View className="flex-1">
            <FormInput
              control={control}
              name="last_name"
              label="Last Name"
              required
              placeholder="Doe"
              error={errors.last_name?.message}
            />
          </View>
        </View>

        <FormInput
          control={control}
          name="email"
          label="Email"
          required
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email?.message}
          containerClassName="mb-5"
        />

        <FormInput
          control={control}
          name="phone"
          label="Phone"
          required
          placeholder="801 234 5678"
          keyboardType="phone-pad"
          error={errors.phone?.message}
          containerClassName="mb-5"
        />

        <FormInput
          control={control}
          name="date_of_birth"
          label="Date of Birth"
          required
          placeholder="YYYY-MM-DD"
          error={errors.date_of_birth?.message}
          containerClassName="mb-1"
        />
        <Text className="text-[10px] text-muted-foreground ml-1 mb-5">Must be 18+ years old</Text>

        <FormInput
          control={control}
          name="password"
          label="Password"
          required
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          error={errors.password?.message}
          rightIcon={
            showPassword ? (
              <Eye
                size={18}
                color={colors.mutedForeground}
                onPress={() => setShowPassword(false)}
              />
            ) : (
              <EyeOff
                size={18}
                color={colors.mutedForeground}
                onPress={() => setShowPassword(true)}
              />
            )
          }
          containerClassName="mb-5"
        />

        {/* Terms checkbox */}
        <View className="flex-row items-start gap-3 mb-6">
          <Switch
            value={agreeTerms}
            onValueChange={setAgreeTerms}
            accessibilityRole="switch"
            accessibilityLabel="Agree to Terms of Service and Privacy Policy"
            accessibilityState={{ checked: agreeTerms }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
          <Text className="flex-1 text-xs text-foreground/80 leading-tight">
            I agree to the{' '}
            <Text
              className="text-primary"
              onPress={() => Linking.openURL('https://rapidcapsule.com/terms-and-conditions')}
            >
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text
              className="text-primary"
              onPress={() => Linking.openURL('https://rapidcapsule.com/privacy-policy')}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </View>

        <Button onPress={handleSubmit(onSubmit)} loading={loading} disabled={!agreeTerms}>
          Create Account
        </Button>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-border" />
          <Text className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Or continue with
          </Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        {/* Social buttons */}
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Button
              variant="outline"
              onPress={handleGoogleSignIn}
              loading={socialLoading === 'google'}
              disabled={!!socialLoading}
              icon={
                <Image
                  source={require('../../../assets/google.png')}
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              }
            >
              Google
            </Button>
          </View>
          {isAppleAuthAvailable() && (
            <View className="flex-1">
              <Button
                variant="outline"
                onPress={handleAppleSignIn}
                loading={socialLoading === 'apple'}
                disabled={!!socialLoading}
                icon={
                  <Image
                    source={require('../../../assets/apple.png')}
                    style={styles.socialIcon}
                    resizeMode="contain"
                  />
                }
              >
                Apple
              </Button>
            </View>
          )}
        </View>

        {/* Sign in link */}
        <View className="flex-row justify-center items-center py-6 mb-6">
          <Text className="text-sm text-muted-foreground">Already a member? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="link"
            accessibilityLabel="Sign in"
          >
            <Text className="text-sm font-semibold text-primary">Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  socialIcon: { width: 20, height: 20 },
});
