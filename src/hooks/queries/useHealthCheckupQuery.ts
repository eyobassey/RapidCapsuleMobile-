import { useQuery } from '@tanstack/react-query';
import { healthCheckupService } from '../../services/healthCheckup.service';

export const healthCheckupKeys = {
  all: ['healthCheckup'] as const,
  recent: () => [...healthCheckupKeys.all, 'recent'] as const,
};

/** Returns checkups from the last 30 days that have at least one condition. */
export function useRecentCheckupsQuery() {
  return useQuery({
    queryKey: healthCheckupKeys.recent(),
    queryFn: async () => {
      const data = await healthCheckupService.getHistory({ page: 1, limit: 10 });
      const list: any[] = data?.checkups ?? (Array.isArray(data) ? data : []);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return list.filter((c) => {
        const hasConditions = (c.response?.data?.conditions?.length ?? 0) > 0;
        const isRecent = new Date(c.created_at) >= thirtyDaysAgo;
        return hasConditions && isRecent;
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}
