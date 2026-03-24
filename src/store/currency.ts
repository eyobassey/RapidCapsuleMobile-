import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import api from '../services/api';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '../utils/currency';
import { useAuthStore } from './auth';

// ── MMKV Persistence ──

const CURRENCY_KEY = 'rc_currency';

let mmkv: ReturnType<typeof createMMKV>;
function getStore() {
  if (!mmkv) {
    mmkv = createMMKV({ id: 'rc-storage' });
  }
  return mmkv;
}

// ── Store ──

interface CurrencyState {
  currencyCode: string;
  initialized: boolean;
  initCurrency: () => Promise<void>;
  setCurrency: (code: string) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set, _get) => ({
  currencyCode: DEFAULT_CURRENCY,
  initialized: false,

  initCurrency: async () => {
    // 1. Check MMKV (local persistence)
    const stored = getStore().getString(CURRENCY_KEY);
    if (stored && SUPPORTED_CURRENCIES[stored]) {
      set({ currencyCode: stored, initialized: true });
      return;
    }

    // 2. Check user profile
    const user = useAuthStore.getState().user;
    const preferred = (user as any)?.preferred_currency;
    if (preferred && SUPPORTED_CURRENCIES[preferred]) {
      getStore().set(CURRENCY_KEY, preferred);
      set({ currencyCode: preferred, initialized: true });
      return;
    }

    // 3. IP-based detection
    try {
      const res = await api.get('/users/detect-currency');
      const detected = res.data?.data?.currency || res.data?.currency;
      if (detected && SUPPORTED_CURRENCIES[detected]) {
        getStore().set(CURRENCY_KEY, detected);
        set({ currencyCode: detected, initialized: true });
        return;
      }
    } catch {
      // Silent fallback
    }

    // 4. Default
    getStore().set(CURRENCY_KEY, DEFAULT_CURRENCY);
    set({ currencyCode: DEFAULT_CURRENCY, initialized: true });
  },

  setCurrency: async (code: string) => {
    if (!SUPPORTED_CURRENCIES[code]) return;

    set({ currencyCode: code });
    getStore().set(CURRENCY_KEY, code);

    // Persist to user profile if authenticated (fire-and-forget)
    const user = useAuthStore.getState().user;
    if (user?._id) {
      try {
        await api.patch(`/users/${user._id}`, { preferred_currency: code });
      } catch {
        // Non-critical
      }
    }
  },
}));
