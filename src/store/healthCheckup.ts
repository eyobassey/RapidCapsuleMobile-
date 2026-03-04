import {create} from 'zustand';
import {healthCheckupService, Evidence} from '../services/healthCheckup.service';

interface ClaudeSummaryContent {
  overview: string;
  key_findings: string[];
  possible_conditions_explained: Array<{
    condition: string;
    explanation: string;
    urgency: string;
  }>;
  recommendations: string[];
  when_to_seek_care: string;
  lifestyle_tips?: string[];
}

interface ClaudeSummary {
  generated_at?: string;
  model?: string;
  content?: ClaudeSummaryContent;
  error?: string;
}

interface SummaryCredits {
  available: boolean;
  remaining_credits?: number;
  has_unlimited?: boolean;
}

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

  // AI Summary
  claudeSummary: ClaudeSummary | null;
  summaryLoading: boolean;
  summaryCredits: SummaryCredits | null;

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
  fetchClaudeSummary: (checkupId: string) => Promise<void>;
  generateClaudeSummary: (checkupId: string) => Promise<void>;
  fetchSummaryStatus: () => Promise<void>;
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
  claudeSummary: null,
  summaryLoading: false,
  summaryCredits: null,
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
      const updates: any = {currentDetail: data, isLoading: false};
      // If the detail already has a claude_summary embedded, use it
      if (data?.claude_summary?.content) {
        updates.claudeSummary = data.claude_summary;
      }
      set(updates);
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

  fetchSummaryStatus: async () => {
    try {
      const data = await healthCheckupService.getClaudeSummaryStatus();
      set({summaryCredits: data});
    } catch {
      // Silently fail - credits check is non-critical
    }
  },

  fetchClaudeSummary: async (checkupId: string) => {
    // Don't clear existing summary (may have been set from fetchDetail)
    const existing = get().claudeSummary;
    if (!existing?.content) {
      set({summaryLoading: true});
    }
    try {
      const data = await healthCheckupService.getClaudeSummary(checkupId);
      if (data?.content) {
        set({claudeSummary: data, summaryLoading: false});
      } else {
        set({summaryLoading: false});
      }
    } catch {
      set({summaryLoading: false});
    }
  },

  generateClaudeSummary: async (checkupId: string) => {
    set({summaryLoading: true});
    try {
      const data = await healthCheckupService.generateClaudeSummary(checkupId);
      set({claudeSummary: data, summaryLoading: false});
    } catch (err: any) {
      set({
        summaryLoading: false,
        error: err?.response?.data?.message || 'Failed to generate AI summary',
      });
      throw err;
    }
  },

  reset: () => {
    set(initialState);
  },
}));
