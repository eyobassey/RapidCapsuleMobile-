jest.mock('../../services/pharmacy.service', () => ({
  pharmacyService: {
    getCategories: jest.fn(),
    getFeaturedDrugs: jest.fn(),
    searchDrugs: jest.fn(),
    getDrugById: jest.fn(),
    getSimilarDrugs: jest.fn(),
    getMyOrders: jest.fn(),
    getOrderById: jest.fn(),
    cancelOrder: jest.fn(),
    rateOrder: jest.fn(),
    createOtcOrder: jest.fn(),
    trackOrder: jest.fn(),
    getMyAddresses: jest.fn(),
    addAddress: jest.fn(),
    setDefaultAddress: jest.fn(),
  },
}));

// Mock MMKV persistence so loadCart/saveCart work with the global mock
jest.mock('react-native-mmkv', () => {
  const stores = new Map<string, Map<string, string>>();
  return {
    createMMKV: jest.fn(({ id }: { id: string }) => {
      if (!stores.has(id)) {
        stores.set(id, new Map());
      }
      const s = stores.get(id)!;
      return {
        getString: jest.fn((key: string) => s.get(key)),
        set: jest.fn((key: string, value: string) => s.set(key, value)),
        remove: jest.fn((key: string) => s.delete(key)),
        delete: jest.fn((key: string) => s.delete(key)),
        clearAll: jest.fn(() => s.clear()),
      };
    }),
  };
});

import { usePharmacyStore } from '../pharmacy';
import { pharmacyService } from '../../services/pharmacy.service';

const svc = pharmacyService as jest.Mocked<typeof pharmacyService>;

function makeDrug(overrides: Record<string, any> = {}) {
  return {
    _id: overrides._id || 'drug-1',
    name: overrides.name || 'Paracetamol',
    strength: '500mg',
    requires_prescription: false,
    max_quantity_per_order: 10,
    selling_price: 500,
    ...overrides,
  };
}

describe('usePharmacyStore', () => {
  beforeEach(() => {
    // Reset store to clean state (cart is empty since MMKV is fresh per test module)
    usePharmacyStore.setState({
      categories: [],
      featuredDrugs: [],
      searchResults: [],
      searchTotal: 0,
      categoryDrugs: [],
      categoryDrugsTotal: 0,
      currentDrug: null,
      similarDrugs: [],
      catalogLoading: false,
      cartItems: [],
      cartCount: 0,
      myOrders: [],
      ordersTotal: 0,
      currentOrder: null,
      trackingOrder: null,
      ordersLoading: false,
      addresses: [],
      addressesLoading: false,
      recentSearches: [],
    });
    jest.clearAllMocks();
  });

  // ── Catalog ──

  describe('fetchCategories', () => {
    it('loads drug categories', async () => {
      svc.getCategories.mockResolvedValue([
        { _id: 'c1', name: 'Pain Relief' },
        { _id: 'c2', name: 'Antibiotics' },
      ]);

      await usePharmacyStore.getState().fetchCategories();

      expect(usePharmacyStore.getState().categories).toHaveLength(2);
      expect(usePharmacyStore.getState().catalogLoading).toBe(false);
    });

    it('handles failure silently', async () => {
      svc.getCategories.mockRejectedValue(new Error('fail'));

      await usePharmacyStore.getState().fetchCategories();

      expect(usePharmacyStore.getState().categories).toEqual([]);
      expect(usePharmacyStore.getState().catalogLoading).toBe(false);
    });
  });

  describe('fetchFeaturedDrugs', () => {
    it('loads featured drugs', async () => {
      svc.getFeaturedDrugs.mockResolvedValue([makeDrug()]);

      await usePharmacyStore.getState().fetchFeaturedDrugs();

      expect(usePharmacyStore.getState().featuredDrugs).toHaveLength(1);
    });
  });

  describe('searchDrugs', () => {
    it('handles response with drugs and total', async () => {
      svc.searchDrugs.mockResolvedValue({
        drugs: [makeDrug(), makeDrug({ _id: 'drug-2' })],
        total: 50,
      });

      await usePharmacyStore.getState().searchDrugs({ query: 'paracetamol' });

      expect(usePharmacyStore.getState().searchResults).toHaveLength(2);
      expect(usePharmacyStore.getState().searchTotal).toBe(50);
    });

    it('handles flat array response', async () => {
      svc.searchDrugs.mockResolvedValue([makeDrug()]);

      await usePharmacyStore.getState().searchDrugs({ query: 'ibuprofen' });

      expect(usePharmacyStore.getState().searchResults).toHaveLength(1);
    });
  });

  describe('fetchDrugById', () => {
    it('sets currentDrug', async () => {
      const drug = makeDrug({ _id: 'drug-5', name: 'Amoxicillin' });
      svc.getDrugById.mockResolvedValue(drug);

      await usePharmacyStore.getState().fetchDrugById('drug-5');

      expect(usePharmacyStore.getState().currentDrug?.name).toBe('Amoxicillin');
    });
  });

  describe('clearSearch', () => {
    it('clears search results and total', () => {
      usePharmacyStore.setState({ searchResults: [makeDrug()], searchTotal: 10 });

      usePharmacyStore.getState().clearSearch();

      expect(usePharmacyStore.getState().searchResults).toEqual([]);
      expect(usePharmacyStore.getState().searchTotal).toBe(0);
    });
  });

  // ── Cart ──

  describe('addToCart', () => {
    it('adds a new item to cart with quantity 1', () => {
      const drug = makeDrug();

      usePharmacyStore.getState().addToCart(drug as any);

      const cart = usePharmacyStore.getState().cartItems;
      expect(cart).toHaveLength(1);
      expect(cart[0]!.drugId).toBe('drug-1');
      expect(cart[0]!.quantity).toBe(1);
      expect(usePharmacyStore.getState().cartCount).toBe(1);
    });

    it('increments quantity when adding existing item', () => {
      const drug = makeDrug();
      usePharmacyStore.getState().addToCart(drug as any);
      usePharmacyStore.getState().addToCart(drug as any);

      const cart = usePharmacyStore.getState().cartItems;
      expect(cart).toHaveLength(1);
      expect(cart[0]!.quantity).toBe(2);
    });

    it('does not exceed max_quantity_per_order', () => {
      const drug = makeDrug({ max_quantity_per_order: 2 });
      usePharmacyStore.getState().addToCart(drug as any);
      usePharmacyStore.getState().addToCart(drug as any);
      usePharmacyStore.getState().addToCart(drug as any); // should not increment

      expect(usePharmacyStore.getState().cartItems[0]!.quantity).toBe(2);
    });
  });

  describe('removeFromCart', () => {
    it('removes item by drugId', () => {
      usePharmacyStore.getState().addToCart(makeDrug({ _id: 'a' }) as any);
      usePharmacyStore.getState().addToCart(makeDrug({ _id: 'b', name: 'Drug B' }) as any);

      usePharmacyStore.getState().removeFromCart('a');

      const cart = usePharmacyStore.getState().cartItems;
      expect(cart).toHaveLength(1);
      expect(cart[0]!.drugId).toBe('b');
      expect(usePharmacyStore.getState().cartCount).toBe(1);
    });
  });

  describe('updateQuantity', () => {
    it('updates quantity for a cart item', () => {
      usePharmacyStore.getState().addToCart(makeDrug() as any);

      usePharmacyStore.getState().updateQuantity('drug-1', 5);

      expect(usePharmacyStore.getState().cartItems[0]!.quantity).toBe(5);
    });

    it('clamps quantity to minimum 1', () => {
      usePharmacyStore.getState().addToCart(makeDrug() as any);

      usePharmacyStore.getState().updateQuantity('drug-1', 0);

      expect(usePharmacyStore.getState().cartItems[0]!.quantity).toBe(1);
    });

    it('clamps quantity to maxQuantityPerOrder', () => {
      usePharmacyStore.getState().addToCart(makeDrug({ max_quantity_per_order: 3 }) as any);

      usePharmacyStore.getState().updateQuantity('drug-1', 99);

      expect(usePharmacyStore.getState().cartItems[0]!.quantity).toBe(3);
    });
  });

  describe('clearCart', () => {
    it('removes all items from cart', () => {
      usePharmacyStore.getState().addToCart(makeDrug({ _id: 'a' }) as any);
      usePharmacyStore.getState().addToCart(makeDrug({ _id: 'b', name: 'B' }) as any);

      usePharmacyStore.getState().clearCart();

      expect(usePharmacyStore.getState().cartItems).toEqual([]);
      expect(usePharmacyStore.getState().cartCount).toBe(0);
    });
  });

  // ── Orders ──

  describe('fetchMyOrders', () => {
    it('loads orders with nested response', async () => {
      svc.getMyOrders.mockResolvedValue({
        orders: [{ _id: 'ord-1', status: 'PENDING' }],
        total: 1,
      });

      await usePharmacyStore.getState().fetchMyOrders();

      expect(usePharmacyStore.getState().myOrders).toHaveLength(1);
      expect(usePharmacyStore.getState().ordersTotal).toBe(1);
    });

    it('handles flat array response', async () => {
      svc.getMyOrders.mockResolvedValue([{ _id: 'ord-1' }]);

      await usePharmacyStore.getState().fetchMyOrders();

      expect(usePharmacyStore.getState().myOrders).toHaveLength(1);
    });
  });

  describe('createOtcOrder', () => {
    it('creates order and returns data', async () => {
      const order = { _id: 'ord-new', order_number: 'ORD-001' };
      svc.createOtcOrder.mockResolvedValue(order);

      const result = await usePharmacyStore.getState().createOtcOrder({
        pharmacy: 'pharm-1',
        items: [{ drug: 'drug-1', quantity: 2 }],
      });

      expect(result).toEqual(order);
    });
  });

  describe('cancelOrder', () => {
    it('cancels and re-fetches order', async () => {
      svc.cancelOrder.mockResolvedValue(undefined);
      svc.getOrderById.mockResolvedValue({ _id: 'ord-1', status: 'CANCELLED' });

      await usePharmacyStore.getState().cancelOrder('ord-1', 'Changed mind');

      expect(svc.cancelOrder).toHaveBeenCalledWith('ord-1', 'Changed mind');
      expect(usePharmacyStore.getState().currentOrder?.status).toBe('CANCELLED');
    });
  });

  // ── Search History ──

  describe('addRecentSearch', () => {
    it('adds search term to front of list', () => {
      usePharmacyStore.getState().addRecentSearch('paracetamol');
      usePharmacyStore.getState().addRecentSearch('ibuprofen');

      const searches = usePharmacyStore.getState().recentSearches;
      expect(searches[0]).toBe('ibuprofen');
      expect(searches[1]).toBe('paracetamol');
    });

    it('deduplicates search terms', () => {
      usePharmacyStore.getState().addRecentSearch('aspirin');
      usePharmacyStore.getState().addRecentSearch('other');
      usePharmacyStore.getState().addRecentSearch('aspirin');

      const searches = usePharmacyStore.getState().recentSearches;
      expect(searches).toHaveLength(2);
      expect(searches[0]).toBe('aspirin');
    });

    it('ignores empty/whitespace-only queries', () => {
      usePharmacyStore.getState().addRecentSearch('  ');

      expect(usePharmacyStore.getState().recentSearches).toHaveLength(0);
    });

    it('limits to 10 entries', () => {
      for (let i = 0; i < 15; i++) {
        usePharmacyStore.getState().addRecentSearch(`drug-${i}`);
      }

      expect(usePharmacyStore.getState().recentSearches).toHaveLength(10);
    });
  });

  describe('clearRecentSearches', () => {
    it('clears all recent searches', () => {
      usePharmacyStore.getState().addRecentSearch('test');

      usePharmacyStore.getState().clearRecentSearches();

      expect(usePharmacyStore.getState().recentSearches).toEqual([]);
    });
  });

  // ── Addresses ──

  describe('fetchAddresses', () => {
    it('loads addresses', async () => {
      svc.getMyAddresses.mockResolvedValue([
        { _id: 'addr-1', label: 'Home', street: '123 Main St' },
      ]);

      await usePharmacyStore.getState().fetchAddresses();

      expect(usePharmacyStore.getState().addresses).toHaveLength(1);
      expect(usePharmacyStore.getState().addressesLoading).toBe(false);
    });

    it('handles nested addresses response', async () => {
      svc.getMyAddresses.mockResolvedValue({ addresses: [{ _id: 'addr-1' }] });

      await usePharmacyStore.getState().fetchAddresses();

      expect(usePharmacyStore.getState().addresses).toHaveLength(1);
    });
  });
});
