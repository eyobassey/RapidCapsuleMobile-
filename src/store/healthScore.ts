import { create } from 'zustand';
import { healthScoreService } from '../services/healthScore.service';
import { getErrorMessage } from '../services/api-error';

interface HealthScoreState {
  score: number | null;
  status: string | null;
  isLoading: boolean;
  error: string | null;

  fetchScore: () => Promise<void>;
}

export const useHealthScoreStore = create<HealthScoreState>((set) => ({
  score: null,
  status: null,
  isLoading: false,
  error: null,

  fetchScore: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await healthScoreService.getBasicScore();
      set({
        score: data?.score ?? null,
        status: data?.status ?? null,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: getErrorMessage(err, 'Failed to fetch health score'),
        isLoading: false,
      });
    }
  },
}));
