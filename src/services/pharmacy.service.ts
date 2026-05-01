import api, { unwrapResponse } from './api';
import type { DrugSearchParams } from '../types/pharmacy.types';

export const pharmacyService = {
  // ── Drug Catalog ──

  async searchDrugs(params?: DrugSearchParams) {
    const res = await api.get('/pharmacy/drugs/search', { params });
    return unwrapResponse(res);
  },

  async getOtcDrugs(params?: { page?: number; limit?: number }) {
    const res = await api.get('/pharmacy/drugs/otc', { params });
    return unwrapResponse(res);
  },

  async getCategories() {
    const res = await api.get('/pharmacy/drugs/categories');
    return unwrapResponse(res);
  },

  async getFeaturedDrugs(limit = 10) {
    const res = await api.get('/pharmacy/drugs/featured', { params: { limit } });
    return unwrapResponse(res);
  },

  async getDrugById(id: string) {
    const res = await api.get(`/pharmacy/drugs/${id}`);
    return unwrapResponse(res);
  },

  async getSimilarDrugs(id: string, limit = 6) {
    const res = await api.get(`/pharmacy/drugs/${id}/similar`, { params: { limit } });
    return unwrapResponse(res);
  },

  async getDrugSafety(id: string) {
    const res = await api.get(`/pharmacy/drugs/${id}/safety`);
    return unwrapResponse(res);
  },

  async getDrugsByCategory(
    categoryId: string,
    params?: { page?: number; limit?: number; sort?: string }
  ) {
    const res = await api.get(`/pharmacy/drugs/category/${categoryId}`, { params });
    return unwrapResponse(res);
  },

  // ── Orders ──

  async createOtcOrder(payload: {
    pharmacy: string;
    items: { drug: string; quantity: number }[];
    delivery_method?: 'PICKUP' | 'DELIVERY';
    delivery_address?: any;
    patient_notes?: string;
  }) {
    const res = await api.post('/pharmacy-orders/otc', payload);
    return unwrapResponse(res);
  },

  async getMyOrders(params?: { status?: string; page?: number; limit?: number }) {
    const res = await api.get('/pharmacy-orders/my-orders', { params });
    return unwrapResponse(res);
  },

  async getOrderById(id: string) {
    const res = await api.get(`/pharmacy-orders/${id}`);
    return unwrapResponse(res);
  },

  async cancelOrder(id: string, reason: string) {
    const res = await api.patch(`/pharmacy-orders/${id}/cancel`, { cancellation_reason: reason });
    return unwrapResponse(res);
  },

  async rateOrder(id: string, payload: { rating: number; review?: string }) {
    const res = await api.patch(`/pharmacy-orders/${id}/rate`, payload);
    return unwrapResponse(res);
  },

  async validateCart(items: { drug: string; quantity: number }[]) {
    const res = await api.post('/pharmacy-orders/validate-cart', { items });
    return unwrapResponse(res);
  },

  async initializePayment(orderId: string) {
    const res = await api.post(`/pharmacy-orders/${orderId}/initialize-payment`);
    return unwrapResponse(res);
  },

  async payWithWallet(orderId: string, amount: number) {
    const res = await api.post(`/pharmacy-orders/${orderId}/pay-with-wallet`, { amount });
    return unwrapResponse(res);
  },

  // ── Pharmacy / Pickup ──

  async getPharmacyById(id: string) {
    const res = await api.get(`/pharmacy/pharmacies/${id}`);
    return unwrapResponse(res);
  },

  // ── Wallet ──

  async getWalletBalance() {
    const res = await api.get('/wallets/balance');
    return unwrapResponse(res);
  },

  // ── Addresses ──

  async getMyAddresses() {
    const res = await api.get('/pharmacy-orders/addresses/my');
    return unwrapResponse(res);
  },

  async addAddress(payload: {
    label: string;
    recipient_name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    country?: string;
    postal_code?: string;
    additional_info?: string;
    is_default?: boolean;
  }) {
    const res = await api.post('/pharmacy-orders/addresses/my', payload);
    return unwrapResponse(res);
  },

  async setDefaultAddress(addressId: string) {
    const res = await api.patch(`/pharmacy-orders/addresses/my/${addressId}/default`);
    return unwrapResponse(res);
  },

  // ── Tracking ──

  async trackOrder(orderNumber: string) {
    const res = await api.get(`/pharmacy-orders/track/${orderNumber}`);
    return unwrapResponse(res);
  },
};
