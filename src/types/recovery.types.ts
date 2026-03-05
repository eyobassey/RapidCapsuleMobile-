export type RecoveryStatus = 'active' | 'paused' | 'completed' | 'discharged' | 'withdrawn' | 'archived';
export type CareLevel = 'detox' | 'intensive_outpatient' | 'outpatient' | 'aftercare' | 'maintenance';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type ScreeningRiskLevel = 'low' | 'mild' | 'moderate' | 'high' | 'moderately_severe' | 'severe';
export type ScreeningInstrument = 'audit' | 'dast10' | 'cage' | 'assist' | 'cows' | 'ciwa_ar';

export interface SubstanceHistory {
  substance: string;
  is_primary?: boolean;
  age_of_first_use?: number;
  years_of_use?: number;
  route_of_administration?: string;
  frequency_at_peak?: string;
  last_use_date?: string;
  quantity_at_peak?: string;
  previous_treatment_attempts?: number;
  previous_treatment_types?: string[];
}

export interface RecoveryConsent {
  treatment_consent?: boolean;
  data_sharing_consent?: boolean;
  emergency_contact_consent?: boolean;
  wearable_monitoring_consent?: boolean;
  ai_companion_consent?: boolean;
  research_consent?: boolean;
}

export interface RecoveryProfile {
  _id: string;
  user: string;
  status: RecoveryStatus;
  substance_use_history: SubstanceHistory[];
  sobriety_start_date?: string;
  care_level?: CareLevel;
  current_risk_score: number;
  current_risk_level: RiskLevel;
  consent: RecoveryConsent;
  outcomes: {
    days_in_program: number;
    appointments_attended: number;
    appointments_missed: number;
    journal_entries_count: number;
    companion_sessions_count: number;
    milestones_achieved: number;
    medications_prescribed: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  sobriety_days: number;
  sobriety_streak: number;
  longest_streak: number;
  risk_level: RiskLevel;
  recent_screening?: {
    score: number;
    risk_level: string;
    instrument: string;
    date: string;
  };
  upcoming_milestones: Milestone[];
  daily_log_summary: {
    logged_today: boolean;
    mood_score: number;
    craving_intensity: number;
    sober_today: boolean;
  };
}

export interface SobrietyLog {
  _id: string;
  user: string;
  log_date: string;
  sober_today: boolean;
  mood_score?: number;
  craving_intensity?: number;
  substances_craved?: string[];
  energy_level?: number;
  sleep_quality?: number;
  sleep_hours?: number;
  anxiety_level?: number;
  triggers_encountered?: string[];
  coping_strategies_used?: string[];
  medications_taken?: boolean;
  attended_meeting_or_session?: boolean;
  exercised?: boolean;
  gratitude_note?: string;
  notes?: string;
  relapse_details?: {
    substance?: string;
    amount?: string;
    trigger?: string;
    location?: string;
    was_planned?: boolean;
    sought_help_after?: boolean;
    notes?: string;
  };
  created_at: string;
}

export interface SobrietyStats {
  current_streak: number;
  longest_streak: number;
  total_sober_days: number;
  total_relapse_count: number;
  average_mood_score: number;
  average_craving_intensity: number;
  percent_sober_days: number;
}

export interface ScreeningQuestion {
  id: string;
  text: string;
  type: 'single' | 'group_single' | 'group_multiple';
  options: Array<{value: number; label: string; description?: string}>;
}

export interface ScreeningResult {
  _id: string;
  user: string;
  instrument: ScreeningInstrument;
  screening_type: string;
  answers: Record<string, number>;
  total_score: number;
  subscale_scores?: Record<string, number>;
  risk_level: ScreeningRiskLevel;
  risk_zone_label: string;
  substances_identified: string[];
  is_baseline: boolean;
  ai_interpretation?: {
    generated_at: string;
    model: string;
    content: {
      summary: string;
      risk_assessment: string;
      recommended_interventions: string[];
      recommended_specialist_type: string;
      urgency: string;
      brief_intervention_notes: string;
      motivational_message: string;
      comparison_to_previous: string;
    };
  };
  created_at: string;
}

export interface Milestone {
  _id: string;
  milestone_type: string;
  milestone_name: string;
  description?: string;
  milestone_value: number;
  achieved_at: string;
  celebrated: boolean;
  reward_points: number;
  shared_with_care_team: boolean;
  celebration_message?: string;
}

export interface CompanionSession {
  session_id: string;
  greeting?: string;
  patient_context?: {
    sobriety_days: number;
    risk_level: string;
  };
}

export interface CompanionMessage {
  user_message: string;
  ai_response: string;
  timestamp: string;
  conversation_analysis?: {
    crisis_detected: boolean;
    escalation_suggested: boolean;
  };
}
