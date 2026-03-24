import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../../services/wallet.service';

// ── Query key factory ──────────────────────────────────────
export const walletKeys = {
  all: ['wallet'] as const,
  balance: () => [...walletKeys.all, 'balance'] as const,
  transactions: () => [...walletKeys.all, 'transactions'] as const,
  transactionPage: (page: number) => [...walletKeys.transactions(), page] as const,
};

// ── Queries ────────────────────────────────────────────────

export function useWalletBalanceQuery() {
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: () => walletService.getBalance(),
  });
}

export function useTransactionsQuery(page: number = 1) {
  return useQuery({
    queryKey: walletKeys.transactionPage(page),
    queryFn: async () => {
      const data = await walletService.getTransactions({ page });
      const txList = Array.isArray(data) ? data : data?.data || data?.transactions || [];
      return Array.isArray(txList) ? txList : [];
    },
  });
}

// ── Mutations ──────────────────────────────────────────────

export function useFundWalletMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => walletService.fund({ amount }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}
