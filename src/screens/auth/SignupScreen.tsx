import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, Eye, EyeOff} from 'lucide-react-native';
import {Button, Input} from '../../components/ui';
import {useAuthStore} from '../../store/auth';
import {colors} from '../../theme/colors';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({navigation}: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const signup = useAuthStore(s => s.signup);

  const handleSignup = async () => {
    setLoading(true);
    try {
      await signup({
        profile: {first_name: firstName, last_name: lastName, phone_number: phone, date_of_birth: dob},
        email,
        password,
      });
      navigation.navigate('VerifyEmail', {email});
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
            <Input
              label="First Name"
              required
              placeholder="John"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View className="flex-1">
            <Input
              label="Last Name"
              required
              placeholder="Doe"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
        </View>

        <Input
          label="Email"
          required
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          containerClassName="mb-5"
        />

        <Input
          label="Phone"
          required
          placeholder="801 234 5678"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          containerClassName="mb-5"
        />

        <Input
          label="Date of Birth"
          required
          placeholder="YYYY-MM-DD"
          value={dob}
          onChangeText={setDob}
          containerClassName="mb-1"
        />
        <Text className="text-[10px] text-muted-foreground ml-1 mb-5">Must be 18+ years old</Text>

        <Input
          label="Password"
          required
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
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
          onPress={handleSignup}
          loading={loading}
          disabled={!agreeTerms || !firstName || !email || !password}>
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
            <Button variant="outline">Google</Button>
          </View>
          <View className="flex-1">
            <Button variant="outline">Apple</Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
