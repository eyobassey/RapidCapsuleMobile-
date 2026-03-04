import {create} from 'zustand';
import {createMMKV} from 'react-native-mmkv';
import {SECTION_WEIGHTS, type OnboardingSection} from '../types/onboarding.types';

let mmkv: ReturnType<typeof createMMKV>;
function getMMKV() {
  if (!mmkv) mmkv = createMMKV({id: 'rc-onboarding'});
  return mmkv;
}
const DRAFT_PREFIX = 'onboarding_draft_';

interface OnboardingState {
  completedSections: Record<OnboardingSection, boolean>;
  progress: number;

  // Derived summary data shown on dashboard cards
  summaryData: Record<string, any>;

  // Actions
  refreshFromUser: (user: any) => void;
  computeProgress: () => number;
  markComplete: (section: OnboardingSection) => void;
  saveDraft: (section: string, data: any) => void;
  loadDraft: (section: string) => any;
  clearDraft: (section: string) => void;
  reset: () => void;
}

const defaultCompletion: Record<OnboardingSection, boolean> = {
  personalDetails: false,
  addressEmergency: false,
  dependants: false,
  vitalsMetrics: false,
  allergies: false,
  medicalHistory: false,
  deviceIntegration: false,
  walletCredits: false,
};

function computeProgressFromSections(
  completed: Record<OnboardingSection, boolean>,
): number {
  let earned = 0;
  let total = 0;
  for (const [key, weight] of Object.entries(SECTION_WEIGHTS)) {
    total += weight;
    if (completed[key as OnboardingSection]) earned += weight;
  }
  return total > 0 ? Math.round((earned / total) * 100) : 0;
}

/**
 * Derive which sections are complete from the user object returned by GET /users/me.
 * Mirrors the web's deriveCompletionFromProfile() logic.
 */
function deriveCompletion(user: any): {
  completed: Record<OnboardingSection, boolean>;
  summaryData: Record<string, any>;
} {
  const completed = {...defaultCompletion};
  const summary: Record<string, any> = {};
  if (!user) return {completed, summaryData: summary};

  const profile = user.profile || {};

  // ── Personal Details ──
  if (profile.first_name && profile.last_name && profile.date_of_birth) {
    completed.personalDetails = true;
    summary.personalDetails = {
      name: `${profile.first_name} ${profile.last_name}`,
      gender: profile.gender || '',
    };
  }

  // ── Address & Emergency ──
  const contacts = user.emergency_contacts;
  if (contacts && contacts.length > 0) {
    completed.addressEmergency = true;
    const primary = contacts[0];
    const contactName =
      primary.name ||
      [primary.first_name, primary.last_name].filter(Boolean).join(' ') ||
      '';
    summary.addressEmergency = {
      contactName,
      contactCount: contacts.length,
    };
  }

  // ── Dependants ──
  if (user.dependants && user.dependants.length > 0) {
    completed.dependants = true;
    summary.dependants = {count: user.dependants.length};
  }

  // ── Vitals & Metrics ──
  const height = profile.height?.value || profile.basic_health_info?.height?.value;
  const weight = profile.weight?.value || profile.basic_health_info?.weight?.value;
  if (height || weight) {
    completed.vitalsMetrics = true;
    let bmi: string | null = null;
    if (height && weight) {
      const hm = parseFloat(height) / 100;
      bmi = (parseFloat(weight) / (hm * hm)).toFixed(1);
    }
    summary.vitalsMetrics = {
      height: height ? `${height} cm` : null,
      weight: weight ? `${weight} kg` : null,
      bmi,
      bloodType: profile.blood_type || '',
      genotype: profile.genotype || '',
    };
  }

  // ── Allergies ──
  const allergies = user.allergies;
  if (
    allergies &&
    (allergies.has_allergies !== undefined ||
      allergies.drug_allergies?.length ||
      allergies.food_allergies?.length ||
      allergies.environmental_allergies?.length ||
      allergies.other_allergies?.length)
  ) {
    completed.allergies = true;
    const totalCount =
      (allergies.drug_allergies?.length || 0) +
      (allergies.food_allergies?.length || 0) +
      (allergies.environmental_allergies?.length || 0) +
      (allergies.other_allergies?.length || 0);
    summary.allergies = {
      hasAllergies: allergies.has_allergies,
      count: totalCount,
    };
  }

  // ── Medical History ──
  const medHistory = user.medical_history || profile.medical_history;
  const preExisting = user.pre_existing_conditions;
  if (medHistory) {
    const hasSomething =
      medHistory.chronic_conditions?.length ||
      medHistory.past_surgeries?.length ||
      medHistory.current_medications?.length ||
      medHistory.family_history?.length ||
      medHistory.immunizations?.length;
    if (hasSomething) {
      completed.medicalHistory = true;
      summary.medicalHistory = {
        conditions: medHistory.chronic_conditions?.length || 0,
        medications: medHistory.current_medications?.length || 0,
        surgeries: medHistory.past_surgeries?.length || 0,
      };
    }
  }
  if (preExisting && preExisting.length > 0) {
    completed.medicalHistory = true;
    summary.medicalHistory = {
      ...summary.medicalHistory,
      preExisting: preExisting.length,
    };
  }

  // ── Device Integration ──
  const deviceInt = user.device_integration;
  if (
    deviceInt?.health_apps_connected?.length > 0 ||
    deviceInt?.devices_connected?.length > 0
  ) {
    completed.deviceIntegration = true;
    summary.deviceIntegration = {
      apps: deviceInt.health_apps_connected?.length || 0,
      devices: deviceInt.devices_connected?.length || 0,
    };
  }

  // ── Wallet & Credits ──
  // Wallet data is NOT on the user object — it comes from GET /wallets/balance
  // and GET /claude-summary/credits. We mark this as complete if the user
  // has viewed the section (tracked via onboarding_completed or patient_preferences),
  // or we check asynchronously. For now, mark complete if user has a preferred_currency
  // set (indicates they've interacted with wallet) or if explicitly marked.
  if (user.preferred_currency || user.onboarding_completed) {
    completed.walletCredits = true;
    summary.walletCredits = {
      currency: user.preferred_currency || 'NGN',
    };
  }

  return {completed, summaryData: summary};
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  completedSections: {...defaultCompletion},
  progress: 0,
  summaryData: {},

  refreshFromUser: (user: any) => {
    const {completed, summaryData} = deriveCompletion(user);
    const progress = computeProgressFromSections(completed);
    set({completedSections: completed, progress, summaryData});
  },

  computeProgress: () => {
    return computeProgressFromSections(get().completedSections);
  },

  markComplete: (section: OnboardingSection) => {
    const updated = {...get().completedSections, [section]: true};
    const progress = computeProgressFromSections(updated);
    set({completedSections: updated, progress});
  },

  saveDraft: (section: string, data: any) => {
    try {
      getMMKV().set(`${DRAFT_PREFIX}${section}`, JSON.stringify(data));
    } catch {}
  },

  loadDraft: (section: string) => {
    try {
      const raw = getMMKV().getString(`${DRAFT_PREFIX}${section}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearDraft: (section: string) => {
    try {
      getMMKV().remove(`${DRAFT_PREFIX}${section}`);
    } catch {}
  },

  reset: () => {
    set({
      completedSections: {...defaultCompletion},
      progress: 0,
      summaryData: {},
    });
    // Clear all drafts
    for (const key of Object.keys(defaultCompletion)) {
      try {
        getMMKV().remove(`${DRAFT_PREFIX}${key}`);
      } catch {}
    }
  },
}));
