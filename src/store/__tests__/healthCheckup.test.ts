jest.mock('../../services/healthCheckup.service', () => ({
  healthCheckupService: {
    beginCheckup: jest.fn(),
    getRiskFactors: jest.fn(),
    searchSymptoms: jest.fn(),
    diagnosis: jest.fn(),
    getHistory: jest.fn(),
    getById: jest.fn(),
    getClaudeSummaryStatus: jest.fn(),
    getClaudeSummary: jest.fn(),
    generateClaudeSummary: jest.fn(),
  },
}));

import { useHealthCheckupStore } from '../healthCheckup';
import { healthCheckupService } from '../../services/healthCheckup.service';

const svc = healthCheckupService as jest.Mocked<typeof healthCheckupService>;

describe('useHealthCheckupStore', () => {
  beforeEach(() => {
    useHealthCheckupStore.setState({
      checkupId: null,
      interviewToken: null,
      sex: '',
      age: 0,
      evidence: [],
      riskFactors: [],
      currentQuestion: null,
      conditions: [],
      triageLevel: null,
      shouldStop: false,
      hasEmergency: false,
      history: [],
      currentDetail: null,
      claudeSummary: null,
      summaryLoading: false,
      summaryCredits: null,
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('has correct defaults', () => {
      const s = useHealthCheckupStore.getState();
      expect(s.checkupId).toBeNull();
      expect(s.interviewToken).toBeNull();
      expect(s.sex).toBe('');
      expect(s.age).toBe(0);
      expect(s.evidence).toEqual([]);
      expect(s.riskFactors).toEqual([]);
      expect(s.currentQuestion).toBeNull();
      expect(s.conditions).toEqual([]);
      expect(s.triageLevel).toBeNull();
      expect(s.shouldStop).toBe(false);
      expect(s.hasEmergency).toBe(false);
      expect(s.history).toEqual([]);
      expect(s.isLoading).toBe(false);
      expect(s.error).toBeNull();
    });
  });

  describe('beginCheckup', () => {
    it('creates a new checkup and sets checkupId and interviewToken', async () => {
      svc.beginCheckup.mockResolvedValue({
        _id: 'chk-1',
        interview_token: 'tok-abc',
      });

      await useHealthCheckupStore.getState().beginCheckup({
        health_check_for: 'self',
        checkup_owner_id: 'user-1',
      });

      const s = useHealthCheckupStore.getState();
      expect(s.checkupId).toBe('chk-1');
      expect(s.interviewToken).toBe('tok-abc');
      expect(s.isLoading).toBe(false);
      expect(s.error).toBeNull();
    });

    it('falls back to result.id if _id is absent', async () => {
      svc.beginCheckup.mockResolvedValue({ id: 'chk-2' });

      await useHealthCheckupStore.getState().beginCheckup({
        health_check_for: 'self',
        checkup_owner_id: 'user-1',
      });

      expect(useHealthCheckupStore.getState().checkupId).toBe('chk-2');
    });

    it('sets error on failure and rethrows', async () => {
      const err = new Error('Network error');
      svc.beginCheckup.mockRejectedValue(err);

      await expect(
        useHealthCheckupStore.getState().beginCheckup({
          health_check_for: 'self',
          checkup_owner_id: 'user-1',
        })
      ).rejects.toThrow('Network error');

      const s = useHealthCheckupStore.getState();
      expect(s.error).toBe('Network error');
      expect(s.isLoading).toBe(false);
    });
  });

  describe('addEvidence', () => {
    it('appends evidence items to existing array', () => {
      useHealthCheckupStore.getState().addEvidence([{ id: 's_1', choice_id: 'present' }]);
      useHealthCheckupStore.getState().addEvidence([{ id: 's_2', choice_id: 'absent' }]);

      expect(useHealthCheckupStore.getState().evidence).toHaveLength(2);
      expect(useHealthCheckupStore.getState().evidence[1]!.id).toBe('s_2');
    });
  });

  describe('setPatientInfo', () => {
    it('sets sex and age', () => {
      useHealthCheckupStore.getState().setPatientInfo('male', 30);
      const s = useHealthCheckupStore.getState();
      expect(s.sex).toBe('male');
      expect(s.age).toBe(30);
    });
  });

  describe('submitDiagnosis', () => {
    it('updates currentQuestion when question is returned', async () => {
      useHealthCheckupStore.setState({
        sex: 'male',
        age: 30,
        evidence: [{ id: 's_1', choice_id: 'present' }],
        interviewToken: 'tok-1',
      });

      svc.diagnosis.mockResolvedValue({
        interview_token: 'tok-2',
        question: { type: 'single', text: 'Do you have fever?' },
        conditions: [],
        should_stop: false,
      });

      await useHealthCheckupStore.getState().submitDiagnosis();

      const s = useHealthCheckupStore.getState();
      expect(s.currentQuestion).toEqual({ type: 'single', text: 'Do you have fever?' });
      expect(s.interviewToken).toBe('tok-2');
      expect(s.shouldStop).toBe(false);
      expect(s.isLoading).toBe(false);
    });

    it('updates conditions and triage when diagnosis completes', async () => {
      useHealthCheckupStore.setState({ sex: 'female', age: 25, evidence: [] });

      svc.diagnosis.mockResolvedValue({
        conditions: [{ id: 'c_1', name: 'Common cold', probability: 0.85 }],
        triage_level: 'consultation',
        has_emergency_evidence: false,
        should_stop: true,
      });

      await useHealthCheckupStore.getState().submitDiagnosis(true);

      const s = useHealthCheckupStore.getState();
      expect(s.conditions).toHaveLength(1);
      expect(s.triageLevel).toBe('consultation');
      expect(s.hasEmergency).toBe(false);
      expect(s.shouldStop).toBe(true);
      expect(s.currentQuestion).toBeNull();
    });

    it('sets error on failure and rethrows', async () => {
      svc.diagnosis.mockRejectedValue(new Error('Diagnosis failed'));

      await expect(useHealthCheckupStore.getState().submitDiagnosis()).rejects.toThrow(
        'Diagnosis failed'
      );

      expect(useHealthCheckupStore.getState().error).toBe('Diagnosis failed');
    });
  });

  describe('fetchHistory', () => {
    it('loads checkup history', async () => {
      svc.getHistory.mockResolvedValue([
        { _id: 'h1', created_at: '2025-01-01' },
        { _id: 'h2', created_at: '2025-01-02' },
      ]);

      await useHealthCheckupStore.getState().fetchHistory({ page: 1, limit: 10 });

      expect(useHealthCheckupStore.getState().history).toHaveLength(2);
      expect(svc.getHistory).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });

    it('handles nested data response', async () => {
      svc.getHistory.mockResolvedValue({ data: [{ _id: 'h1' }] });

      await useHealthCheckupStore.getState().fetchHistory();

      expect(useHealthCheckupStore.getState().history).toHaveLength(1);
    });

    it('sets error on failure', async () => {
      svc.getHistory.mockRejectedValue(new Error('Fetch failed'));

      await useHealthCheckupStore.getState().fetchHistory();

      expect(useHealthCheckupStore.getState().error).toBe('Fetch failed');
    });
  });

  describe('fetchDetail', () => {
    it('loads checkup detail and sets claude summary if present', async () => {
      svc.getById.mockResolvedValue({
        _id: 'd1',
        claude_summary: { content: { overview: 'Test summary' } },
      });

      await useHealthCheckupStore.getState().fetchDetail('d1');

      const s = useHealthCheckupStore.getState();
      expect(s.currentDetail).toBeTruthy();
      expect(s.claudeSummary?.content?.overview).toBe('Test summary');
    });
  });

  describe('fetchRiskFactors', () => {
    it('loads risk factors as array', async () => {
      svc.getRiskFactors.mockResolvedValue([{ id: 'rf_1', name: 'Smoking' }]);

      await useHealthCheckupStore.getState().fetchRiskFactors(30);

      expect(useHealthCheckupStore.getState().riskFactors).toEqual([
        { id: 'rf_1', name: 'Smoking' },
      ]);
    });

    it('extracts from nested object', async () => {
      svc.getRiskFactors.mockResolvedValue({ risk_factors: [{ id: 'rf_2' }] });

      await useHealthCheckupStore.getState().fetchRiskFactors(25);

      expect(useHealthCheckupStore.getState().riskFactors).toEqual([{ id: 'rf_2' }]);
    });
  });

  describe('searchSymptoms', () => {
    it('returns search results array', async () => {
      svc.searchSymptoms.mockResolvedValue([{ id: 's_100', label: 'Headache' }]);

      useHealthCheckupStore.setState({ age: 30, sex: 'male' });
      const results = await useHealthCheckupStore.getState().searchSymptoms('headache');

      expect(results).toEqual([{ id: 's_100', label: 'Headache' }]);
    });

    it('returns empty array on failure', async () => {
      svc.searchSymptoms.mockRejectedValue(new Error('fail'));

      const results = await useHealthCheckupStore.getState().searchSymptoms('xyz');

      expect(results).toEqual([]);
    });
  });

  describe('generateClaudeSummary', () => {
    it('sets claude summary on success', async () => {
      svc.generateClaudeSummary.mockResolvedValue({
        claude_summary: { content: { overview: 'Generated' }, generated_at: '2025-01-01' },
      });

      await useHealthCheckupStore.getState().generateClaudeSummary('chk-1');

      const s = useHealthCheckupStore.getState();
      expect(s.claudeSummary?.content?.overview).toBe('Generated');
      expect(s.summaryLoading).toBe(false);
    });

    it('handles purchase_required response', async () => {
      svc.generateClaudeSummary.mockResolvedValue({
        purchase_required: true,
        message: 'No credits',
      });

      await useHealthCheckupStore.getState().generateClaudeSummary('chk-1');

      expect(useHealthCheckupStore.getState().claudeSummary?.error).toBe('No credits');
    });

    it('sets error and rethrows on failure', async () => {
      svc.generateClaudeSummary.mockRejectedValue(new Error('Server error'));

      await expect(useHealthCheckupStore.getState().generateClaudeSummary('chk-1')).rejects.toThrow(
        'Server error'
      );

      expect(useHealthCheckupStore.getState().summaryLoading).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      useHealthCheckupStore.setState({
        checkupId: 'chk-1',
        evidence: [{ id: 's_1', choice_id: 'present' }],
        history: [{ _id: 'h1' }],
        isLoading: true,
        error: 'some error',
      });

      useHealthCheckupStore.getState().reset();

      const s = useHealthCheckupStore.getState();
      expect(s.checkupId).toBeNull();
      expect(s.evidence).toEqual([]);
      expect(s.history).toEqual([]);
      expect(s.isLoading).toBe(false);
      expect(s.error).toBeNull();
    });
  });
});
