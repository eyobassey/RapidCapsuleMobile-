import {create} from 'zustand';
import {createMMKV} from 'react-native-mmkv';
import {pharmacyService} from '../services/pharmacy.service';
import type {
  Drug,
  DrugCategory,
  CartItem,
  PharmacyOrder,
  DeliveryAddress,
  DrugSearchParams,
} from '../types/pharmacy.types';
import {getDrugPrice, getDrugImage} from '../types/pharmacy.types';

// ── MMKV Cart Persistence ──

const CART_KEY = 'pharmacyCart';
const RECENT_SEARCHES_KEY = 'pharmacyRecentSearches';

let mmkv: ReturnType<typeof createMMKV>;
function getStore() {
  if (!mmkv) {
    mmkv = createMMKV({id: 'rc-storage'});
  }
  return mmkv;
}

function loadCart(): CartItem[] {
  try {
    const raw = getStore().getString(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  getStore().set(CART_KEY, JSON.stringify(items));
}

function loadRecentSearches(): string[] {
  try {
    const raw = getStore().getString(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]) {
  getStore().set(RECENT_SEARCHES_KEY, JSON.stringify(searches));
}

// ── Store ──

interface PharmacyState {
  // Catalog
  categories: DrugCategory[];
  featuredDrugs: Drug[];
  searchResults: Drug[];
  searchTotal: number;
  categoryDrugs: Drug[];
  categoryDrugsTotal: number;
  currentDrug: Drug | null;
  similarDrugs: Drug[];
  catalogLoading: boolean;

  // Cart
  cartItems: CartItem[];
  cartCount: number;

  // Orders
  myOrders: PharmacyOrder[];
  ordersTotal: number;
  currentOrder: PharmacyOrder | null;
  trackingOrder: PharmacyOrder | null;
  ordersLoading: boolean;

  // Addresses
  addresses: DeliveryAddress[];
  addressesLoading: boolean;

  // Search
  recentSearches: string[];

  // ── Catalog Actions ──
  fetchCategories: () => Promise<void>;
  fetchFeaturedDrugs: () => Promise<void>;
  searchDrugs: (params: DrugSearchParams) => Promise<void>;
  fetchDrugsByCategory: (categoryId: string, params?: {page?: number; limit?: number}) => Promise<void>;
  fetchDrugById: (id: string) => Promise<void>;
  fetchSimilarDrugs: (id: string) => Promise<void>;
  clearSearch: () => void;

  // ── Cart Actions ──
  addToCart: (drug: Drug) => void;
  removeFromCart: (drugId: string) => void;
  updateQuantity: (drugId: string, quantity: number) => void;
  clearCart: () => void;

  // ── Order Actions ──
  fetchMyOrders: (params?: {status?: string; page?: number; limit?: number}) => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  cancelOrder: (id: string, reason: string) => Promise<void>;
  rateOrder: (id: string, rating: number, review?: string) => Promise<void>;
  createOtcOrder: (payload: any) => Promise<PharmacyOrder>;
  trackOrder: (orderNumber: string) => Promise<void>;

  // ── Address Actions ──
  fetchAddresses: () => Promise<void>;
  addAddress: (payload: any) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;

  // ── Search History ──
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const usePharmacyStore = create<PharmacyState>((set, get) => ({
  // Initial state
  categories: [],
  featuredDrugs: [],
  searchResults: [],
  searchTotal: 0,
  categoryDrugs: [],
  categoryDrugsTotal: 0,
  currentDrug: null,
  similarDrugs: [],
  catalogLoading: false,

  cartItems: loadCart(),
  cartCount: loadCart().length,

  myOrders: [],
  ordersTotal: 0,
  currentOrder: null,
  trackingOrder: null,
  ordersLoading: false,

  addresses: [],
  addressesLoading: false,

  recentSearches: loadRecentSearches(),

  // ── Catalog Actions ──

  fetchCategories: async () => {
    set({catalogLoading: true});
    try {
      const data = await pharmacyService.getCategories();
      set({categories: Array.isArray(data) ? data : [], catalogLoading: false});
    } catch {
      set({catalogLoading: false});
    }
  },

  fetchFeaturedDrugs: async () => {
    set({catalogLoading: true});
    try {
      const data = await pharmacyService.getFeaturedDrugs();
      set({featuredDrugs: Array.isArray(data) ? data : [], catalogLoading: false});
    } catch {
      set({catalogLoading: false});
    }
  },

  searchDrugs: async (params: DrugSearchParams) => {
    set({catalogLoading: true});
    try {
      const data = await pharmacyService.searchDrugs(params);
      // API may return { drugs: [...], total } or just an array
      if (data && data.drugs) {
        set({searchResults: data.drugs, searchTotal: data.total || data.drugs.length, catalogLoading: false});
      } else {
        set({searchResults: Array.isArray(data) ? data : [], searchTotal: 0, catalogLoading: false});
      }
    } catch {
      set({catalogLoading: false});
    }
  },

  fetchDrugsByCategory: async (categoryId, params) => {
    set({catalogLoading: true});
    try {
      // Use search endpoint with category filter (the /category/{id} endpoint returns empty)
      const data = await pharmacyService.searchDrugs({
        category: categoryId,
        page: params?.page,
        limit: params?.limit || 20,
      });
      if (data && data.drugs) {
        set({categoryDrugs: data.drugs, categoryDrugsTotal: data.total || data.drugs.length, catalogLoading: false});
      } else {
        set({categoryDrugs: Array.isArray(data) ? data : [], categoryDrugsTotal: 0, catalogLoading: false});
      }
    } catch {
      set({catalogLoading: false});
    }
  },

  fetchDrugById: async (id) => {
    set({catalogLoading: true, currentDrug: null});
    try {
      const data = await pharmacyService.getDrugById(id);
      set({currentDrug: data, catalogLoading: false});
    } catch {
      set({catalogLoading: false});
    }
  },

  fetchSimilarDrugs: async (id) => {
    try {
      const data = await pharmacyService.getSimilarDrugs(id);
      set({similarDrugs: Array.isArray(data) ? data : []});
    } catch {
      // silent
    }
  },

  clearSearch: () => set({searchResults: [], searchTotal: 0}),

  // ── Cart Actions ──

  addToCart: (drug: Drug) => {
    const items = [...get().cartItems];
    const idx = items.findIndex(i => i.drugId === drug._id);
    const maxQty = drug.max_quantity_per_order || 10;

    if (idx >= 0) {
      if (items[idx].quantity < maxQty) {
        items[idx] = {...items[idx], quantity: items[idx].quantity + 1};
      }
    } else {
      const dosageForm = typeof drug.dosage_form === 'object' ? drug.dosage_form?.name : drug.dosage_form;
      items.push({
        drugId: drug._id,
        name: drug.name,
        genericName: drug.generic_name || '',
        strength: drug.strength,
        dosageForm: dosageForm || '',
        manufacturer: drug.manufacturer || '',
        price: getDrugPrice(drug),
        quantity: 1,
        imageUrl: getDrugImage(drug),
        requiresPrescription: drug.requires_prescription,
        maxQuantityPerOrder: maxQty,
      });
    }

    saveCart(items);
    set({cartItems: items, cartCount: items.length});
  },

  removeFromCart: (drugId: string) => {
    const items = get().cartItems.filter(i => i.drugId !== drugId);
    saveCart(items);
    set({cartItems: items, cartCount: items.length});
  },

  updateQuantity: (drugId: string, quantity: number) => {
    const items = get().cartItems.map(i => {
      if (i.drugId === drugId) {
        const q = Math.max(1, Math.min(quantity, i.maxQuantityPerOrder));
        return {...i, quantity: q};
      }
      return i;
    });
    saveCart(items);
    set({cartItems: items});
  },

  clearCart: () => {
    saveCart([]);
    set({cartItems: [], cartCount: 0});
  },

  // ── Order Actions ──

  fetchMyOrders: async (params) => {
    set({ordersLoading: true});
    try {
      const data = await pharmacyService.getMyOrders(params);
      if (data && data.orders) {
        set({myOrders: data.orders, ordersTotal: data.total || data.orders.length, ordersLoading: false});
      } else {
        set({myOrders: Array.isArray(data) ? data : [], ordersTotal: 0, ordersLoading: false});
      }
    } catch {
      set({ordersLoading: false});
    }
  },

  fetchOrderById: async (id) => {
    set({ordersLoading: true, currentOrder: null});
    try {
      const data = await pharmacyService.getOrderById(id);
      set({currentOrder: data, ordersLoading: false});
    } catch {
      set({ordersLoading: false});
    }
  },

  cancelOrder: async (id, reason) => {
    await pharmacyService.cancelOrder(id, reason);
    // Re-fetch order to get updated status
    const data = await pharmacyService.getOrderById(id);
    set({currentOrder: data});
  },

  rateOrder: async (id, rating, review) => {
    await pharmacyService.rateOrder(id, {rating, review});
    const data = await pharmacyService.getOrderById(id);
    set({currentOrder: data});
  },

  createOtcOrder: async (payload) => {
    const data = await pharmacyService.createOtcOrder(payload);
    return data;
  },

  trackOrder: async (orderNumber) => {
    set({ordersLoading: true, trackingOrder: null});
    try {
      const data = await pharmacyService.trackOrder(orderNumber);
      set({trackingOrder: data, ordersLoading: false});
    } catch {
      set({ordersLoading: false});
    }
  },

  // ── Address Actions ──

  fetchAddresses: async () => {
    set({addressesLoading: true});
    try {
      const data = await pharmacyService.getMyAddresses();
      // API returns { addresses: [...] } or a flat array
      const list = Array.isArray(data) ? data : data?.addresses || [];
      set({addresses: Array.isArray(list) ? list : [], addressesLoading: false});
    } catch {
      set({addressesLoading: false});
    }
  },

  addAddress: async (payload) => {
    await pharmacyService.addAddress(payload);
    const data = await pharmacyService.getMyAddresses();
    const list = Array.isArray(data) ? data : data?.addresses || [];
    set({addresses: Array.isArray(list) ? list : []});
  },

  setDefaultAddress: async (id) => {
    await pharmacyService.setDefaultAddress(id);
    const data = await pharmacyService.getMyAddresses();
    const list = Array.isArray(data) ? data : data?.addresses || [];
    set({addresses: Array.isArray(list) ? list : []});
  },

  // ── Search History ──

  addRecentSearch: (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const searches = [trimmed, ...get().recentSearches.filter(s => s !== trimmed)].slice(0, 10);
    saveRecentSearches(searches);
    set({recentSearches: searches});
  },

  clearRecentSearches: () => {
    saveRecentSearches([]);
    set({recentSearches: []});
  },
}));
