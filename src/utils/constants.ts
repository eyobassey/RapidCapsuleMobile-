import type { VitalTypeConfig } from '../types/vital.types';

export const VITAL_TYPES: VitalTypeConfig[] = [
  {
    key: 'blood_pressure',
    name: 'Blood Pressure',
    icon: 'Heart',
    unit: 'mmHg',
    normalRange: { min: 90, max: 140 },
    color: '#EF4444',
  },
  {
    key: 'pulse_rate',
    name: 'Heart Rate',
    icon: 'HeartPulse',
    unit: 'bpm',
    normalRange: { min: 60, max: 100 },
    color: '#F97316',
  },
  {
    key: 'body_temp',
    name: 'Temperature',
    icon: 'Thermometer',
    unit: '\u00B0C',
    normalRange: { min: 36.1, max: 37.2 },
    color: '#EAB308',
  },
  {
    key: 'blood_sugar_level',
    name: 'Blood Sugar',
    icon: 'Droplets',
    unit: 'mg/dL',
    normalRange: { min: 70, max: 140 },
    color: '#8B5CF6',
  },
  {
    key: 'spo2',
    name: 'Oxygen Saturation',
    icon: 'Wind',
    unit: '%',
    normalRange: { min: 95, max: 100 },
    color: '#3B82F6',
  },
  {
    key: 'respiratory_rate',
    name: 'Respiratory Rate',
    icon: 'Activity',
    unit: 'breaths/min',
    normalRange: { min: 12, max: 20 },
    color: '#06B6D4',
  },
  {
    key: 'body_weight',
    name: 'Weight',
    icon: 'Scale',
    unit: 'kg',
    normalRange: { min: 40, max: 120 },
    color: '#10B981',
  },
  {
    key: 'steps',
    name: 'Steps',
    icon: 'Footprints',
    unit: 'steps',
    normalRange: { min: 0, max: 15000 },
    color: '#14B8A6',
  },
  {
    key: 'sleep',
    name: 'Sleep',
    icon: 'Moon',
    unit: 'hours',
    normalRange: { min: 7, max: 9 },
    color: '#6366F1',
  },
  {
    key: 'calories_burned',
    name: 'Calories Burned',
    icon: 'Flame',
    unit: 'kcal',
    normalRange: { min: 0, max: 3000 },
    color: '#F59E0B',
  },
  {
    key: 'stress_level',
    name: 'Stress Level',
    icon: 'Brain',
    unit: '/10',
    normalRange: { min: 0, max: 5 },
    color: '#EC4899',
  },
  {
    key: 'body_fat',
    name: 'Body Fat',
    icon: 'Percent',
    unit: '%',
    normalRange: { min: 10, max: 30 },
    color: '#84CC16',
  },
  {
    key: 'hydration',
    name: 'Hydration',
    icon: 'GlassWater',
    unit: 'mL',
    normalRange: { min: 2000, max: 3500 },
    color: '#0EA5E9',
  },
  {
    key: 'mood_score',
    name: 'Mood',
    icon: 'Smile',
    unit: '/10',
    normalRange: { min: 5, max: 10 },
    color: '#F472B6',
  },
  {
    key: 'anxiety_level',
    name: 'Anxiety',
    icon: 'HeartCrack',
    unit: '/10',
    normalRange: { min: 0, max: 4 },
    color: '#FB923C',
  },
  {
    key: 'craving_level',
    name: 'Cravings',
    icon: 'Flame',
    unit: '/10',
    normalRange: { min: 0, max: 3 },
    color: '#F87171',
  },
  {
    key: 'motivation_level',
    name: 'Energy / Motivation',
    icon: 'Zap',
    unit: '/10',
    normalRange: { min: 5, max: 10 },
    color: '#FBBF24',
  },
  {
    key: 'bmr',
    name: 'Basal Metabolic Rate',
    icon: 'Gauge',
    unit: 'kcal/day',
    normalRange: { min: 1200, max: 2400 },
    color: '#A855F7',
  },
];

export const APPOINTMENT_STATUS = {
  COMPLETED: 'COMPLETED',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
  ONGOING: 'ONGOING',
  RESCHEDULED: 'RESCHEDULED',
  MISSED: 'MISSED',
} as const;

export const PRESCRIPTION_STATUS = {
  DRAFT: 'draft',
  PENDING_ACCEPTANCE: 'pending_acceptance',
  ACCEPTED: 'accepted',
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  PROCESSING: 'processing',
  DISPENSED: 'dispensed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export const STATUS_COLORS: Record<string, string> = {
  // Appointment statuses
  OPEN: 'secondary',
  ONGOING: 'primary',
  COMPLETED: 'success',
  CLOSED: 'muted',
  CANCELLED: 'destructive',
  FAILED: 'destructive',
  RESCHEDULED: 'warning',
  MISSED: 'destructive',

  // Payment statuses
  SUCCESSFUL: 'success',
  PENDING: 'secondary',

  // Prescription statuses
  draft: 'muted',
  pending_acceptance: 'secondary',
  accepted: 'primary',
  pending_payment: 'warning',
  paid: 'success',
  processing: 'primary',
  dispensed: 'success',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'destructive',
  expired: 'muted',

  // Vital statuses
  Normal: 'success',
  High: 'warning',
  Low: 'warning',
  Critical: 'destructive',

  // Pharmacy order statuses
  CONFIRMED: 'primary',
  PROCESSING: 'primary',
  READY_FOR_PICKUP: 'accent',
  OUT_FOR_DELIVERY: 'primary',
  DELIVERED: 'success',
  REFUNDED: 'muted',

  // Prescription verification statuses
  TIER1_PROCESSING: 'primary',
  TIER1_PASSED: 'success',
  TIER1_FAILED: 'destructive',
  TIER2_PROCESSING: 'primary',
  TIER2_PASSED: 'success',
  TIER2_FAILED: 'destructive',
  PHARMACIST_REVIEW: 'warning',
  CLARIFICATION_NEEDED: 'warning',
  CLARIFICATION_RECEIVED: 'primary',
  APPROVED: 'success',
  REJECTED: 'destructive',
  EXPIRED: 'muted',
};

export const NOTIFICATION_ICONS: Record<string, string> = {
  appointment_booked: 'CalendarPlus',
  appointment_confirmed: 'CalendarCheck',
  appointment_reminder: 'Bell',
  appointment_cancelled: 'CalendarX',
  appointment_rescheduled: 'CalendarClock',
  appointment_completed: 'CheckCircle',
  appointment_missed: 'AlertCircle',
  appointment_started: 'Video',

  prescription_created: 'FileText',
  prescription_ready: 'Package',
  prescription_payment_required: 'CreditCard',
  prescription_shipped: 'Truck',
  prescription_delivered: 'PackageCheck',

  pharmacy_order_placed: 'ShoppingBag',
  pharmacy_order_confirmed: 'CheckCircle',
  pharmacy_order_processing: 'Loader',
  pharmacy_order_shipped: 'Truck',
  pharmacy_order_delivered: 'PackageCheck',
  pharmacy_order_cancelled: 'XCircle',

  payment_received: 'Wallet',
  payment_failed: 'AlertTriangle',
  wallet_credited: 'ArrowDownLeft',
  wallet_debited: 'ArrowUpRight',
  refund_processed: 'RotateCcw',

  health_checkup_complete: 'Stethoscope',
  health_score_updated: 'TrendingUp',
  vitals_alert: 'AlertTriangle',
  vitals_reminder: 'Clock',

  account_verified: 'ShieldCheck',
  profile_update_required: 'UserCog',
  system_maintenance: 'Settings',
  promotional: 'Megaphone',
  welcome: 'PartyPopper',

  review_received: 'Star',

  recovery_risk_moderate: 'AlertTriangle',
  recovery_risk_high: 'AlertOctagon',
  recovery_risk_critical: 'Siren',
  recovery_risk_improved: 'TrendingDown',
  recovery_check_in_reminder: 'ClipboardCheck',
  recovery_milestone_achieved: 'Trophy',
};

export const MEETING_CHANNEL_LABELS: Record<string, string> = {
  zoom: 'Zoom',
  google_meet: 'Google Meet',
  microsoft_teams: 'Microsoft Teams',
  whatsapp: 'WhatsApp',
  phone: 'Phone Call',
  in_person: 'In Person',
};

export const DEFAULT_PHARMACY_ID = '693f961ebb4dc1fec542610a';

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

// Delivery flow sequence (used for timeline)
export const ORDER_STATUS_SEQUENCE_DELIVERY = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

// Pickup flow sequence (used for timeline)
export const ORDER_STATUS_SEQUENCE_PICKUP = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY_FOR_PICKUP',
  'COMPLETED',
] as const;
