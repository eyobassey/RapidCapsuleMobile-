import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
} from 'lucide-react-native';

import {useWalletStore} from '../../store/wallet';
import {Header, Button, EmptyState, Skeleton} from '../../components/ui';
import {colors} from '../../theme/colors';
import {formatCurrency, formatDate, formatDateTime} from '../../utils/formatters';

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  const {
    balance,
    currency,
    transactions,
    isLoading,
    fetchBalance,
    fetchTransactions,
  } = useWalletStore();

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, [fetchBalance, fetchTransactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([fetchBalance(), fetchTransactions()]);
    setRefreshing(false);
  }, [fetchBalance, fetchTransactions]);

  // Compute quick stats
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

  // Loading skeleton
  if (isLoading && transactions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Wallet" onBack={() => navigation.goBack()} />
        <ScrollView className="flex-1 px-5 pt-4">
          <Skeleton height={160} borderRadius={24} className="mb-4" />
          <View className="flex-row gap-3 mb-6">
            <Skeleton height={70} borderRadius={16} className="flex-1" />
            <Skeleton height={70} borderRadius={16} className="flex-1" />
          </View>
          <Skeleton width={160} height={16} className="mb-3" />
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} className="flex-row items-center gap-3 mb-3">
              <Skeleton width={44} height={44} borderRadius={22} />
              <View className="flex-1">
                <Skeleton width={150} height={14} className="mb-2" />
                <Skeleton width={80} height={12} />
              </View>
              <Skeleton width={70} height={16} />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Wallet" onBack={() => navigation.goBack()} />

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
        {/* Balance Card */}
        <View className="mx-5 mt-4 bg-primary/10 border border-primary/20 rounded-3xl p-6 overflow-hidden relative">
          {/* Decorative orbs */}
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
              onPress={() => {
                // Placeholder for fund wallet flow
              }}>
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
                    {/* Icon */}
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

                    {/* Details */}
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                        {tx.description || tx.narration || (credit ? 'Wallet Credit' : 'Payment')}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        {tx.created_at ? formatDateTime(tx.created_at) : tx.date ? formatDate(tx.date) : ''}
                      </Text>
                    </View>

                    {/* Amount */}
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
      </ScrollView>
    </SafeAreaView>
  );
}
