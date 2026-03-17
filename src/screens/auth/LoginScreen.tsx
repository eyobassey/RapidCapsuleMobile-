import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Eye, EyeOff, Shield, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, FormInput, Text } from '../../components/ui';
import { isAppleAuthAvailable, USER_CANCELLED } from '../../services/socialAuth.service';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';
import {
  forgotPasswordSchema,
  loginSchema,
  type ForgotPasswordFormData,
  type LoginFormData,
} from '../../utils/validation';

function getErrorDetail(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: unknown } }).response;
    if (res?.data != null) return JSON.stringify(res.data, null, 2);
  }
  if (err instanceof Error) return err.message;
  return String(err ?? 'Unknown error');
}

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordSheet, setShowForgotPasswordSheet] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const loginWithApple = useAuthStore((s) => s.loginWithApple);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const { requires2FA, method } = await login(data.email, data.password);
      if (requires2FA) {
        navigation.navigate('Otp', { email: data.email, method: method || 'email' });
      }
      // If no 2FA, the auth store automatically routes via RootNavigator
    } catch (err: unknown) {
      Alert.alert('Login Error', getErrorDetail(err));
    } finally {
      setLoading(false);
    }
  };

  const onForgotPasswordPress = () => {
    setForgotPasswordSuccess(false);
    forgotPasswordForm.reset({ email: getValues('email') });
    setShowForgotPasswordSheet(true);
  };

  const onForgotPasswordSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data.email);
      setForgotPasswordSuccess(true);
    } catch (err: unknown) {
      Alert.alert('Forgot Password', getErrorDetail(err));
    }
  };

  const closeForgotPasswordSheet = () => {
    setShowForgotPasswordSheet(false);
    setForgotPasswordSuccess(false);
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
      await loginWithGoogle();
    } catch (e) {
      if (!isCancelError(e)) {
        Alert.alert('Sign-in Failed', getErrorDetail(e));
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
        Alert.alert('Sign-in Failed', getErrorDetail(e));
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="h-36 bg-card border-b border-border justify-end px-6 pb-6 overflow-hidden">
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
          <Text className="font-bold text-2xl text-foreground">Welcome Back</Text>
          <Text className="text-foreground/60 text-sm mt-0.5">Sign in to your account</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <FormInput
          control={control}
          name="email"
          label="Email Address"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email?.message}
          containerClassName="mb-4"
        />

        <FormInput
          control={control}
          name="password"
          label="Password"
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          error={errors.password?.message}
          rightIcon={
            showPassword ? (
              <Eye
                size={20}
                color={colors.mutedForeground}
                onPress={() => setShowPassword(false)}
              />
            ) : (
              <EyeOff
                size={20}
                color={colors.mutedForeground}
                onPress={() => setShowPassword(true)}
              />
            )
          }
          containerClassName="mb-4"
        />

        {/* Remember me + Forgot */}
        <View className="flex-row justify-between items-center px-1 mb-6">
          <View className="flex-row items-center gap-2">
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              style={styles.switchScale}
              accessibilityRole="switch"
              accessibilityLabel="Remember me"
              accessibilityState={{ checked: rememberMe }}
            />
            <Text className="text-sm text-foreground/80">Remember me</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Forgot password"
            onPress={onForgotPasswordPress}
          >
            <Text className="text-sm font-semibold text-primary">Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <Button onPress={handleSubmit(onSubmit)} loading={loading}>
          Sign In
        </Button>

        <View className="mt-6">
          <Button
            variant="outline"
            onPress={() => navigation.navigate('Otp', { email: getValues('email') })}
            icon={<Shield size={16} color={colors.primary} />}
          >
            Sign in with Passkey
          </Button>
        </View>

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

        {/* Create account link */}
        <View className="flex-row justify-center items-center py-6">
          <Text className="text-sm text-muted-foreground">New to the platform? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            accessibilityRole="link"
            accessibilityLabel="Create account"
          >
            <Text className="text-sm font-semibold text-primary">Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Forgot Password Sheet */}
      <Modal
        visible={showForgotPasswordSheet}
        transparent
        animationType="slide"
        onRequestClose={closeForgotPasswordSheet}
      >
        <Pressable onPress={closeForgotPasswordSheet} style={styles.modalOverlay}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalSheet}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              {/* Handle + Close */}
              <View className="flex-row items-center justify-between pt-4 pb-2">
                <View className="flex-1 items-center">
                  <View className="w-10 h-1 rounded-full" style={styles.handleBar} />
                </View>
                <TouchableOpacity
                  onPress={closeForgotPasswordSheet}
                  accessibilityRole="button"
                  hitSlop={10}
                  accessibilityLabel="Close"
                  className="absolute right-0 top-2 w-10 h-10 rounded-full bg-background border border-border items-center justify-center"
                >
                  <X size={20} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <Text className="text-xl font-bold text-foreground mb-1">Forgot Password</Text>
              <Text className="text-sm text-muted-foreground mb-6">
                Enter your email and we&apos;ll send you a link to reset your password.
              </Text>

              {forgotPasswordSuccess ? (
                <View className="py-4">
                  <Text className="text-base text-foreground mb-4">
                    Check your email for a password reset link. You can close this and return to
                    sign in.
                  </Text>
                  <Button onPress={closeForgotPasswordSheet}>Done</Button>
                </View>
              ) : (
                <>
                  <FormInput
                    control={forgotPasswordForm.control}
                    name="email"
                    label="Email Address"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={forgotPasswordForm.formState.errors.email?.message}
                    containerClassName="mb-6"
                  />
                  <Button
                    onPress={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}
                    loading={forgotPasswordForm.formState.isSubmitting}
                  >
                    Send Reset Link
                  </Button>
                </>
              )}
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  switchScale: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  handleBar: {
    backgroundColor: colors.border,
  },
  socialIcon: { width: 20, height: 20 },
});
