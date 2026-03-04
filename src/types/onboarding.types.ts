// ─── Section keys ───────────────────────────────────────────────
export type OnboardingSection =
  | 'personalDetails'
  | 'addressEmergency'
  | 'dependants'
  | 'vitalsMetrics'
  | 'allergies'
  | 'medicalHistory'
  | 'deviceIntegration'
  | 'walletCredits';

export type SectionStatus = 'not_started' | 'complete';

// ─── Step config for dashboard rendering ────────────────────────
export interface OnboardingStepConfig {
  key: OnboardingSection;
  title: string;
  subtitle: string;
  icon: string; // lucide icon name
  weight: number; // percentage weight for progress
  required: boolean;
  route: string; // screen name in OnboardingStack
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    key: 'personalDetails',
    title: 'Personal Details',
    subtitle: 'Name, date of birth, gender, phone',
    icon: 'User',
    weight: 18,
    required: true,
    route: 'PersonalDetails',
  },
  {
    key: 'addressEmergency',
    title: 'Address & Emergency',
    subtitle: 'Home address, emergency contacts',
    icon: 'MapPin',
    weight: 18,
    required: true,
    route: 'AddressEmergency',
  },
  {
    key: 'dependants',
    title: 'Dependants',
    subtitle: 'Family members & dependants',
    icon: 'Users',
    weight: 10,
    required: false,
    route: 'Dependants',
  },
  {
    key: 'vitalsMetrics',
    title: 'Vitals & Health Metrics',
    subtitle: 'Height, weight, blood type, genotype',
    icon: 'Activity',
    weight: 14,
    required: false,
    route: 'VitalsMetrics',
  },
  {
    key: 'allergies',
    title: 'Allergies',
    subtitle: 'Drug, food & environmental allergies',
    icon: 'AlertTriangle',
    weight: 10,
    required: false,
    route: 'Allergies',
  },
  {
    key: 'medicalHistory',
    title: 'Medical History',
    subtitle: 'Conditions, surgeries, medications',
    icon: 'Stethoscope',
    weight: 14,
    required: false,
    route: 'MedicalHistory',
  },
  {
    key: 'deviceIntegration',
    title: 'Devices & Health Apps',
    subtitle: 'Connected devices & data sharing',
    icon: 'Smartphone',
    weight: 8,
    required: false,
    route: 'DeviceIntegration',
  },
  {
    key: 'walletCredits',
    title: 'Wallet & AI Credits',
    subtitle: 'Fund wallet, view AI credits',
    icon: 'Wallet',
    weight: 8,
    required: false,
    route: 'WalletCredits',
  },
];

// ─── Data interfaces matching backend schema ────────────────────

export interface EmergencyContact {
  first_name: string;
  last_name: string;
  relationship: string;
  phone: {country_code: string; number: string};
  email?: string;
  address1?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
}

export interface Dependant {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  relationship: string;
  gender: string;
  blood_type?: string;
  genotype?: string;
}

export interface AllergyItem {
  drug_name?: string;
  food_name?: string;
  allergen?: string;
  reaction: string;
  severity: string; // 'mild' | 'moderate' | 'severe'
}

export interface AllergiesData {
  has_allergies: boolean | null;
  drug_allergies: AllergyItem[];
  food_allergies: AllergyItem[];
  environmental_allergies: AllergyItem[];
  other_allergies: AllergyItem[];
}

export interface MedicalHistoryData {
  chronic_conditions: string[];
  past_surgeries: {procedure: string; year: string; notes?: string}[];
  current_medications: {name: string; dosage?: string; frequency?: string; reason?: string}[];
  family_history: {condition: string; relation: string}[];
  lifestyle: {
    smoking: string;
    alcohol: string;
    exercise: string;
    diet: string;
  };
}

export interface DeviceIntegrationData {
  health_apps_connected: string[];
  devices_connected: string[];
  data_sharing_consents: {
    vitals_auto_sync: boolean;
    activity_tracking: boolean;
    sleep_tracking: boolean;
  };
  notification_preferences: {
    health_reminders: boolean;
    medication_reminders: boolean;
    wellness_tips: boolean;
  };
}

export interface DeliveryAddress {
  label?: string;
  recipient_name?: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  additional_info?: string;
  is_default?: boolean;
}

// Section weights for quick lookup
export const SECTION_WEIGHTS: Record<OnboardingSection, number> = {
  personalDetails: 18,
  addressEmergency: 18,
  dependants: 10,
  vitalsMetrics: 14,
  allergies: 10,
  medicalHistory: 14,
  deviceIntegration: 8,
  walletCredits: 8,
};
