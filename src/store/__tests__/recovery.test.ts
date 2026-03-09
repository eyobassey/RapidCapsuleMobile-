jest.mock('../../services/recovery.service', () => ({
  recoveryService: {
    getProfile: jest.fn(),
    getDashboard: jest.fn(),
    getStats: jest.fn(),
    getMilestones: jest.fn(),
    getScreeningHistory: jest.fn(),
    getActivePlan: jest.fn(),
    getExerciseStats: jest.fn(),
    getRiskHistory: jest.fn(),
    getMyGroupSessions: jest.fn(),
    getPeerAssignments: jest.fn(),
    getMATCompliance: jest.fn(),
    getRecentSessions: jest.fn(),
    getChartData: jest.fn(),
  },
}));

import {useRecoveryStore} from '../recovery';
import {recoveryService} from '../../services/recovery.service';

const svc = recoveryService as jest.Mocked<typeof recoveryService>;

const initialState = {
  profile: null,
  dashboard: null,
  stats: null,
  milestones: [],
  screeningHistory: [],
  activePlan: null,
  exerciseStats: null,
  riskHistory: [],
  groupSessions: [],
  peerAssignment: null,
  matCompliance: null,
  recentConversations: [],
  chartData: [],
  isLoading: false,
  isEnrolled: false,
  error: null,
};

describe('useRecoveryStore', () => {
  beforeEach(() => {
    useRecoveryStore.setState(initialState);
    jest.clearAllMocks();
  });

  describe('fetchProfile', () => {
    it('loads profile and sets isEnrolled true for active profile', async () => {
      svc.getProfile.mockResolvedValue({
        _id: 'rp-1',
        status: 'active',
        sobriety_days: 30,
      } as any);

      await useRecoveryStore.getState().fetchProfile();

      const s = useRecoveryStore.getState();
      expect(s.profile).toBeTruthy();
      expect(s.profile?.status).toBe('active');
      expect(s.isEnrolled).toBe(true);
      expect(s.isLoading).toBe(false);
    });

    it('sets isEnrolled false for archived profile', async () => {
      svc.getProfile.mockResolvedValue({
        _id: 'rp-1',
        status: 'archived',
      } as any);

      await useRecoveryStore.getState().fetchProfile();

      expect(useRecoveryStore.getState().isEnrolled).toBe(false);
    });

    it('handles 404 (not enrolled) gracefully', async () => {
      const err = {response: {status: 404}};
      svc.getProfile.mockRejectedValue(err);

      await useRecoveryStore.getState().fetchProfile();

      const s = useRecoveryStore.getState();
      expect(s.profile).toBeNull();
      expect(s.isEnrolled).toBe(false);
      expect(s.error).toBeNull();
      expect(s.isLoading).toBe(false);
    });

    it('sets error for non-404 failures', async () => {
      svc.getProfile.mockRejectedValue(new Error('Server error'));

      await useRecoveryStore.getState().fetchProfile();

      expect(useRecoveryStore.getState().error).toBe('Failed to load recovery profile');
    });
  });

  describe('fetchDashboard', () => {
    it('loads dashboard data', async () => {
      const dashData = {sobriety_days: 45, risk_level: 'low'};
      svc.getDashboard.mockResolvedValue(dashData as any);

      await useRecoveryStore.getState().fetchDashboard();

      expect(useRecoveryStore.getState().dashboard).toEqual(dashData);
    });

    it('silently handles failure', async () => {
      svc.getDashboard.mockRejectedValue(new Error('fail'));

      await useRecoveryStore.getState().fetchDashboard();

      expect(useRecoveryStore.getState().dashboard).toBeNull();
    });
  });

  describe('fetchStats', () => {
    it('loads sobriety stats', async () => {
      const stats = {total_sober_days: 100, longest_streak: 50};
      svc.getStats.mockResolvedValue(stats as any);

      await useRecoveryStore.getState().fetchStats();

      expect(useRecoveryStore.getState().stats).toEqual(stats);
    });
  });

  describe('fetchMilestones', () => {
    it('loads milestones array', async () => {
      svc.getMilestones.mockResolvedValue([
        {_id: 'm1', name: '7 Days Sober', achieved: true},
        {_id: 'm2', name: '30 Days Sober', achieved: false},
      ] as any);

      await useRecoveryStore.getState().fetchMilestones();

      expect(useRecoveryStore.getState().milestones).toHaveLength(2);
    });

    it('handles non-array response', async () => {
      svc.getMilestones.mockResolvedValue({not: 'array'} as any);

      await useRecoveryStore.getState().fetchMilestones();

      expect(useRecoveryStore.getState().milestones).toEqual([]);
    });

    it('silently handles failure', async () => {
      svc.getMilestones.mockRejectedValue(new Error('fail'));

      await useRecoveryStore.getState().fetchMilestones();

      expect(useRecoveryStore.getState().milestones).toEqual([]);
    });
  });

  describe('fetchScreeningHistory', () => {
    it('loads screening history', async () => {
      svc.getScreeningHistory.mockResolvedValue([
        {_id: 's1', instrument: 'AUDIT', total_score: 5},
      ] as any);

      await useRecoveryStore.getState().fetchScreeningHistory();

      expect(useRecoveryStore.getState().screeningHistory).toHaveLength(1);
      expect(svc.getScreeningHistory).toHaveBeenCalledWith({limit: 20});
    });
  });

  describe('fetchActivePlan', () => {
    it('loads active recovery plan', async () => {
      svc.getActivePlan.mockResolvedValue({
        _id: 'plan-1',
        title: 'Recovery Plan A',
        status: 'active',
      } as any);

      await useRecoveryStore.getState().fetchActivePlan();

      expect(useRecoveryStore.getState().activePlan?._id).toBe('plan-1');
    });

    it('sets null when no active plan', async () => {
      svc.getActivePlan.mockResolvedValue(null as any);

      await useRecoveryStore.getState().fetchActivePlan();

      expect(useRecoveryStore.getState().activePlan).toBeNull();
    });

    it('sets null on failure', async () => {
      svc.getActivePlan.mockRejectedValue(new Error('fail'));

      await useRecoveryStore.getState().fetchActivePlan();

      expect(useRecoveryStore.getState().activePlan).toBeNull();
    });
  });

  describe('fetchExerciseStats', () => {
    it('loads exercise stats', async () => {
      svc.getExerciseStats.mockResolvedValue({
        total_sessions: 10,
        total_minutes: 300,
      } as any);

      await useRecoveryStore.getState().fetchExerciseStats();

      expect(useRecoveryStore.getState().exerciseStats?.total_sessions).toBe(10);
    });
  });

  describe('fetchRiskHistory', () => {
    it('loads risk history with optional period', async () => {
      svc.getRiskHistory.mockResolvedValue([
        {_id: 'r1', risk_score: 30, risk_level: 'low'},
      ] as any);

      await useRecoveryStore.getState().fetchRiskHistory('30d');

      expect(svc.getRiskHistory).toHaveBeenCalledWith('30d');
      expect(useRecoveryStore.getState().riskHistory).toHaveLength(1);
    });
  });

  describe('fetchGroupSessions', () => {
    it('loads group sessions', async () => {
      svc.getMyGroupSessions.mockResolvedValue([
        {_id: 'gs1', title: 'Weekly Check-in'},
      ] as any);

      await useRecoveryStore.getState().fetchGroupSessions();

      expect(useRecoveryStore.getState().groupSessions).toHaveLength(1);
    });
  });

  describe('fetchPeerAssignment', () => {
    it('finds active peer assignment', async () => {
      svc.getPeerAssignments.mockResolvedValue([
        {_id: 'pa1', status: 'completed'},
        {_id: 'pa2', status: 'active', peer: {name: 'John'}},
      ] as any);

      await useRecoveryStore.getState().fetchPeerAssignment();

      expect(useRecoveryStore.getState().peerAssignment?._id).toBe('pa2');
    });

    it('sets null when no active assignment', async () => {
      svc.getPeerAssignments.mockResolvedValue([
        {_id: 'pa1', status: 'completed'},
      ] as any);

      await useRecoveryStore.getState().fetchPeerAssignment();

      expect(useRecoveryStore.getState().peerAssignment).toBeNull();
    });
  });

  describe('fetchMATCompliance', () => {
    it('loads MAT compliance data', async () => {
      svc.getMATCompliance.mockResolvedValue({
        compliance_rate: 95,
        medications: [],
      } as any);

      await useRecoveryStore.getState().fetchMATCompliance();

      expect(useRecoveryStore.getState().matCompliance).toBeTruthy();
    });
  });

  describe('fetchRecentConversations', () => {
    it('loads recent companion sessions', async () => {
      svc.getRecentSessions.mockResolvedValue([
        {_id: 'cs1', context: 'check-in'},
      ] as any);

      await useRecoveryStore.getState().fetchRecentConversations();

      expect(useRecoveryStore.getState().recentConversations).toHaveLength(1);
    });
  });

  describe('fetchChartData', () => {
    it('loads chart data with defaults', async () => {
      svc.getChartData.mockResolvedValue([
        {date: '2025-01-01', value: 7},
        {date: '2025-01-02', value: 8},
      ] as any);

      await useRecoveryStore.getState().fetchChartData();

      expect(svc.getChartData).toHaveBeenCalledWith('mood_score', 14);
      expect(useRecoveryStore.getState().chartData).toHaveLength(2);
    });

    it('passes custom metric and days', async () => {
      svc.getChartData.mockResolvedValue([]);

      await useRecoveryStore.getState().fetchChartData('craving_intensity', 30);

      expect(svc.getChartData).toHaveBeenCalledWith('craving_intensity', 30);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      useRecoveryStore.setState({
        profile: {_id: 'rp-1'} as any,
        isEnrolled: true,
        milestones: [{_id: 'm1'}] as any,
        error: 'some error',
      });

      useRecoveryStore.getState().reset();

      const s = useRecoveryStore.getState();
      expect(s.profile).toBeNull();
      expect(s.isEnrolled).toBe(false);
      expect(s.milestones).toEqual([]);
      expect(s.error).toBeNull();
      expect(s.dashboard).toBeNull();
      expect(s.chartData).toEqual([]);
    });
  });
});
