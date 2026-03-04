import {create} from 'zustand';
import {walletService} from '../services/wallet.service';

interface WalletState {
  balance: number;
  currency: string;
  transactions: any[];
  isLoading: boolean;
  error: string | null;

  funding: boolean;
  fundingError: string | null;

  fetchBalance: () => Promise<void>;
  fetchTransactions: (params?: {page?: number; limit?: number; type?: string}) => Promise<void>;
  fundWallet: (amount: number) => Promise<{authorization_url: string; reference: string} | null>;
  verifyFunding: (reference: string) => Promise<boolean>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: 0,
  currency: 'NGN',
  transactions: [],
  isLoading: false,
  error: null,

  funding: false,
  fundingError: null,

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

  fundWallet: async (amount: number) => {
    set({funding: true, fundingError: null});
    try {
      const data = await walletService.fund({amount});
      set({funding: false});
      if (data?.authorization_url) {
        return {authorization_url: data.authorization_url, reference: data.reference};
      }
      // If no authorization_url, payment may have been processed directly
      await get().fetchBalance();
      await get().fetchTransactions();
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to initialize payment';
      set({funding: false, fundingError: msg});
      return null;
    }
  },

  verifyFunding: async (reference: string) => {
    try {
      await walletService.verifyFunding(reference);
      await get().fetchBalance();
      await get().fetchTransactions();
      return true;
    } catch {
      return false;
    }
  },
}));
