import {create} from 'zustand';
import {walletService} from '../services/wallet.service';

interface WalletState {
  balance: number;
  currency: string;
  transactions: any[];
  isLoading: boolean;
  error: string | null;

  fetchBalance: () => Promise<void>;
  fetchTransactions: (params?: {page?: number; limit?: number; type?: string}) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  currency: 'NGN',
  transactions: [],
  isLoading: false,
  error: null,

  fetchBalance: async () => {
    set({isLoading: true, error: null});
    try {
      const data = await walletService.getBalance();
      set({
        balance: data?.currentBalance ?? data?.balance ?? 0,
        currency: data?.currency || 'NGN',
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch balance',
        isLoading: false,
      });
    }
  },

  fetchTransactions: async (params?: {page?: number; limit?: number; type?: string}) => {
    set({isLoading: true, error: null});
    try {
      const data = await walletService.getTransactions(params);
      const txList = Array.isArray(data) ? data : data?.data || data?.transactions || [];
      set({transactions: Array.isArray(txList) ? txList : [], isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch transactions',
        isLoading: false,
      });
    }
  },
}));
