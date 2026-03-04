export enum AppointmentStatus {
  COMPLETED = 'COMPLETED',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  ONGOING = 'ONGOING',
  RESCHEDULED = 'RESCHEDULED',
  MISSED = 'MISSED',
}

export enum MeetingChannel {
  ZOOM = 'zoom',
  GOOGLE_MEET = 'google_meet',
  MICROSOFT_TEAMS = 'microsoft_teams',
  WHATSAPP = 'whatsapp',
  PHONE = 'phone',
  IN_PERSON = 'in_person',
}

export enum MeetingType {
  AUDIO = 'Audio only',
  VIDEO_AUDIO = 'Video and audio',
}

export enum PaymentStatus {
  SUCCESSFUL = 'SUCCESSFUL',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}

export enum AppointmentUrgency {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  CRISIS = 'crisis',
}

export enum SessionType {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
  CRISIS = 'crisis',
  PEER_CHECK_IN = 'peer_check_in',
  FAMILY = 'family',
}

export interface SpecialistProfile {
  category?: string;
  area_of_specialty?: string;
  license_number?: string;
  years_of_practice?: string;
  university?: {
    name?: string;
    start_year?: string;
    end_year?: string;
  };
}

export interface Specialist {
  _id: string;
  profile: {
    first_name: string;
    last_name: string;
    profile_photo?: string;
    contact?: {
      email?: string;
      phone?: { country_code?: string; number?: string };
    };
  };
  user_type: 'Specialist';
  professional_practice?: SpecialistProfile;
  specialist_categories?: string[];
  average_rating?: number;
  verification_status?: string;
  full_name?: string;
}

export interface AppointmentRating {
  score: number;
  review?: string;
  rated_at?: string;
}

export interface SharedDocument {
  name: string;
  url: string;
  type: string;
  size: string;
  shared_by: 'specialist' | 'patient';
  uploaded_at: string;
}

export interface Appointment {
  _id: string;
  category: string;
  start_time: string;
  timezone?: string;
  appointment_type: string;
  urgency: AppointmentUrgency;
  duration_minutes?: number;
  patient: string | Record<string, any>;
  specialist: string | Specialist;
  status: AppointmentStatus;
  meeting_type: MeetingType;
  meeting_channel: MeetingChannel;
  join_url?: string;
  start_url?: string;
  meeting_id?: string;
  meeting_password?: string;
  appointment_fee?: number;
  platform_fee?: number;
  total_amount?: number;
  payment_status: PaymentStatus;
  payment_source?: 'specialist_wallet' | 'patient_wallet' | 'card';
  patient_notes?: string;
  private_notes?: string;
  notes?: string[];
  shared_documents?: SharedDocument[];
  rating?: AppointmentRating;
  call_duration?: {
    time_taken: number;
    unit: string;
    formatted_string?: string;
  };
  session_type?: SessionType;
  clinical_flags?: string[];
  rescheduled_at?: string;
  reschedule_reason?: string;
  health_checkup_id?: string;
  escrow?: {
    status: 'none' | 'held' | 'refunded' | 'settled';
    hold_batch_id?: string;
    settlement_batch_id?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BookingPayload {
  specialist: string;
  category: string;
  appointment_type: string;
  start_time: string;
  timezone?: string;
  meeting_type?: MeetingType;
  meeting_channel?: MeetingChannel;
  patient_notes?: string;
  urgency?: AppointmentUrgency;
  payment_source?: 'patient_wallet' | 'card';
  health_checkup_id?: string;
}

export interface ReschedulePayload {
  start_time: string;
  reschedule_reason?: string;
}
