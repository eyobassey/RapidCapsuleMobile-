import React, {useState, useEffect} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import {Wallet, Sparkles, CreditCard} from 'lucide-react-native';
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
  const [creditsData, setCreditsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch wallet balance and AI credits in parallel
      const [walletRes, creditsRes] = await Promise.allSettled([
        api.get('/wallets/balance'),
        api.get('/claude-summary/credits'),
      ]);

      if (walletRes.status === 'fulfilled') {
        const wd = walletRes.value.data.data || walletRes.value.data.result || walletRes.value.data;
        setWalletData(wd);
      }

      if (creditsRes.status === 'fulfilled') {
        const cd = creditsRes.value.data.data || creditsRes.value.data.result || creditsRes.value.data;
        setCreditsData(cd);
      }
    } catch {
      // Silently fail — screen will show zeros
    } finally {
      setLoading(false);
    }
  };

  // Wallet: GET /wallets/balance returns {totalEarnings, totalWithdrawals, currentBalance}
  const balance = walletData?.currentBalance ?? walletData?.balance ?? 0;
  // Currency from user's preferred_currency or default NGN
  const currency = (user as any)?.preferred_currency || 'NGN';

  // Credits: GET /claude-summary/credits returns
  // {free_credits_remaining, purchased_credits, gifted_credits, has_unlimited_subscription, total_available, total_summaries_generated}
  const freeCredits = creditsData?.free_credits_remaining ?? 0;
  const purchasedCredits = creditsData?.purchased_credits ?? 0;
  const giftedCredits = creditsData?.gifted_credits ?? 0;
  const totalCredits = creditsData?.total_available ?? (freeCredits + purchasedCredits + giftedCredits);
  const summariesGenerated = creditsData?.total_summaries_generated ?? 0;
  const hasUnlimited = creditsData?.has_unlimited_subscription ?? false;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount / 100); // Amount in kobo/pence, convert to major unit
  };

  const handleFundWallet = () => {
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
                  {currency} {formatCurrency(balance)}
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
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16}}>
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
                <Text style={{fontSize: 28, fontWeight: '700', color: colors.foreground}}>
                  {hasUnlimited ? 'Unlimited' : totalCredits}
                </Text>
              </View>
            </View>

            {/* Credit breakdown */}
            <View style={{gap: 8}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={{fontSize: 13, color: colors.mutedForeground}}>Free Credits</Text>
                <Text style={{fontSize: 13, color: colors.foreground, fontWeight: '600'}}>{freeCredits}</Text>
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={{fontSize: 13, color: colors.mutedForeground}}>Purchased Credits</Text>
                <Text style={{fontSize: 13, color: colors.foreground, fontWeight: '600'}}>{purchasedCredits}</Text>
              </View>
              {giftedCredits > 0 && (
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                  <Text style={{fontSize: 13, color: colors.mutedForeground}}>Gifted Credits</Text>
                  <Text style={{fontSize: 13, color: colors.foreground, fontWeight: '600'}}>{giftedCredits}</Text>
                </View>
              )}
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 8,
                  marginTop: 4,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                <Text style={{fontSize: 13, color: colors.mutedForeground}}>Summaries Generated</Text>
                <Text style={{fontSize: 13, color: colors.foreground, fontWeight: '600'}}>{summariesGenerated}</Text>
              </View>
            </View>
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
