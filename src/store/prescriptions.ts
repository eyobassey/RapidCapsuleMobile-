import {create} from 'zustand';
import {prescriptionsService} from '../services/prescriptions.service';

interface PrescriptionsState {
  prescriptions: any[];
  currentPrescription: any | null;
  isLoading: boolean;
  error: string | null;
  filter: string;

  fetchPrescriptions: () => Promise<void>;
  fetchPrescriptionById: (id: string) => Promise<void>;
  setFilter: (filter: string) => void;
  acceptPrescription: (id: string) => Promise<void>;
  declinePrescription: (id: string) => Promise<void>;
  requestRefill: (id: string) => Promise<void>;
  initializePayment: (id: string) => Promise<{authorization_url: string; reference: string}>;
  payWithWallet: (id: string) => Promise<void>;
  verifyPayment: (id: string, reference: string) => Promise<void>;
}

export const usePrescriptionsStore = create<PrescriptionsState>((set, get) => ({
  prescriptions: [],
  currentPrescription: null,
  isLoading: false,
  error: null,
  filter: '',

  fetchPrescriptions: async () => {
    set({isLoading: true, error: null});
    try {
      const params: Record<string, any> = {};
      if (get().filter) {
        params.status = get().filter;
      }
      const data = await prescriptionsService.list(params);
      // API may return array directly or paginated { data: [...], total: ... }
      const list = Array.isArray(data) ? data : data?.data || data?.prescriptions || [];
      set({prescriptions: Array.isArray(list) ? list : [], isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch prescriptions',
        isLoading: false,
      });
    }
  },

  fetchPrescriptionById: async (id: string) => {
    set({isLoading: true, error: null});
    try {
      const data = await prescriptionsService.getById(id);
      set({currentPrescription: data, isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch prescription',
        isLoading: false,
      });
    }
  },

  setFilter: (filter: string) => {
    set({filter});
  },

  acceptPrescription: async (id: string) => {
    set({isLoading: true, error: null});
    try {
      await prescriptionsService.accept(id);
      const prescriptions = get().prescriptions.map((p: any) =>
        p._id === id ? {...p, status: 'accepted'} : p,
      );
      set({prescriptions, isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to accept prescription',
        isLoading: false,
      });
      throw err;
    }
  },

  declinePrescription: async (id: string) => {
    set({isLoading: true, error: null});
    try {
      await prescriptionsService.decline(id);
      const prescriptions = get().prescriptions.map((p: any) =>
        p._id === id ? {...p, status: 'declined'} : p,
      );
      set({prescriptions, isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to decline prescription',
        isLoading: false,
      });
      throw err;
    }
  },

  requestRefill: async (id: string) => {
    set({isLoading: true, error: null});
    try {
      await prescriptionsService.requestRefill(id);
      set({isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to request refill',
        isLoading: false,
      });
      throw err;
    }
  },

  initializePayment: async (id: string) => {
    const data = await prescriptionsService.initializeCardPayment(id);
    return data;
  },

  payWithWallet: async (id: string) => {
    await prescriptionsService.payWithWallet(id);
    const data = await prescriptionsService.getById(id);
    set({currentPrescription: data});
  },

  verifyPayment: async (id: string, reference: string) => {
    await prescriptionsService.verifyCardPayment(id, reference);
    const data = await prescriptionsService.getById(id);
    set({currentPrescription: data});
  },
}));
