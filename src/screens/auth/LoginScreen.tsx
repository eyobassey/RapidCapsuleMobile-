import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, EyeOff, Eye, Shield} from 'lucide-react-native';
import {Button, Input} from '../../components/ui';
import {useAuthStore} from '../../store/auth';
import {colors} from '../../theme/colors';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const [activeTab, setActiveTab] = useState<'Patient' | 'Specialist'>('Patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(s => s.login);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const {requires2FA} = await login(email, password);
      if (requires2FA) {
        navigation.navigate('Otp', {email});
      }
      // If no 2FA, the auth store automatically routes via RootNavigator
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      Alert.alert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="h-36 bg-card border-b border-border justify-end px-6 pb-6 overflow-hidden">
        <View className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full opacity-60" />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute top-4 left-6 w-10 h-10 rounded-full bg-background border border-border items-center justify-center z-10">
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View className="ml-14">
          <Text className="font-bold text-2xl text-foreground">Welcome Back</Text>
          <Text className="text-foreground/60 text-sm mt-0.5">Sign in to your account</Text>
        </View>
      </View>

      <View className="flex-1 px-6 pt-6">
        {/* Tab Switcher */}
        <View className="flex-row bg-card border border-border rounded-xl p-1 mb-8">
          {(['Patient', 'Specialist'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg items-center ${
                activeTab === tab ? 'bg-background shadow-sm' : ''
              }`}>
              <Text
                className={`text-sm ${
                  activeTab === tab
                    ? 'font-bold text-foreground'
                    : 'font-medium text-muted-foreground'
                }`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Email Address"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          containerClassName="mb-4"
        />

        <Input
          label="Password"
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          rightIcon={
            showPassword ? (
              <Eye size={20} color={colors.mutedForeground} onPress={() => setShowPassword(false)} />
            ) : (
              <EyeOff size={20} color={colors.mutedForeground} onPress={() => setShowPassword(true)} />
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
              trackColor={{false: colors.border, true: colors.primary}}
              thumbColor={colors.white}
              style={{transform: [{scaleX: 0.7}, {scaleY: 0.7}]}}
            />
            <Text className="text-sm text-foreground/80">Remember me</Text>
          </View>
          <TouchableOpacity>
            <Text className="text-sm font-semibold text-primary">Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <Button onPress={handleLogin} loading={loading} disabled={!email || !password}>
          Sign In
        </Button>

        <View className="mt-6">
          <Button
            variant="outline"
            onPress={() => navigation.navigate('Otp', {email})}
            icon={<Shield size={16} color={colors.primary} />}>
            Sign in with Passkey
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
