export type VitalKey =
  | 'body_temp'
  | 'body_weight'
  | 'blood_pressure'
  | 'blood_sugar_level'
  | 'pulse_rate'
  | 'spo2'
  | 'respiratory_rate'
  | 'steps'
  | 'sleep'
  | 'calories_burned'
  | 'distance'
  | 'stress_level'
  | 'body_fat'
  | 'active_minutes'
  | 'hydration'
  | 'muscle_mass'
  | 'bone_mass'
  | 'body_water'
  | 'visceral_fat'
  | 'bmr'
  | 'craving_level'
  | 'mood_score'
  | 'anxiety_level'
  | 'motivation_level';

export interface VitalReading {
  value: string;
  unit: string;
  updatedAt: string;
}

export interface VitalRecord {
  _id: string;
  userId: string;
  body_temp?: VitalReading[];
  body_weight?: VitalReading[];
  blood_pressure?: VitalReading[];
  blood_sugar_level?: VitalReading[];
  pulse_rate?: VitalReading[];
  spo2?: VitalReading[];
  respiratory_rate?: VitalReading[];
  steps?: VitalReading[];
  sleep?: VitalReading[];
  calories_burned?: VitalReading[];
  distance?: VitalReading[];
  stress_level?: VitalReading[];
  body_fat?: VitalReading[];
  active_minutes?: VitalReading[];
  hydration?: VitalReading[];
  muscle_mass?: VitalReading[];
  bone_mass?: VitalReading[];
  body_water?: VitalReading[];
  visceral_fat?: VitalReading[];
  bmr?: VitalReading[];
  craving_level?: VitalReading[];
  mood_score?: VitalReading[];
  anxiety_level?: VitalReading[];
  motivation_level?: VitalReading[];
  created_at: string;
  updated_at: string;
}

export type VitalStatus = 'Normal' | 'High' | 'Low' | 'Critical';

export interface VitalTypeConfig {
  key: VitalKey;
  name: string;
  icon: string;
  unit: string;
  normalRange: { min: number; max: number };
  color: string;
}

export interface VitalSubmitPayload {
  vital_type: VitalKey;
  value: string;
  unit: string;
}
