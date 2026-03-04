import React, {useState, useEffect} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import {Wallet, Sparkles, CreditCard, ArrowRight} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Header, Button} from '../../components/ui';
import {colors} from '../../theme/colors';
import {useAuthStore} from '../../store/auth';
import api from '../../services/api';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {OnboardingStackParamList} from '../../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'WalletCredits'>;

export default function WalletCreditsScreen({navigation}: Props) {
  const user = useAuthStore(s => s.user);
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const res = await api.get('/wallets/balance');
      setWalletData(res.data.data || res.data.result || res.data);
    } catch {
      // Use user.wallet as fallback
      if (user?.wallet) {
        setWalletData(user.wallet);
      }
    } finally {
      setLoading(false);
    }
  };

  const balance = walletData?.balance || 0;
  const currency = walletData?.currency || 'NGN';

  const handleFundWallet = () => {
    // Navigate to payment flow in main app
    (navigation as any).navigate('Main', {screen: 'Wallet'});
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Wallet & AI Credits" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={{flex: 1, padding: 20, gap: 16}}>
          {/* Wallet Balance Card */}
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 20,
              padding: 24,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16}}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: `${colors.primary}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Wallet size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={{fontSize: 12, color: colors.mutedForeground, fontWeight: '600'}}>
                  Wallet Balance
                </Text>
                <Text style={{fontSize: 28, fontWeight: '700', color: colors.foreground}}>
                  {currency} {balance.toLocaleString()}
                </Text>
              </View>
            </View>
            <Button variant="primary" onPress={handleFundWallet} icon={<CreditCard size={18} color={colors.white} />}>
              Fund Wallet
            </Button>
          </View>

          {/* AI Credits Card */}
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 20,
              padding: 24,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12}}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: `${colors.accent}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Sparkles size={24} color={colors.accent} />
              </View>
              <View>
                <Text style={{fontSize: 12, color: colors.mutedForeground, fontWeight: '600'}}>
                  AI Health Credits
                </Text>
                <Text style={{fontSize: 13, color: colors.foreground, marginTop: 2}}>
                  Used for AI-powered health summaries
                </Text>
              </View>
            </View>

            <Text style={{fontSize: 12, color: colors.mutedForeground, lineHeight: 18}}>
              AI credits are used to generate personalized health summaries from your checkup results. Credits can be purchased or earned through subscriptions.
            </Text>
          </View>

          {/* Info card */}
          <View
            style={{
              backgroundColor: `${colors.primary}10`,
              borderRadius: 16,
              padding: 16,
            }}>
            <Text style={{fontSize: 12, color: colors.mutedForeground, lineHeight: 18}}>
              You can always fund your wallet and manage credits from the main app. This step is optional during onboarding.
            </Text>
          </View>

          <Button variant="outline" onPress={() => navigation.goBack()}>
            Back to Profile Setup
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}
