import api from './api';
import type {DrugSearchParams} from '../types/pharmacy.types';

export const pharmacyService = {
  // ── Drug Catalog ──

  async searchDrugs(params?: DrugSearchParams) {
    const res = await api.get('/pharmacy/drugs/search', {params});
    return res.data.data || res.data.result;
  },

  async getOtcDrugs(params?: {page?: number; limit?: number}) {
    const res = await api.get('/pharmacy/drugs/otc', {params});
    return res.data.data || res.data.result;
  },

  async getCategories() {
    const res = await api.get('/pharmacy/drugs/categories');
    return res.data.data || res.data.result;
  },

  async getFeaturedDrugs(limit = 10) {
    const res = await api.get('/pharmacy/drugs/featured', {params: {limit}});
    return res.data.data || res.data.result;
  },

  async getDrugById(id: string) {
    const res = await api.get(`/pharmacy/drugs/${id}`);
    return res.data.data || res.data.result;
  },

  async getSimilarDrugs(id: string, limit = 6) {
    const res = await api.get(`/pharmacy/drugs/${id}/similar`, {params: {limit}});
    return res.data.data || res.data.result;
  },

  async getDrugSafety(id: string) {
    const res = await api.get(`/pharmacy/drugs/${id}/safety`);
    return res.data.data || res.data.result;
  },

  async getDrugsByCategory(categoryId: string, params?: {page?: number; limit?: number; sort?: string}) {
    const res = await api.get(`/pharmacy/drugs/category/${categoryId}`, {params});
    return res.data.data || res.data.result;
  },

  // ── Orders ──

  async createOtcOrder(payload: {
    pharmacy: string;
    items: {drug: string; quantity: number}[];
    delivery_method?: 'PICKUP' | 'DELIVERY';
    delivery_address?: any;
    patient_notes?: string;
  }) {
    const res = await api.post('/pharmacy-orders/otc', payload);
    return res.data.data || res.data.result;
  },

  async getMyOrders(params?: {status?: string; page?: number; limit?: number}) {
    const res = await api.get('/pharmacy-orders/my-orders', {params});
    return res.data.data || res.data.result;
  },

  async getOrderById(id: string) {
    const res = await api.get(`/pharmacy-orders/${id}`);
    return res.data.data || res.data.result;
  },

  async cancelOrder(id: string, reason: string) {
    const res = await api.patch(`/pharmacy-orders/${id}/cancel`, {cancellation_reason: reason});
    return res.data.data || res.data.result;
  },

  async rateOrder(id: string, payload: {rating: number; review?: string}) {
    const res = await api.patch(`/pharmacy-orders/${id}/rate`, payload);
    return res.data.data || res.data.result;
  },

  async validateCart(items: {drug: string; quantity: number}[]) {
    const res = await api.post('/pharmacy-orders/validate-cart', {items});
    return res.data.data || res.data.result;
  },

  async initializePayment(orderId: string) {
    const res = await api.post(`/pharmacy-orders/${orderId}/initialize-payment`);
    return res.data.data || res.data.result;
  },

  async payWithWallet(orderId: string, amount: number) {
    const res = await api.post(`/pharmacy-orders/${orderId}/pay-with-wallet`, {amount});
    return res.data.data || res.data.result;
  },

  // ── Pharmacy / Pickup ──

  async getPharmacyById(id: string) {
    const res = await api.get(`/pharmacy/pharmacies/${id}`);
    return res.data.data || res.data.result;
  },

  // ── Wallet ──

  async getWalletBalance() {
    const res = await api.get('/wallets/balance');
    return res.data.data || res.data.result;
  },

  // ── Addresses ──

  async getMyAddresses() {
    const res = await api.get('/pharmacy-orders/addresses/my');
    return res.data.data || res.data.result;
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
    return res.data.data || res.data.result;
  },

  async setDefaultAddress(addressId: string) {
    const res = await api.patch(`/pharmacy-orders/addresses/my/${addressId}/default`);
    return res.data.data || res.data.result;
  },
};
