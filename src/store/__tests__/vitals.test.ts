jest.mock('../../services/vitals.service', () => ({
  vitalsService: {
    list: jest.fn(),
    getRecent: jest.fn(),
    getChartData: jest.fn(),
    create: jest.fn(),
  },
}));

import {useVitalsStore} from '../vitals';
import {vitalsService} from '../../services/vitals.service';

const svc = vitalsService as jest.Mocked<typeof vitalsService>;

const initialState = {
  vitalsData: {},
  recentVitals: {},
  chartData: null,
  isLoading: false,
  error: null,
};

describe('useVitalsStore', () => {
  beforeEach(() => {
    useVitalsStore.setState(initialState);
    jest.clearAllMocks();
  });

  describe('fetchVitals', () => {
    it('loads vitals data as object', async () => {
      svc.list.mockResolvedValue({
        blood_pressure: [{value: '120/80', unit: 'mmHg'}],
        pulse_rate: [{value: 72, unit: 'bpm'}],
      });

      await useVitalsStore.getState().fetchVitals();

      const s = useVitalsStore.getState();
      expect(s.vitalsData.blood_pressure).toHaveLength(1);
      expect(s.vitalsData.pulse_rate).toHaveLength(1);
      expect(s.isLoading).toBe(false);
    });

    it('defaults to empty object when null returned', async () => {
      svc.list.mockResolvedValue(null);

      await useVitalsStore.getState().fetchVitals();

      expect(useVitalsStore.getState().vitalsData).toEqual({});
    });

    it('sets error on failure', async () => {
      svc.list.mockRejectedValue(new Error('Server error'));

      await useVitalsStore.getState().fetchVitals();

      expect(useVitalsStore.getState().error).toBe('Server error');
      expect(useVitalsStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchRecentVitals', () => {
    it('loads recent vitals data', async () => {
      svc.getRecent.mockResolvedValue({
        temperature: [{value: 37.2, unit: '°C'}],
      });

      await useVitalsStore.getState().fetchRecentVitals();

      expect(useVitalsStore.getState().recentVitals.temperature).toHaveLength(1);
    });

    it('handles failure silently', async () => {
      svc.getRecent.mockRejectedValue(new Error('fail'));

      await useVitalsStore.getState().fetchRecentVitals();

      // Should not throw and recentVitals stays unchanged
      expect(useVitalsStore.getState().recentVitals).toEqual({});
    });
  });

  describe('fetchChartData', () => {
    it('loads chart data for a specific vital type and period', async () => {
      const chartResult = {
        labels: ['Mon', 'Tue', 'Wed'],
        values: [72, 75, 70],
      };
      svc.getChartData.mockResolvedValue(chartResult);

      await useVitalsStore.getState().fetchChartData({
        vitalToSelect: 'pulse_rate',
        duration: '7d',
      });

      expect(svc.getChartData).toHaveBeenCalledWith({
        vitalToSelect: 'pulse_rate',
        duration: '7d',
      });
      expect(useVitalsStore.getState().chartData).toEqual(chartResult);
      expect(useVitalsStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      svc.getChartData.mockRejectedValue(new Error('Chart error'));

      await useVitalsStore.getState().fetchChartData({
        vitalToSelect: 'blood_pressure',
        duration: '30d',
      });

      expect(useVitalsStore.getState().error).toBe('Chart error');
    });
  });

  describe('logVital', () => {
    it('creates vital and refreshes data', async () => {
      svc.create.mockResolvedValue({_id: 'v-1'});
      svc.list.mockResolvedValue({pulse_rate: [{value: 72}]});
      svc.getRecent.mockResolvedValue({pulse_rate: [{value: 72}]});

      await useVitalsStore.getState().logVital({
        type: 'pulse_rate',
        value: 72,
        unit: 'bpm',
      });

      expect(svc.create).toHaveBeenCalledWith({
        type: 'pulse_rate',
        value: 72,
        unit: 'bpm',
      });
      const s = useVitalsStore.getState();
      expect(s.vitalsData.pulse_rate).toBeTruthy();
      expect(s.recentVitals.pulse_rate).toBeTruthy();
      expect(s.isLoading).toBe(false);
    });

    it('still works when refresh calls fail (uses allSettled)', async () => {
      svc.create.mockResolvedValue({_id: 'v-1'});
      svc.list.mockRejectedValue(new Error('list fail'));
      svc.getRecent.mockRejectedValue(new Error('recent fail'));

      await useVitalsStore.getState().logVital({type: 'temperature', value: 37});

      const s = useVitalsStore.getState();
      expect(s.vitalsData).toEqual({});
      expect(s.recentVitals).toEqual({});
      expect(s.isLoading).toBe(false);
    });

    it('sets error and rethrows on create failure', async () => {
      svc.create.mockRejectedValue(new Error('Create failed'));

      await expect(
        useVitalsStore.getState().logVital({type: 'pulse_rate', value: 72}),
      ).rejects.toThrow('Create failed');

      expect(useVitalsStore.getState().error).toBe('Create failed');
      expect(useVitalsStore.getState().isLoading).toBe(false);
    });
  });
});
