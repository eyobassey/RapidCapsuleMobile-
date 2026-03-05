import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {WebView} from 'react-native-webview';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Sparkles,
  Zap,
  Gift,
  Crown,
  ShoppingCart,
  ChevronRight,
  Send,
  AlertTriangle,
  Check,
  Search,
  X,
  Minus,
  Plus,
} from 'lucide-react-native';

import {useWalletStore} from '../../store/wallet';
import {useCreditsStore, type CreditPlan} from '../../store/credits';
import {creditsService} from '../../services/credits.service';
import {Header, Button, Skeleton, TabBar} from '../../components/ui';
import {colors} from '../../theme/colors';
import {formatCurrency, formatDate, formatDateTime} from '../../utils/formatters';

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000];
const CURRENCY_SYMBOLS: Record<string, string> = {NGN: '₦', USD: '$', GBP: '£', EUR: '€'};

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'wallet');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CreditPlan | null>(null);

  // Fund wallet state
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);
  const [fundReference, setFundReference] = useState<string | null>(null);

  // Share credits state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareStep, setShareStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [creditsToSend, setCreditsToSend] = useState(1);
  const searchDebounceRef = useRef<any>(null);

  const {
    balance,
    currency,
    transactions,
    isLoading: walletLoading,
    funding,
    fetchBalance,
    fetchTransactions,
    fundWallet,
    verifyFunding,
  } = useWalletStore();

  const {
    freeCredits,
    purchasedCredits,
    giftedCredits,
    totalAvailable,
    hasUnlimited,
    totalGenerated,
    plans,
    plansLoading,
    transactions: creditTransactions,
    transactionsLoading,
    isLoading: creditsLoading,
    purchasing,
    sharingSettings,
    transferring,
    fetchCredits,
    fetchPlans,
    fetchTransactions: fetchCreditTransactions,
    purchasePlan,
    fetchSharingSettings,
    transferCredits,
  } = useCreditsStore();

  const tabs = [
    {label: 'Wallet', value: 'wallet'},
    {label: 'AI Credits', value: 'credits'},
    {label: 'Plans', value: 'plans'},
  ];

  useEffect(() => {
    fetchBalance();
    fetchTransactions({limit: 100});
    fetchCredits();
    fetchPlans();
    fetchCreditTransactions();
    fetchSharingSettings();
  }, []);

  // Handle deep-link param for initial tab
  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      fetchBalance(),
      fetchTransactions({limit: 100}),
      fetchCredits(),
      fetchPlans(),
      fetchCreditTransactions(),
    ]);
    setRefreshing(false);
  }, [fetchBalance, fetchTransactions, fetchCredits, fetchPlans, fetchCreditTransactions]);

  // Wallet stats
  const stats = useMemo(() => {
    let totalSpent = 0;
    let totalFunded = 0;
    for (const tx of transactions) {
      const amount = tx.amount || 0;
      const type = (tx.type || '').toLowerCase();
      if (type === 'credit' || type === 'fund' || type === 'deposit') {
        totalFunded += amount;
      } else {
        totalSpent += amount;
      }
    }
    return {totalSpent, totalFunded};
  }, [transactions]);

  const isCredit = (tx: any) => {
    const type = (tx.type || '').toLowerCase();
    return type === 'credit' || type === 'fund' || type === 'deposit';
  };

  // Plan price in user's currency
  const getPlanPrice = (plan: CreditPlan) => {
    if (plan.prices?.[currency]?.price != null) {
      return plan.prices[currency].price;
    }
    return plan.price;
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    const success = await purchasePlan(selectedPlan._id);
    if (success) {
      setShowPurchaseModal(false);
      setSelectedPlan(null);
      Alert.alert('Success', 'Credits purchased successfully!');
    } else {
      Alert.alert(
        'Purchase Failed',
        useCreditsStore.getState().purchaseError || 'Something went wrong.',
      );
    }
  };

  // ── Fund Wallet handler ──
  const handleFundWallet = useCallback(async () => {
    const amount = parseFloat(fundAmount);
    if (!amount || amount < 100) return;
    setShowFundModal(false);
    const result = await fundWallet(amount);
    if (result?.authorization_url) {
      setFundReference(result.reference);
      setPaystackUrl(result.authorization_url);
    } else {
      // Payment processed directly or failed
      const err = useWalletStore.getState().fundingError;
      if (err) {
        Alert.alert('Error', err);
      }
    }
  }, [fundAmount, fundWallet]);

  // ── Handle Paystack WebView navigation ──
  const handlePaystackNavigation = useCallback(async (navState: {url: string}) => {
    const url = navState.url || '';
    // Detect redirect away from Paystack (callback reached)
    if (paystackUrl && url !== paystackUrl && !url.includes('paystack.co') && !url.includes('paystack.com')) {
      setPaystackUrl(null);
      if (fundReference) {
        const verified = await verifyFunding(fundReference);
        if (verified) {
          Alert.alert('Success', 'Wallet funded successfully!');
          setFundAmount('');
        } else {
          Alert.alert('Verification Pending', 'Your payment is being processed. Balance will update shortly.');
        }
        setFundReference(null);
      }
    }
  }, [paystackUrl, fundReference, verifyFunding]);

  const handleClosePaystack = useCallback(async () => {
    setPaystackUrl(null);
    // Attempt to verify in case payment was completed before closing
    if (fundReference) {
      const verified = await verifyFunding(fundReference);
      if (verified) {
        Alert.alert('Success', 'Wallet funded successfully!');
        setFundAmount('');
      }
      setFundReference(null);
    }
  }, [fundReference, verifyFunding]);

  // ── Recipient search (debounced) ──
  const handleRecipientSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await creditsService.searchPatients(text.trim());
        setSearchResults(Array.isArray(results) ? results : []);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 400);
  }, []);

  // ── Transfer credits handler ──
  const handleTransfer = useCallback(async () => {
    if (!selectedRecipient || !creditsToSend) return;
    const recipientId = selectedRecipient.id || selectedRecipient._id;
    const result = await transferCredits(recipientId, creditsToSend);
    if (result?.success) {
      setShareStep(3);
    } else {
      Alert.alert('Transfer Failed', result?.message || 'Something went wrong.');
    }
  }, [selectedRecipient, creditsToSend, transferCredits]);

  const closeShareModal = useCallback(() => {
    if (transferring) return;
    setShowShareModal(false);
    setShareStep(1);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedRecipient(null);
    setCreditsToSend(sharingSettings?.min_amount || 1);
  }, [transferring, sharingSettings]);

  const maxTransfer = Math.min(sharingSettings?.max_amount || 50, purchasedCredits);

  const isLoading = walletLoading && creditsLoading && transactions.length === 0;

  // Loading skeleton
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Wallet & Credits" onBack={() => navigation.goBack()} />
        <ScrollView className="flex-1 px-5 pt-4">
          <Skeleton height={50} borderRadius={12} className="mb-4" />
          <Skeleton height={160} borderRadius={24} className="mb-4" />
          <View className="flex-row gap-3 mb-6">
            <Skeleton height={70} borderRadius={16} className="flex-1" />
            <Skeleton height={70} borderRadius={16} className="flex-1" />
          </View>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} height={60} borderRadius={16} className="mb-2" />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Wallet & Credits" onBack={() => navigation.goBack()} />

      {/* Tab Bar */}
      <View style={{paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4}}>
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{paddingBottom: 48}}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        {/* ═══════ WALLET TAB ═══════ */}
        <View style={activeTab !== 'wallet' ? {display: 'none'} : undefined}>
          <>
            {/* Balance Card */}
            <View className="mx-5 mt-4 bg-primary/10 border border-primary/20 rounded-3xl p-6 overflow-hidden relative">
              <View className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full" />
              <View className="absolute -bottom-4 -left-4 w-20 h-20 bg-primary/5 rounded-full" />
              <View className="relative z-10">
                <View className="flex-row items-center gap-2 mb-2">
                  <Wallet size={18} color={colors.primary} />
                  <Text className="text-sm text-muted-foreground font-medium">
                    Available Balance
                  </Text>
                </View>
                <Text className="text-3xl font-bold text-foreground mb-6">
                  {formatCurrency(balance, currency)}
                </Text>
                <Button
                  variant="primary"
                  icon={<CreditCard size={18} color={colors.white} />}
                  onPress={() => setShowFundModal(true)}>
                  Fund Wallet
                </Button>
              </View>
            </View>

            {/* Quick Stats */}
            <View className="flex-row mx-5 mt-4 gap-3">
              <View className="flex-1 bg-card border border-border rounded-2xl p-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <View className="w-7 h-7 rounded-full bg-destructive/10 items-center justify-center">
                    <TrendingUp size={14} color={colors.destructive} />
                  </View>
                  <Text className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Total Spent
                  </Text>
                </View>
                <Text className="text-lg font-bold text-foreground">
                  {formatCurrency(stats.totalSpent, currency)}
                </Text>
              </View>
              <View className="flex-1 bg-card border border-border rounded-2xl p-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <View className="w-7 h-7 rounded-full bg-success/10 items-center justify-center">
                    <TrendingDown size={14} color={colors.success} />
                  </View>
                  <Text className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Total Funded
                  </Text>
                </View>
                <Text className="text-lg font-bold text-foreground">
                  {formatCurrency(stats.totalFunded, currency)}
                </Text>
              </View>
            </View>

            {/* Transactions */}
            <View className="mx-5 mt-6">
              <Text className="text-sm font-bold text-foreground mb-3 px-1">
                Recent Transactions
              </Text>
              {transactions.length === 0 ? (
                <View className="bg-card border border-border rounded-2xl p-8 items-center">
                  <View className="bg-muted rounded-full p-4 mb-3">
                    <Wallet size={28} color={colors.mutedForeground} />
                  </View>
                  <Text className="text-sm font-semibold text-foreground">
                    No transactions yet
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1 text-center">
                    Your transaction history will appear here.
                  </Text>
                </View>
              ) : (
                transactions.map((tx: any, index: number) => {
                  const credit = isCredit(tx);
                  return (
                    <View
                      key={tx._id || `tx-${index}`}
                      className="bg-card border border-border rounded-2xl p-4 mb-2">
                      <View className="flex-row items-center gap-3">
                        <View
                          className={`w-11 h-11 rounded-full items-center justify-center ${
                            credit ? 'bg-success/10' : 'bg-destructive/10'
                          }`}>
                          {credit ? (
                            <ArrowDownLeft size={20} color={colors.success} />
                          ) : (
                            <ArrowUpRight size={20} color={colors.destructive} />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                            {tx.description || tx.narration || (credit ? 'Wallet Credit' : 'Payment')}
                          </Text>
                          <Text className="text-xs text-muted-foreground mt-0.5">
                            {tx.created_at ? formatDateTime(tx.created_at) : tx.date ? formatDate(tx.date) : ''}
                          </Text>
                        </View>
                        <Text
                          className={`text-sm font-bold ${
                            credit ? 'text-success' : 'text-destructive'
                          }`}>
                          {credit ? '+' : '-'}
                          {formatCurrency(Math.abs(tx.amount || 0), currency)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        </View>

        {/* ═══════ AI CREDITS TAB ═══════ */}
        <View style={activeTab !== 'credits' ? {display: 'none'} : undefined}>
          <>
            {/* Credits Summary Card */}
            <View
              style={{
                marginHorizontal: 20,
                marginTop: 16,
                backgroundColor: `${colors.accent}10`,
                borderWidth: 1,
                borderColor: `${colors.accent}25`,
                borderRadius: 24,
                padding: 24,
                overflow: 'hidden',
              }}>
              {/* Decorative */}
              <View
                style={{
                  position: 'absolute',
                  top: -12,
                  right: -12,
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: `${colors.accent}10`,
                }}
              />

              <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20}}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: `${colors.accent}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Sparkles size={24} color={colors.accent} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={{fontSize: 12, color: colors.mutedForeground, fontWeight: '600'}}>
                    AI Health Summary Credits
                  </Text>
                  <Text style={{fontSize: 11, color: colors.mutedForeground, marginTop: 1}}>
                    Generate detailed health reports with AI
                  </Text>
                </View>
              </View>

              {/* Total Credits */}
              <View style={{alignItems: 'center', marginBottom: 20}}>
                {hasUnlimited ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: `${colors.primary}20`,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}>
                    <Crown size={18} color={colors.primary} />
                    <Text style={{fontSize: 16, fontWeight: '700', color: colors.primary}}>
                      Unlimited
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={{fontSize: 48, fontWeight: '700', color: colors.foreground}}>
                      {totalAvailable}
                    </Text>
                    <Text style={{fontSize: 13, color: colors.mutedForeground, fontWeight: '500'}}>
                      credits remaining
                    </Text>
                  </>
                )}
              </View>

              {/* Breakdown */}
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 16,
                  gap: 12,
                }}>
                <CreditBreakdownRow
                  label="Free"
                  value={`${freeCredits}/5`}
                  dotColor={colors.primary}
                />
                <CreditBreakdownRow
                  label="Purchased"
                  value={String(purchasedCredits)}
                  dotColor={colors.success}
                />
                <CreditBreakdownRow
                  label="Gifted"
                  value={String(giftedCredits)}
                  dotColor={colors.accent}
                />
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingTop: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{fontSize: 13, color: colors.mutedForeground}}>
                    Summaries Generated
                  </Text>
                  <Text style={{fontSize: 13, fontWeight: '700', color: colors.foreground}}>
                    {totalGenerated}
                  </Text>
                </View>
              </View>

              {/* Buy More */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveTab('plans')}
                style={{
                  marginTop: 16,
                  backgroundColor: colors.accent,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}>
                <ShoppingCart size={16} color={colors.white} />
                <Text style={{fontSize: 14, fontWeight: '700', color: colors.white}}>
                  Buy More Credits
                </Text>
              </TouchableOpacity>

              {/* Share Credits */}
              {sharingSettings?.enabled && purchasedCredits > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setShareStep(1);
                    setSearchQuery('');
                    setSearchResults([]);
                    setSelectedRecipient(null);
                    setCreditsToSend(sharingSettings?.min_amount || 1);
                    setShowShareModal(true);
                  }}
                  style={{
                    marginTop: 8,
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: colors.accent,
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}>
                  <Send size={16} color={colors.accent} />
                  <Text style={{fontSize: 14, fontWeight: '700', color: colors.accent}}>
                    Share Credits
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Credit Transaction History */}
            <View style={{marginHorizontal: 20, marginTop: 24}}>
              <Text style={{fontSize: 14, fontWeight: '700', color: colors.foreground, marginBottom: 12}}>
                Credit History
              </Text>

              {transactionsLoading ? (
                <View style={{gap: 8}}>
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} height={60} borderRadius={16} />
                  ))}
                </View>
              ) : creditTransactions.length === 0 ? (
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 16,
                    padding: 24,
                    alignItems: 'center',
                  }}>
                  <Sparkles size={28} color={colors.mutedForeground} />
                  <Text style={{fontSize: 13, color: colors.mutedForeground, marginTop: 8}}>
                    No credit transactions yet
                  </Text>
                </View>
              ) : (
                creditTransactions.map((tx, index) => (
                  <CreditTransactionItem key={tx._id || `ctx-${index}`} tx={tx} />
                ))
              )}
            </View>
          </>
        </View>

        {/* ═══════ PLANS TAB ═══════ */}
        <View style={activeTab !== 'plans' ? {display: 'none'} : {paddingHorizontal: 20, paddingTop: 16}}>
            <Text style={{fontSize: 14, fontWeight: '700', color: colors.foreground, marginBottom: 4}}>
              Health Credit Plans
            </Text>
            <Text style={{fontSize: 12, color: colors.mutedForeground, marginBottom: 16}}>
              Purchase credits for AI-powered health report generation
            </Text>

            {plansLoading ? (
              <View style={{gap: 12}}>
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} height={140} borderRadius={20} />
                ))}
              </View>
            ) : plans.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 24,
                  alignItems: 'center',
                }}>
                <ShoppingCart size={28} color={colors.mutedForeground} />
                <Text style={{fontSize: 13, color: colors.mutedForeground, marginTop: 8}}>
                  No plans available at the moment
                </Text>
              </View>
            ) : (
              <View style={{gap: 12}}>
                {plans.map(plan => {
                  const price = getPlanPrice(plan);
                  const isUnlimited = plan.type !== 'bundle';
                  const isPopular = plan.sort_order === 1;

                  return (
                    <View
                      key={plan._id}
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: isPopular ? 2 : 1,
                        borderColor: isPopular ? colors.primary : colors.border,
                        borderRadius: 20,
                        padding: 20,
                        overflow: 'hidden',
                      }}>
                      {isPopular && (
                        <View
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            backgroundColor: colors.primary,
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            borderBottomLeftRadius: 12,
                          }}>
                          <Text style={{fontSize: 10, fontWeight: '700', color: colors.white}}>
                            POPULAR
                          </Text>
                        </View>
                      )}

                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12}}>
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: isUnlimited
                              ? `${colors.primary}15`
                              : `${colors.accent}15`,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          {isUnlimited ? (
                            <Crown size={20} color={colors.primary} />
                          ) : (
                            <Sparkles size={20} color={colors.accent} />
                          )}
                        </View>
                        <View style={{flex: 1}}>
                          <Text style={{fontSize: 16, fontWeight: '700', color: colors.foreground}}>
                            {plan.name}
                          </Text>
                          {plan.description ? (
                            <Text
                              style={{fontSize: 11, color: colors.mutedForeground, marginTop: 2}}
                              numberOfLines={2}>
                              {plan.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-end',
                          justifyContent: 'space-between',
                          marginBottom: 16,
                        }}>
                        <View>
                          <Text style={{fontSize: 11, color: colors.mutedForeground}}>
                            {isUnlimited ? 'Subscription' : 'One-time purchase'}
                          </Text>
                          <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 2}}>
                            <Text style={{fontSize: 24, fontWeight: '700', color: colors.foreground}}>
                              {formatCurrency(price, currency)}
                            </Text>
                            {isUnlimited && plan.duration_days ? (
                              <Text style={{fontSize: 12, color: colors.mutedForeground}}>
                                /{plan.duration_days === 30 ? 'mo' : 'yr'}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                        <View
                          style={{
                            backgroundColor: `${colors.accent}15`,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 12,
                          }}>
                          <Text style={{fontSize: 14, fontWeight: '700', color: colors.accent}}>
                            {isUnlimited ? 'Unlimited' : `${plan.credits} credits`}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedPlan(plan);
                          setShowPurchaseModal(true);
                        }}
                        style={{
                          backgroundColor: colors.primary,
                          borderRadius: 14,
                          paddingVertical: 14,
                          alignItems: 'center',
                        }}>
                        <Text style={{fontSize: 14, fontWeight: '700', color: colors.white}}>
                          Purchase
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
        </View>
      </ScrollView>

      {/* ═══════ PURCHASE CONFIRMATION MODAL ═══════ */}
      <Modal
        visible={showPurchaseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPurchaseModal(false)}>
        <Pressable
          style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'}}
          onPress={() => !purchasing && setShowPurchaseModal(false)}>
          <Pressable
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: 34,
            }}
            onPress={() => {}}>
            {/* Handle bar */}
            <View style={{alignItems: 'center', paddingTop: 12, paddingBottom: 8}}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                }}
              />
            </View>

            <View style={{padding: 24, gap: 20}}>
              {/* Title */}
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
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
                  <Text style={{fontSize: 18, fontWeight: '700', color: colors.foreground}}>
                    Purchase {selectedPlan?.name}
                  </Text>
                  <Text style={{fontSize: 12, color: colors.mutedForeground}}>
                    {selectedPlan?.type === 'bundle'
                      ? `${selectedPlan?.credits} credits`
                      : 'Unlimited access'}
                  </Text>
                </View>
              </View>

              {/* Summary */}
              <View
                style={{
                  backgroundColor: colors.muted,
                  borderRadius: 16,
                  padding: 16,
                  gap: 12,
                }}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                  <Text style={{fontSize: 13, color: colors.mutedForeground}}>Plan</Text>
                  <Text style={{fontSize: 13, fontWeight: '600', color: colors.foreground}}>
                    {selectedPlan?.name}
                  </Text>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                  <Text style={{fontSize: 13, color: colors.mutedForeground}}>Credits</Text>
                  <Text style={{fontSize: 13, fontWeight: '600', color: colors.foreground}}>
                    {selectedPlan?.type === 'bundle' ? selectedPlan?.credits : 'Unlimited'}
                  </Text>
                </View>
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingTop: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{fontSize: 14, fontWeight: '700', color: colors.foreground}}>
                    Total
                  </Text>
                  <Text style={{fontSize: 14, fontWeight: '700', color: colors.foreground}}>
                    {selectedPlan ? formatCurrency(getPlanPrice(selectedPlan), currency) : ''}
                  </Text>
                </View>
              </View>

              {/* Wallet balance */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text style={{fontSize: 13, color: colors.mutedForeground}}>
                  Wallet Balance
                </Text>
                <Text style={{fontSize: 14, fontWeight: '700', color: colors.foreground}}>
                  {formatCurrency(balance, currency)}
                </Text>
              </View>

              {/* Insufficient balance warning */}
              {selectedPlan && balance < getPlanPrice(selectedPlan) && (
                <View
                  style={{
                    backgroundColor: `${colors.destructive}15`,
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                  <Text style={{flex: 1, fontSize: 12, color: colors.destructive}}>
                    Insufficient wallet balance. Please fund your wallet first.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowPurchaseModal(false);
                      setActiveTab('wallet');
                    }}>
                    <Text style={{fontSize: 12, fontWeight: '700', color: colors.primary}}>
                      Add Funds
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Action buttons */}
              <View style={{flexDirection: 'row', gap: 12}}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowPurchaseModal(false);
                    setSelectedPlan(null);
                  }}
                  disabled={purchasing}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                  }}>
                  <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePurchase}
                  disabled={
                    purchasing ||
                    !selectedPlan ||
                    balance < (selectedPlan ? getPlanPrice(selectedPlan) : Infinity)
                  }
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor:
                      purchasing || !selectedPlan || balance < (selectedPlan ? getPlanPrice(selectedPlan) : Infinity)
                        ? `${colors.primary}50`
                        : colors.primary,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}>
                  {purchasing ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : null}
                  <Text style={{fontSize: 14, fontWeight: '700', color: colors.white}}>
                    {purchasing
                      ? 'Processing...'
                      : selectedPlan
                        ? `Pay ${formatCurrency(getPlanPrice(selectedPlan), currency)}`
                        : 'Pay'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ═══════ FUND WALLET MODAL ═══════ */}
      <Modal
        visible={showFundModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFundModal(false)}>
        <Pressable
          style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'}}
          onPress={() => !funding && setShowFundModal(false)}>
          <Pressable
            style={{backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34}}
            onPress={() => {}}>
            <View style={{alignItems: 'center', paddingTop: 12, paddingBottom: 8}}>
              <View style={{width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border}} />
            </View>
            <View style={{padding: 24, gap: 20}}>
              {/* Title */}
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                <View style={{width: 48, height: 48, borderRadius: 24, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center'}}>
                  <CreditCard size={24} color={colors.primary} />
                </View>
                <View>
                  <Text style={{fontSize: 18, fontWeight: '700', color: colors.foreground}}>Fund Wallet</Text>
                  <Text style={{fontSize: 12, color: colors.mutedForeground}}>Enter the amount you want to add</Text>
                </View>
              </View>

              {/* Amount Input */}
              <View style={{backgroundColor: colors.muted, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center'}}>
                <Text style={{fontSize: 24, fontWeight: '700', color: colors.mutedForeground, marginRight: 4}}>
                  {CURRENCY_SYMBOLS[currency] || currency}
                </Text>
                <TextInput
                  style={{flex: 1, fontSize: 24, fontWeight: '700', color: colors.foreground, padding: 0}}
                  placeholder="0.00"
                  placeholderTextColor={`${colors.mutedForeground}80`}
                  keyboardType="numeric"
                  value={fundAmount}
                  onChangeText={setFundAmount}
                />
              </View>

              {/* Quick Amounts */}
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                {QUICK_AMOUNTS.map(amt => {
                  const isActive = fundAmount === String(amt);
                  return (
                    <TouchableOpacity
                      key={amt}
                      activeOpacity={0.7}
                      onPress={() => setFundAmount(String(amt))}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isActive ? colors.primary : colors.border,
                        backgroundColor: isActive ? `${colors.primary}15` : 'transparent',
                      }}>
                      <Text style={{fontSize: 13, fontWeight: '600', color: isActive ? colors.primary : colors.foreground}}>
                        {formatCurrency(amt, currency)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{fontSize: 11, color: colors.mutedForeground}}>
                Minimum amount: {CURRENCY_SYMBOLS[currency] || currency}100
              </Text>

              {/* Actions */}
              <View style={{flexDirection: 'row', gap: 12}}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {setShowFundModal(false); setFundAmount('');}}
                  style={{flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center'}}>
                  <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleFundWallet}
                  disabled={!fundAmount || parseFloat(fundAmount) < 100 || funding}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: (!fundAmount || parseFloat(fundAmount) < 100) ? `${colors.primary}50` : colors.primary,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}>
                  {funding && <ActivityIndicator size="small" color={colors.white} />}
                  <Text style={{fontSize: 14, fontWeight: '700', color: colors.white}}>
                    {funding ? 'Processing...' : 'Continue to Payment'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ═══════ SHARE CREDITS MODAL ═══════ */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={closeShareModal}>
        <Pressable
          style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'}}
          onPress={closeShareModal}>
          <Pressable
            style={{backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34, maxHeight: '85%'}}
            onPress={() => {}}>
            <View style={{alignItems: 'center', paddingTop: 12, paddingBottom: 8}}>
              <View style={{width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border}} />
            </View>

            <ScrollView style={{maxHeight: 500}} contentContainerStyle={{padding: 24, gap: 20}} keyboardShouldPersistTaps="handled">
              {/* ── STEP 1: Search & Select ── */}
              {shareStep === 1 && (
                <>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <View style={{width: 48, height: 48, borderRadius: 24, backgroundColor: `${colors.accent}15`, alignItems: 'center', justifyContent: 'center'}}>
                      <Send size={24} color={colors.accent} />
                    </View>
                    <View>
                      <Text style={{fontSize: 18, fontWeight: '700', color: colors.foreground}}>Share AI Credits</Text>
                      <Text style={{fontSize: 12, color: colors.mutedForeground}}>Send credits to another patient</Text>
                    </View>
                  </View>

                  {/* Search Input */}
                  <View style={{backgroundColor: colors.muted, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 48}}>
                    <Search size={18} color={colors.mutedForeground} />
                    <TextInput
                      style={{flex: 1, fontSize: 14, color: colors.foreground, marginLeft: 10, padding: 0}}
                      placeholder="Search by name or email..."
                      placeholderTextColor={`${colors.mutedForeground}80`}
                      value={searchQuery}
                      onChangeText={handleRecipientSearch}
                      autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => {setSearchQuery(''); setSearchResults([]);}}>
                        <X size={18} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    )}
                    {searching && <ActivityIndicator size="small" color={colors.primary} style={{marginLeft: 8}} />}
                  </View>

                  {/* Search Results */}
                  {searchResults.map((patient: any) => {
                    const isSelected = selectedRecipient?.id === patient.id || selectedRecipient?._id === patient._id;
                    const initial = (patient.name || patient.email || '?')[0].toUpperCase();
                    return (
                      <TouchableOpacity
                        key={patient.id || patient._id}
                        activeOpacity={0.7}
                        onPress={() => setSelectedRecipient(isSelected ? null : patient)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          padding: 14,
                          borderRadius: 14,
                          borderWidth: 1.5,
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? `${colors.primary}10` : colors.card,
                        }}>
                        <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.accent}20`, alignItems: 'center', justifyContent: 'center'}}>
                          <Text style={{fontSize: 16, fontWeight: '700', color: colors.accent}}>{initial}</Text>
                        </View>
                        <View style={{flex: 1}}>
                          <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>{patient.name}</Text>
                          <Text style={{fontSize: 12, color: colors.mutedForeground}}>{patient.email}</Text>
                        </View>
                        {isSelected && <Check size={18} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}

                  {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                    <Text style={{fontSize: 13, color: colors.mutedForeground, textAlign: 'center', paddingVertical: 12}}>No patients found</Text>
                  )}

                  {/* Amount Stepper (only when recipient selected) */}
                  {selectedRecipient && (
                    <View style={{gap: 8}}>
                      <Text style={{fontSize: 13, fontWeight: '600', color: colors.foreground}}>Credits to Send</Text>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                        <TouchableOpacity
                          onPress={() => setCreditsToSend(Math.max(sharingSettings?.min_amount || 1, creditsToSend - 1))}
                          style={{width: 40, height: 40, borderRadius: 12, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center'}}>
                          <Minus size={18} color={colors.foreground} />
                        </TouchableOpacity>
                        <View style={{flex: 1, backgroundColor: colors.muted, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center'}}>
                          <Text style={{fontSize: 24, fontWeight: '700', color: colors.foreground}}>{creditsToSend}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => setCreditsToSend(Math.min(maxTransfer, creditsToSend + 1))}
                          style={{width: 40, height: 40, borderRadius: 12, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center'}}>
                          <Plus size={18} color={colors.foreground} />
                        </TouchableOpacity>
                      </View>
                      <Text style={{fontSize: 11, color: colors.mutedForeground}}>
                        Available: {purchasedCredits} purchased credits (max {maxTransfer} per transfer)
                      </Text>
                    </View>
                  )}

                  {/* Actions */}
                  <View style={{flexDirection: 'row', gap: 12}}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={closeShareModal}
                      style={{flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center'}}>
                      <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShareStep(2)}
                      disabled={!selectedRecipient || creditsToSend < (sharingSettings?.min_amount || 1) || creditsToSend > maxTransfer}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 14,
                        backgroundColor: !selectedRecipient ? `${colors.primary}50` : colors.primary,
                        alignItems: 'center',
                      }}>
                      <Text style={{fontSize: 14, fontWeight: '700', color: colors.white}}>Continue</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* ── STEP 2: Confirmation ── */}
              {shareStep === 2 && (
                <>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <View style={{width: 48, height: 48, borderRadius: 24, backgroundColor: `${colors.accent}15`, alignItems: 'center', justifyContent: 'center'}}>
                      <Send size={24} color={colors.accent} />
                    </View>
                    <View>
                      <Text style={{fontSize: 18, fontWeight: '700', color: colors.foreground}}>Confirm Transfer</Text>
                      <Text style={{fontSize: 12, color: colors.mutedForeground}}>Review your credit transfer</Text>
                    </View>
                  </View>

                  {/* Transfer summary */}
                  <View style={{alignItems: 'center', paddingVertical: 12}}>
                    <Text style={{fontSize: 13, color: colors.mutedForeground}}>You're about to send</Text>
                    <Text style={{fontSize: 40, fontWeight: '700', color: colors.accent, marginVertical: 4}}>{creditsToSend}</Text>
                    <Text style={{fontSize: 15, fontWeight: '600', color: colors.foreground}}>AI Credits to {selectedRecipient?.name}</Text>
                  </View>

                  {/* Balance breakdown */}
                  <View style={{backgroundColor: colors.muted, borderRadius: 16, padding: 16, gap: 12}}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                      <Text style={{fontSize: 13, color: colors.mutedForeground}}>Your Balance</Text>
                      <Text style={{fontSize: 13, fontWeight: '600', color: colors.foreground}}>{purchasedCredits} credits</Text>
                    </View>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                      <Text style={{fontSize: 13, color: colors.destructive}}>Credits to Send</Text>
                      <Text style={{fontSize: 13, fontWeight: '600', color: colors.destructive}}>-{creditsToSend} credits</Text>
                    </View>
                    <View style={{borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between'}}>
                      <Text style={{fontSize: 14, fontWeight: '700', color: colors.foreground}}>Remaining</Text>
                      <Text style={{fontSize: 14, fontWeight: '700', color: colors.foreground}}>{purchasedCredits - creditsToSend} credits</Text>
                    </View>
                  </View>

                  {/* Warning */}
                  <View style={{backgroundColor: `${colors.destructive}15`, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <AlertTriangle size={18} color={colors.destructive} />
                    <Text style={{flex: 1, fontSize: 12, color: colors.destructive}}>This action cannot be undone.</Text>
                  </View>

                  {/* Actions */}
                  <View style={{flexDirection: 'row', gap: 12}}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShareStep(1)}
                      disabled={transferring}
                      style={{flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center'}}>
                      <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleTransfer}
                      disabled={transferring}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 14,
                        backgroundColor: transferring ? `${colors.primary}50` : colors.primary,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 8,
                      }}>
                      {transferring && <ActivityIndicator size="small" color={colors.white} />}
                      <Text style={{fontSize: 14, fontWeight: '700', color: colors.white}}>
                        {transferring ? 'Sending...' : 'Confirm & Send'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* ── STEP 3: Success ── */}
              {shareStep === 3 && (
                <View style={{alignItems: 'center', paddingVertical: 20, gap: 16}}>
                  <View style={{width: 72, height: 72, borderRadius: 36, backgroundColor: `${colors.success}15`, alignItems: 'center', justifyContent: 'center'}}>
                    <Check size={36} color={colors.success} />
                  </View>
                  <Text style={{fontSize: 20, fontWeight: '700', color: colors.foreground}}>Transfer Successful</Text>
                  <Text style={{fontSize: 14, color: colors.mutedForeground, textAlign: 'center'}}>
                    {creditsToSend} credit{creditsToSend !== 1 ? 's' : ''} sent to {selectedRecipient?.name}
                  </Text>
                  <Text style={{fontSize: 12, color: colors.mutedForeground, textAlign: 'center'}}>
                    Both you and the recipient will receive email confirmations.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={closeShareModal}
                    style={{
                      marginTop: 8,
                      width: '100%',
                      paddingVertical: 14,
                      borderRadius: 14,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                    }}>
                    <Text style={{fontSize: 14, fontWeight: '700', color: colors.white}}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ═══════ PAYSTACK WEBVIEW MODAL ═══════ */}
      <Modal
        visible={!!paystackUrl}
        animationType="slide"
        onRequestClose={handleClosePaystack}>
        <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}>
            <TouchableOpacity onPress={handleClosePaystack} style={{padding: 4}}>
              <X size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '700',
                color: colors.foreground,
              }}>
              Complete Payment
            </Text>
            <View style={{width: 32}} />
          </View>
          {paystackUrl && (
            <WebView
              source={{uri: paystackUrl}}
              onNavigationStateChange={handlePaystackNavigation}
              style={{flex: 1}}
              startInLoadingState
              renderLoading={() => (
                <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background}}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{marginTop: 12, fontSize: 14, color: colors.mutedForeground}}>Loading payment page...</Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function CreditBreakdownRow({
  label,
  value,
  dotColor,
}: {
  label: string;
  value: string;
  dotColor: string;
}) {
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
        <View
          style={{width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor}}
        />
        <Text style={{fontSize: 13, color: colors.mutedForeground}}>{label}</Text>
      </View>
      <Text style={{fontSize: 14, fontWeight: '700', color: colors.foreground}}>{value}</Text>
    </View>
  );
}

function CreditTransactionItem({tx}: {tx: any}) {
  const display = getCreditTxnDisplay(tx.type);
  const isPositive = tx.credits_delta > 0;
  const date = tx.created_at;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 14,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: `${display.color}15`,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {display.icon}
      </View>
      <View style={{flex: 1}}>
        <Text
          style={{fontSize: 13, fontWeight: '500', color: colors.foreground}}
          numberOfLines={1}>
          {tx.description || display.label}
        </Text>
        {date ? (
          <Text style={{fontSize: 11, color: colors.mutedForeground, marginTop: 2}}>
            {formatDate(date)}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: isPositive ? colors.success : colors.destructive,
        }}>
        {isPositive ? '+' : ''}
        {tx.credits_delta}
      </Text>
    </View>
  );
}

function getCreditTxnDisplay(type: string): {
  icon: React.ReactNode;
  color: string;
  label: string;
} {
  switch (type) {
    case 'free_usage':
      return {icon: <Zap size={18} color={colors.destructive} />, color: colors.destructive, label: 'Free credit used'};
    case 'purchased_usage':
      return {icon: <Zap size={18} color={colors.destructive} />, color: colors.destructive, label: 'Purchased credit used'};
    case 'gifted_usage':
      return {icon: <Zap size={18} color={colors.destructive} />, color: colors.destructive, label: 'Gifted credit used'};
    case 'unlimited_usage':
      return {icon: <Zap size={18} color={colors.accent} />, color: colors.accent, label: 'Unlimited usage'};
    case 'bundle_purchase':
      return {icon: <ShoppingCart size={18} color={colors.success} />, color: colors.success, label: 'Credits purchased'};
    case 'unlimited_purchase':
      return {icon: <Crown size={18} color={colors.success} />, color: colors.success, label: 'Subscription purchased'};
    case 'admin_gift':
    case 'admin_gift_unlimited':
      return {icon: <Gift size={18} color={colors.success} />, color: colors.success, label: 'Admin gifted credits'};
    case 'monthly_reset':
      return {icon: <Sparkles size={18} color={colors.primary} />, color: colors.primary, label: 'Monthly free credits reset'};
    case 'credit_transfer_sent':
      return {icon: <ArrowUpRight size={18} color={colors.destructive} />, color: colors.destructive, label: 'Credits sent'};
    case 'credit_transfer_received':
      return {icon: <ArrowDownLeft size={18} color={colors.success} />, color: colors.success, label: 'Credits received'};
    default:
      return {icon: <Sparkles size={18} color={colors.mutedForeground} />, color: colors.mutedForeground, label: type};
  }
}
