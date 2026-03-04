import {create} from 'zustand';
import {vitalsService} from '../services/vitals.service';

interface VitalsState {
  vitals: any[];
  recentVitals: any[];
  chartData: any | null;
  isLoading: boolean;
  error: string | null;

  fetchVitals: () => Promise<void>;
  fetchRecent: () => Promise<void>;
  fetchChartData: (params: {vitalToSelect: string; duration: string}) => Promise<void>;
  logVital: (data: any) => Promise<void>;
  updateVital: (id: string, data: any) => Promise<void>;
  deleteVital: (id: string) => Promise<void>;
}

export const useVitalsStore = create<VitalsState>((set, get) => ({
  vitals: [],
  recentVitals: [],
  chartData: null,
  isLoading: false,
  error: null,

  fetchVitals: async () => {
    set({isLoading: true, error: null});
    try {
      const data = await vitalsService.list();
      set({vitals: data || [], isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch vitals',
        isLoading: false,
      });
    }
  },

  fetchRecent: async () => {
    set({isLoading: true, error: null});
    try {
      const data = await vitalsService.getRecent();
      set({recentVitals: data || [], isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch recent vitals',
        isLoading: false,
      });
    }
  },

  fetchChartData: async (params: {vitalToSelect: string; duration: string}) => {
    set({isLoading: true, error: null});
    try {
      const data = await vitalsService.getChartData(params);
      set({chartData: data, isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch chart data',
        isLoading: false,
      });
    }
  },

  logVital: async (data: any) => {
    set({isLoading: true, error: null});
    try {
      const newVital = await vitalsService.create(data);
      set({
        vitals: [newVital, ...get().vitals],
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to log vital',
        isLoading: false,
      });
      throw err;
    }
  },

  updateVital: async (id: string, data: any) => {
    set({isLoading: true, error: null});
    try {
      const updated = await vitalsService.update(id, data);
      const vitals = get().vitals.map((v: any) => (v._id === id ? updated : v));
      set({vitals, isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to update vital',
        isLoading: false,
      });
      throw err;
    }
  },

  deleteVital: async (id: string) => {
    set({isLoading: true, error: null});
    try {
      await vitalsService.remove(id);
      const vitals = get().vitals.filter((v: any) => v._id !== id);
      set({vitals, isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to delete vital',
        isLoading: false,
      });
    }
  },
}));
