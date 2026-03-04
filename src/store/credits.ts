import {create} from 'zustand';
import {creditsService} from '../services/credits.service';
import {useWalletStore} from './wallet';

export interface CreditPlan {
  _id: string;
  name: string;
  type: 'bundle' | 'unlimited_monthly' | 'unlimited_yearly';
  credits: number | null;
  price: number;
  prices: Record<string, {price: number}>;
  currency: string;
  duration_days: number | null;
  is_active: boolean;
  sort_order: number;
  description: string;
}

export interface CreditTransaction {
  _id: string;
  type: string;
  credits_delta: number;
  amount: number | null;
  currency: string;
  plan_name: string | null;
  description: string;
  credit_snapshot: {
    free_credits: number;
    purchased_credits: number;
    gifted_credits: number;
    has_unlimited: boolean;
  };
  created_at: string;
}

interface CreditsState {
  freeCredits: number;
  purchasedCredits: number;
  giftedCredits: number;
  totalAvailable: number;
  hasUnlimited: boolean;
  totalGenerated: number;

  plans: CreditPlan[];
  plansLoading: boolean;

  transactions: CreditTransaction[];
  transactionsLoading: boolean;

  isLoading: boolean;
  error: string | null;

  purchasing: boolean;
  purchaseError: string | null;

  sharingSettings: {enabled: boolean; min_amount: number; max_amount: number} | null;
  transferring: boolean;
  transferError: string | null;

  fetchCredits: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  fetchTransactions: (params?: {page?: number; limit?: number}) => Promise<void>;
  purchasePlan: (planId: string) => Promise<boolean>;
  fetchSharingSettings: () => Promise<void>;
  transferCredits: (recipientId: string, credits: number) => Promise<{success: boolean; sender_remaining?: number; message?: string}>;
}

export const useCreditsStore = create<CreditsState>((set, get) => ({
  freeCredits: 0,
  purchasedCredits: 0,
  giftedCredits: 0,
  totalAvailable: 0,
  hasUnlimited: false,
  totalGenerated: 0,

  plans: [],
  plansLoading: false,

  transactions: [],
  transactionsLoading: false,

  isLoading: false,
  error: null,

  purchasing: false,
  purchaseError: null,

  sharingSettings: null,
  transferring: false,
  transferError: null,

  fetchCredits: async () => {
    set({isLoading: true, error: null});
    try {
      const data = await creditsService.getCredits();
      set({
        freeCredits: data?.free_credits_remaining ?? 0,
        purchasedCredits: data?.purchased_credits ?? 0,
        giftedCredits: data?.gifted_credits ?? 0,
        totalAvailable: data?.total_available ?? 0,
        hasUnlimited: data?.has_unlimited_subscription ?? false,
        totalGenerated: data?.total_summaries_generated ?? 0,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch credits',
        isLoading: false,
      });
    }
  },

  fetchPlans: async () => {
    set({plansLoading: true});
    try {
      const data = await creditsService.getPlans();
      const plans = Array.isArray(data) ? data : data?.plans || [];
      // Sort by type (bundles first) then price
      plans.sort((a: CreditPlan, b: CreditPlan) => {
        if (a.type === 'bundle' && b.type !== 'bundle') return -1;
        if (a.type !== 'bundle' && b.type === 'bundle') return 1;
        return (a.sort_order || 0) - (b.sort_order || 0) || a.price - b.price;
      });
      set({plans, plansLoading: false});
    } catch {
      set({plansLoading: false});
    }
  },

  fetchTransactions: async (params) => {
    set({transactionsLoading: true});
    try {
      const data = await creditsService.getTransactions(params || {limit: 50});
      const txList = Array.isArray(data)
        ? data
        : data?.transactions || data?.data || [];
      set({transactions: txList, transactionsLoading: false});
    } catch {
      set({transactionsLoading: false});
    }
  },

  purchasePlan: async (planId: string) => {
    set({purchasing: true, purchaseError: null});
    try {
      await creditsService.purchasePlan(planId);
      await get().fetchCredits();
      await useWalletStore.getState().fetchBalance();
      set({purchasing: false});
      return true;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Purchase failed';
      set({purchasing: false, purchaseError: msg});
      return false;
    }
  },

  fetchSharingSettings: async () => {
    try {
      const data = await creditsService.getSharingSettings();
      set({sharingSettings: data});
    } catch {
      // Settings fetch failed — sharing will be hidden
    }
  },

  transferCredits: async (recipientId: string, credits: number) => {
    set({transferring: true, transferError: null});
    try {
      const data = await creditsService.transferCredits(recipientId, credits);
      await get().fetchCredits();
      await get().fetchTransactions();
      set({transferring: false});
      return {success: true, sender_remaining: data?.sender_remaining, message: data?.message};
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Transfer failed';
      set({transferring: false, transferError: msg});
      return {success: false, message: msg};
    }
  },
}));
