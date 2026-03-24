import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyService } from '../../services/pharmacy.service';
import type { DrugSearchParams } from '../../types/pharmacy.types';

// ── Query key factory ──────────────────────────────────────
export const pharmacyKeys = {
  all: ['pharmacy'] as const,
  categories: () => [...pharmacyKeys.all, 'categories'] as const,
  featured: () => [...pharmacyKeys.all, 'featured'] as const,
  search: (params: DrugSearchParams) => [...pharmacyKeys.all, 'search', params] as const,
  categoryDrugs: (id: string, params?: { page?: number; limit?: number }) =>
    [...pharmacyKeys.all, 'category', id, params] as const,
  drug: (id: string) => [...pharmacyKeys.all, 'drug', id] as const,
  similarDrugs: (id: string) => [...pharmacyKeys.all, 'similar', id] as const,
  orders: () => [...pharmacyKeys.all, 'orders'] as const,
  orderList: (params?: { status?: string; page?: number; limit?: number }) =>
    [...pharmacyKeys.all, 'orders', 'list', params] as const,
  order: (id: string) => [...pharmacyKeys.all, 'orders', id] as const,
  track: (orderNumber: string) => [...pharmacyKeys.all, 'track', orderNumber] as const,
  addresses: () => [...pharmacyKeys.all, 'addresses'] as const,
  pharmacy: (id: string) => [...pharmacyKeys.all, 'pharmacy', id] as const,
  walletBalance: () => [...pharmacyKeys.all, 'wallet'] as const,
};

// ── Queries ────────────────────────────────────────────────

export function usePharmacyCategoriesQuery() {
  return useQuery({
    queryKey: pharmacyKeys.categories(),
    queryFn: async () => {
      const data = await pharmacyService.getCategories();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedDrugsQuery(limit = 10) {
  return useQuery({
    queryKey: pharmacyKeys.featured(),
    queryFn: async () => {
      const data = await pharmacyService.getFeaturedDrugs(limit);
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useDrugSearchQuery(params: DrugSearchParams, enabled = true) {
  return useQuery({
    queryKey: pharmacyKeys.search(params),
    queryFn: async () => {
      const data = await pharmacyService.searchDrugs(params);
      if (data && data.drugs) {
        return { drugs: data.drugs, total: data.total ?? data.drugs.length };
      }
      return { drugs: Array.isArray(data) ? data : [], total: 0 };
    },
    enabled: enabled && !!params.query,
  });
}

export function useDrugsByCategoryQuery(
  categoryId: string | null,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: pharmacyKeys.categoryDrugs(categoryId ?? '', params),
    queryFn: async () => {
      if (!categoryId) return { drugs: [], total: 0 };
      const data = await pharmacyService.searchDrugs({
        category: categoryId,
        page: params?.page,
        limit: params?.limit || 20,
      });
      if (data && data.drugs) {
        return { drugs: data.drugs, total: data.total ?? data.drugs.length };
      }
      return { drugs: Array.isArray(data) ? data : [], total: 0 };
    },
    enabled: !!categoryId,
  });
}

export function useDrugQuery(id: string | null) {
  return useQuery({
    queryKey: pharmacyKeys.drug(id ?? ''),
    queryFn: () => pharmacyService.getDrugById(id!),
    enabled: !!id,
  });
}

export function useSimilarDrugsQuery(drugId: string | null, limit = 6) {
  return useQuery({
    queryKey: pharmacyKeys.similarDrugs(drugId ?? ''),
    queryFn: async () => {
      const data = await pharmacyService.getSimilarDrugs(drugId!, limit);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!drugId,
  });
}

export function useMyOrdersQuery(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: pharmacyKeys.orderList(params),
    queryFn: async () => {
      const data = await pharmacyService.getMyOrders(params);
      if (data && data.orders) {
        return { orders: data.orders, total: data.total ?? data.orders.length };
      }
      return { orders: Array.isArray(data) ? data : [], total: 0 };
    },
  });
}

export function useOrderQuery(id: string | null) {
  return useQuery({
    queryKey: pharmacyKeys.order(id ?? ''),
    queryFn: () => pharmacyService.getOrderById(id!),
    enabled: !!id,
  });
}

export function useTrackOrderQuery(orderNumber: string | null, refetchInterval?: number) {
  return useQuery({
    queryKey: pharmacyKeys.track(orderNumber ?? ''),
    queryFn: () => pharmacyService.trackOrder(orderNumber!),
    enabled: !!orderNumber && orderNumber.length > 0,
    refetchInterval: refetchInterval ?? false,
  });
}

export function useAddressesQuery() {
  return useQuery({
    queryKey: pharmacyKeys.addresses(),
    queryFn: async () => {
      const data = await pharmacyService.getMyAddresses();
      const list = Array.isArray(data) ? data : data?.addresses || [];
      return Array.isArray(list) ? list : [];
    },
  });
}

export function usePharmacyQuery(id: string | null) {
  return useQuery({
    queryKey: pharmacyKeys.pharmacy(id ?? ''),
    queryFn: () => pharmacyService.getPharmacyById(id!),
    enabled: !!id,
  });
}

export function usePharmacyWalletBalanceQuery() {
  return useQuery({
    queryKey: pharmacyKeys.walletBalance(),
    queryFn: async () => {
      const data = await pharmacyService.getWalletBalance();
      return data?.currentBalance ?? 0;
    },
  });
}

// ── Mutations ──────────────────────────────────────────────

export function useAddAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => pharmacyService.addAddress(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pharmacyKeys.addresses() });
    },
  });
}

export function useSetDefaultAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pharmacyService.setDefaultAddress(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pharmacyKeys.addresses() });
    },
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      pharmacyService.cancelOrder(id, reason),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: pharmacyKeys.orders() });
      void queryClient.invalidateQueries({ queryKey: pharmacyKeys.order(id) });
    },
  });
}

export function useRateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating, review }: { id: string; rating: number; review?: string }) =>
      pharmacyService.rateOrder(id, { rating, review }),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: pharmacyKeys.order(id) });
      void queryClient.invalidateQueries({ queryKey: pharmacyKeys.orders() });
    },
  });
}
