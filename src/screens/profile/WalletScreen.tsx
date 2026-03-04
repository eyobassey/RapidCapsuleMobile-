import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
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
  Infinity,
} from 'lucide-react-native';

import {useWalletStore} from '../../store/wallet';
import {useCreditsStore, type CreditPlan} from '../../store/credits';
import {Header, Button, Skeleton, TabBar} from '../../components/ui';
import {colors} from '../../theme/colors';
import {formatCurrency, formatDate, formatDateTime} from '../../utils/formatters';

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'wallet');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CreditPlan | null>(null);

  const {
    balance,
    currency,
    transactions,
    isLoading: walletLoading,
    fetchBalance,
    fetchTransactions,
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
    fetchCredits,
    fetchPlans,
    fetchTransactions: fetchCreditTransactions,
    purchasePlan,
  } = useCreditsStore();

  const tabs = [
    {label: 'Wallet', value: 'wallet'},
    {label: 'AI Credits', value: 'credits'},
    {label: 'Plans', value: 'plans'},
  ];

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    fetchCredits();
    fetchPlans();
    fetchCreditTransactions();
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
      fetchTransactions(),
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
      if (tx.type === 'credit' || tx.type === 'fund' || tx.type === 'deposit') {
        totalFunded += amount;
      } else {
        totalSpent += amount;
      }
    }
    return {totalSpent, totalFunded};
  }, [transactions]);

  const isCredit = (tx: any) =>
    tx.type === 'credit' || tx.type === 'fund' || tx.type === 'deposit';

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
        className="flex-1"
        contentContainerClassName="pb-12"
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
        {activeTab === 'wallet' && (
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
                  onPress={() => {}}>
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
        )}

        {/* ═══════ AI CREDITS TAB ═══════ */}
        {activeTab === 'credits' && (
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
        )}

        {/* ═══════ PLANS TAB ═══════ */}
        {activeTab === 'plans' && (
          <View style={{paddingHorizontal: 20, paddingTop: 16}}>
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
        )}
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
