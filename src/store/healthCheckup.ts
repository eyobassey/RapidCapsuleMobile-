import {create} from 'zustand';
import {healthCheckupService, Evidence} from '../services/healthCheckup.service';

interface HealthCheckupState {
  // Session state
  checkupId: string | null;
  interviewToken: string | null;
  sex: string;
  age: number;
  evidence: Evidence[];
  riskFactors: any[];
  currentQuestion: any | null;
  conditions: any[];
  triageLevel: string | null;
  shouldStop: boolean;
  hasEmergency: boolean;

  // History
  history: any[];
  currentDetail: any | null;

  // UI
  isLoading: boolean;
  error: string | null;

  // Actions
  beginCheckup: (data: {health_check_for: string; checkup_owner_id: string}) => Promise<void>;
  fetchRiskFactors: (age: number) => Promise<void>;
  searchSymptoms: (phrase: string) => Promise<any[]>;
  addEvidence: (items: Evidence[]) => void;
  submitDiagnosis: (shouldStop?: boolean) => Promise<void>;
  fetchHistory: (params?: {page?: number; limit?: number}) => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  setPatientInfo: (sex: string, age: number) => void;
  reset: () => void;
}

const initialState = {
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
  isLoading: false,
  error: null,
};

export const useHealthCheckupStore = create<HealthCheckupState>((set, get) => ({
  ...initialState,

  beginCheckup: async (data) => {
    set({isLoading: true, error: null});
    try {
      const result = await healthCheckupService.beginCheckup(data);
      set({
        checkupId: result?._id || result?.id,
        interviewToken: result?.interview_token,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to start checkup',
        isLoading: false,
      });
      throw err;
    }
  },

  fetchRiskFactors: async (age: number) => {
    set({isLoading: true, error: null});
    try {
      const data = await healthCheckupService.getRiskFactors(age, get().interviewToken || undefined);
      const factors = Array.isArray(data) ? data : data?.risk_factors || data?.data || [];
      set({riskFactors: factors, isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch risk factors',
        isLoading: false,
      });
    }
  },

  searchSymptoms: async (phrase: string) => {
    try {
      const data = await healthCheckupService.searchSymptoms({
        phrase,
        age: get().age,
        sex: get().sex || undefined,
        max_results: 10,
      });
      return Array.isArray(data) ? data : data?.results || data?.data || [];
    } catch {
      return [];
    }
  },

  addEvidence: (items: Evidence[]) => {
    set(state => ({
      evidence: [...state.evidence, ...items],
    }));
  },

  submitDiagnosis: async (shouldStop = false) => {
    set({isLoading: true, error: null});
    try {
      const {sex, age, evidence, interviewToken} = get();
      const result = await healthCheckupService.diagnosis({
        sex: sex || undefined,
        age: {value: age},
        evidence,
        should_stop: shouldStop,
        interview_token: interviewToken || undefined,
        extras: {enable_symptom_duration: false},
      });

      const updates: Partial<HealthCheckupState> = {isLoading: false};

      // Update interview token if returned
      if (result?.interview_token) {
        updates.interviewToken = result.interview_token;
      }

      // Check if we got a question (continue interview) or conditions (done)
      if (result?.question) {
        updates.currentQuestion = result.question;
        updates.shouldStop = false;
      }

      if (result?.conditions && result.conditions.length > 0) {
        updates.conditions = result.conditions;
        updates.triageLevel = result.triage_level || null;
        updates.hasEmergency = result.has_emergency_evidence || false;
      }

      if (result?.should_stop) {
        updates.shouldStop = true;
        updates.currentQuestion = null;
      }

      set(updates as any);
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to process diagnosis',
        isLoading: false,
      });
      throw err;
    }
  },

  fetchHistory: async (params) => {
    set({isLoading: true, error: null});
    try {
      const data = await healthCheckupService.getHistory(params);
      const list = Array.isArray(data) ? data : data?.data || data?.checkups || [];
      set({history: Array.isArray(list) ? list : [], isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch history',
        isLoading: false,
      });
    }
  },

  fetchDetail: async (id: string) => {
    set({isLoading: true, error: null});
    try {
      const data = await healthCheckupService.getById(id);
      set({currentDetail: data, isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch checkup detail',
        isLoading: false,
      });
    }
  },

  setPatientInfo: (sex: string, age: number) => {
    set({sex, age});
  },

  reset: () => {
    set(initialState);
  },
}));
