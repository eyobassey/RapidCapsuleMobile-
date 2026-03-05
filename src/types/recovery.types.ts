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
  risk_score: number;
  days_in_program: number;
  recent_screening?: {
    score: number;
    risk_level: string;
    instrument: string;
    date: string;
  };
  upcoming_milestones: Milestone[];
  milestones_total: number;
  next_milestone?: {type: string; name: string; value: number; points: number; message: string};
  daily_log_summary: {
    logged_today: boolean;
    mood_score: number;
    craving_intensity: number;
    sober_today: boolean;
  };
  mood_trend: Array<{date: string; mood_score: number; craving_intensity: number}>;
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

// ─── Recovery Plans ─────────────────────────────
export interface PlanGoal {
  _id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
}

export interface PlanStage {
  _id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  estimated_weeks?: number;
  goals: PlanGoal[];
}

export interface RecoveryPlan {
  _id: string;
  patient: string;
  specialist?: string;
  title?: string;
  status: 'draft' | 'active' | 'completed' | 'abandoned';
  stages: PlanStage[];
  progress_percentage: number;
  review_date?: string;
  created_at: string;
  updated_at: string;
}

// ─── Exercises ──────────────────────────────────
export interface ExerciseRecord {
  _id: string;
  category: string;
  name: string;
  duration_minutes: number;
  completed_at: string;
  effectiveness_rating?: number;
  ai_summary?: string;
}

export interface ExerciseStats {
  total_sessions: number;
  total_minutes: number;
  wellness_score: number;
  wellness_level?: string;
  streak: number;
  completion_rate: number;
  by_category: Record<string, number>;
  exercises_last_14_days: number;
  unique_categories: number;
}

// ─── Risk Reports ───────────────────────────────
export interface RiskReport {
  _id: string;
  risk_score: number;
  risk_level: RiskLevel;
  factors?: string[];
  signals?: Array<{name: string; weight: number; value: any}>;
  created_at: string;
}

// ─── Group Sessions ─────────────────────────────
export interface GroupSession {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  facilitator?: {_id: string; profile?: {first_name: string; last_name: string}};
  schedule?: {day_of_week?: string; time?: string; recurring?: boolean};
  max_members: number;
  current_members: number;
  members?: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
}

// ─── Peer Support ───────────────────────────────
export interface PeerCheckIn {
  _id: string;
  mood?: number;
  notes?: string;
  created_at: string;
}

export interface PeerAssignment {
  _id: string;
  peer: {_id: string; profile?: {first_name: string; last_name: string}};
  supporter: {_id: string; profile?: {first_name: string; last_name: string}};
  match_score?: number;
  shared_substance?: string;
  gender_match?: boolean;
  age_proximity?: number;
  status: 'pending' | 'active' | 'ended';
  check_ins?: PeerCheckIn[];
  created_at: string;
}

// ─── MAT (Medication-Assisted Treatment) ────────
export interface MATMedication {
  _id: string;
  drug: {_id: string; name: string; strength?: string};
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  condition?: string;
}

export interface MATCompliance {
  compliance_level: 'excellent' | 'good' | 'fair' | 'poor';
  check_in_rate: number;
  screening_completion: number;
  medications: MATMedication[];
}

// ─── Harm Reduction ─────────────────────────────
export interface HarmReductionSubstance {
  substance: string;
  display_name?: string;
  icon?: string;
  category?: string;
}

export interface SubstanceGuidance {
  substance: string;
  display_name?: string;
  safer_use_tips: string[];
  overdose_signs: string[];
  overdose_response?: string[];
  mixing_dangers?: Array<{substance: string; risk: string}>;
  withdrawal_warnings?: string[];
  long_term_risks?: string[];
  recovery_position?: string;
  fentanyl_risk?: string;
}

// ─── Companion Sessions ─────────────────────────
export interface CompanionSessionSummary {
  session_id: string;
  context?: string;
  started_at: string;
  ended_at?: string;
  message_count?: number;
}
