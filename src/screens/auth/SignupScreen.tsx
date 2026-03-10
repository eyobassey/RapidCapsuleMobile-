import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, Eye, EyeOff} from 'lucide-react-native';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';
import {Button, FormInput} from '../../components/ui';
import {useAuthStore} from '../../store/auth';
import {colors} from '../../theme/colors';
import {signupSchema, type SignupFormData} from '../../utils/validation';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({navigation}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const signup = useAuthStore(s => s.signup);
  const googleLogin = useAuthStore(s => s.googleLogin);
  const appleLogin = useAuthStore(s => s.appleLogin);

  const {control, handleSubmit, formState: {errors}} = useForm<SignupFormData>({
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
      navigation.navigate('VerifyEmail', {email: data.email});
    } catch (err: any) {
      // TODO: show error toast
    } finally {
      setLoading(false);
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
          className="absolute top-4 left-6 w-10 h-10 rounded-full bg-background border border-border items-center justify-center z-10">
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
              <Eye size={18} color={colors.mutedForeground} onPress={() => setShowPassword(false)} />
            ) : (
              <EyeOff size={18} color={colors.mutedForeground} onPress={() => setShowPassword(true)} />
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
            accessibilityState={{checked: agreeTerms}}
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor={colors.white}
            style={{transform: [{scaleX: 0.8}, {scaleY: 0.8}]}}
          />
          <Text className="flex-1 text-xs text-foreground/80 leading-tight">
            I agree to the{' '}
            <Text className="text-primary">Terms of Service</Text> and{' '}
            <Text className="text-primary">Privacy Policy</Text>.
          </Text>
        </View>

        <Button
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={!agreeTerms}>
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
        <View className="flex-row gap-4 mb-12">
          <View className="flex-1">
            <Button
              variant="outline"
              loading={socialLoading}
              onPress={async () => {
                setSocialLoading(true);
                try {
                  await GoogleSignin.hasPlayServices();
                  const response = await GoogleSignin.signIn();
                  const idToken = response.data?.idToken;
                  if (!idToken) throw new Error('No ID token from Google');
                  await googleLogin(idToken, 'Patient');
                } catch (err: any) {
                  if (err?.code !== 'SIGN_IN_CANCELLED') {
                    Alert.alert('Google Sign-In', err?.message || 'Failed');
                  }
                } finally {
                  setSocialLoading(false);
                }
              }}>
              Google
            </Button>
          </View>
          {Platform.OS === 'ios' && (
            <View className="flex-1">
              <Button
                variant="outline"
                loading={socialLoading}
                onPress={async () => {
                  setSocialLoading(true);
                  try {
                    const credential = await appleAuth.performRequest({
                      requestedOperation: appleAuth.Operation.LOGIN,
                      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
                    });
                    const credentialState = await appleAuth.getCredentialStateForUser(credential.user);
                    if (credentialState !== appleAuth.State.AUTHORIZED) {
                      throw new Error('Apple Sign-In not authorized');
                    }
                    if (!credential.identityToken || !credential.authorizationCode) {
                      throw new Error('Missing Apple credentials');
                    }
                    await appleLogin(
                      credential.identityToken,
                      credential.authorizationCode,
                      'Patient',
                      credential.fullName,
                      credential.email,
                    );
                  } catch (err: any) {
                    if (err?.code !== 'ERR_REQUEST_CANCELED') {
                      Alert.alert('Apple Sign-In', err?.message || 'Failed');
                    }
                  } finally {
                    setSocialLoading(false);
                  }
                }}>
                Apple
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
