export enum NotificationType {
  APPOINTMENT_BOOKED = 'appointment_booked',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  APPOINTMENT_COMPLETED = 'appointment_completed',
  APPOINTMENT_MISSED = 'appointment_missed',
  APPOINTMENT_STARTED = 'appointment_started',

  PRESCRIPTION_CREATED = 'prescription_created',
  PRESCRIPTION_READY = 'prescription_ready',
  PRESCRIPTION_PAYMENT_REQUIRED = 'prescription_payment_required',
  PRESCRIPTION_SHIPPED = 'prescription_shipped',
  PRESCRIPTION_DELIVERED = 'prescription_delivered',

  PHARMACY_ORDER_PLACED = 'pharmacy_order_placed',
  PHARMACY_ORDER_CONFIRMED = 'pharmacy_order_confirmed',
  PHARMACY_ORDER_PROCESSING = 'pharmacy_order_processing',
  PHARMACY_ORDER_SHIPPED = 'pharmacy_order_shipped',
  PHARMACY_ORDER_DELIVERED = 'pharmacy_order_delivered',
  PHARMACY_ORDER_CANCELLED = 'pharmacy_order_cancelled',

  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  WALLET_CREDITED = 'wallet_credited',
  WALLET_DEBITED = 'wallet_debited',
  REFUND_PROCESSED = 'refund_processed',

  HEALTH_CHECKUP_COMPLETE = 'health_checkup_complete',
  HEALTH_SCORE_UPDATED = 'health_score_updated',
  VITALS_ALERT = 'vitals_alert',
  VITALS_REMINDER = 'vitals_reminder',

  ACCOUNT_VERIFIED = 'account_verified',
  PROFILE_UPDATE_REQUIRED = 'profile_update_required',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  PROMOTIONAL = 'promotional',
  WELCOME = 'welcome',

  REVIEW_RECEIVED = 'review_received',

  RECOVERY_RISK_MODERATE = 'recovery_risk_moderate',
  RECOVERY_RISK_HIGH = 'recovery_risk_high',
  RECOVERY_RISK_CRITICAL = 'recovery_risk_critical',
  RECOVERY_RISK_IMPROVED = 'recovery_risk_improved',
  RECOVERY_CHECK_IN_REMINDER = 'recovery_check_in_reminder',
  RECOVERY_MILESTONE_ACHIEVED = 'recovery_milestone_achieved',
}

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  _id: string;
  userId: string;
  user_type: 'patient' | 'specialist' | 'admin';
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
  priority: NotificationPriority;
  is_read: boolean;
  read_at?: string;
  is_scheduled: boolean;
  scheduled_for?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}
