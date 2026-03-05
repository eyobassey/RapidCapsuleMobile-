import {create} from 'zustand';
import {vitalsService} from '../services/vitals.service';

// The backend returns a single merged object: { blood_pressure: [...], pulse_rate: [...], ... }
// Each vital key maps to an array of { value, unit, updatedAt } readings.
interface VitalsData {
  [key: string]: any;
}

interface VitalsState {
  vitalsData: VitalsData;
  recentVitals: VitalsData;
  chartData: any | null;
  isLoading: boolean;
  error: string | null;

  fetchVitals: () => Promise<void>;
  fetchRecentVitals: () => Promise<void>;
  fetchChartData: (params: {vitalToSelect: string; duration: string}) => Promise<void>;
  logVital: (data: any) => Promise<void>;
}

export const useVitalsStore = create<VitalsState>((set) => ({
  vitalsData: {},
  recentVitals: {},
  chartData: null,
  isLoading: false,
  error: null,

  fetchVitals: async () => {
    set({isLoading: true, error: null});
    try {
      const data = await vitalsService.list();
      // API returns a single object with vital keys, or null/undefined if no records
      set({vitalsData: data && typeof data === 'object' ? data : {}, isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch vitals',
        isLoading: false,
      });
    }
  },

  fetchRecentVitals: async () => {
    try {
      const data = await vitalsService.getRecent();
      set({recentVitals: data && typeof data === 'object' ? data : {}});
    } catch {
      // Silent fail — main vitals list still works from vitalsData
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
      await vitalsService.create(data);
      // Re-fetch to get the updated data
      const [fresh, recent] = await Promise.allSettled([
        vitalsService.list(),
        vitalsService.getRecent(),
      ]);
      set({
        vitalsData: fresh.status === 'fulfilled' && fresh.value && typeof fresh.value === 'object' ? fresh.value : {},
        recentVitals: recent.status === 'fulfilled' && recent.value && typeof recent.value === 'object' ? recent.value : {},
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
}));
