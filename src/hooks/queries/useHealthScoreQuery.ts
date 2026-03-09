import {useQuery} from '@tanstack/react-query';
import {healthScoreService} from '../../services/healthScore.service';

// ── Query key factory ──────────────────────────────────────
export const healthScoreKeys = {
  all: ['healthScore'] as const,
  score: () => [...healthScoreKeys.all, 'score'] as const,
  history: () => [...healthScoreKeys.all, 'history'] as const,
};

// ── Queries ────────────────────────────────────────────────

export function useHealthScoreQuery() {
  return useQuery({
    queryKey: healthScoreKeys.score(),
    queryFn: () => healthScoreService.getBasicScore(),
  });
}
