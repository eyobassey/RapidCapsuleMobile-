export enum PrescriptionProgressStatus {
  PRESCRIPTION_RECEIVED = 'Prescription Received',
  VALIDATING_PRESCRIPTION = 'Validating prescription',
  PRESCRIPTION_VALIDATION_FAILED = 'Prescription validation failed',
  PROCESSING_ORDER = 'Processing order',
  ORDER_PROCESSED = 'Order processed',
}

export enum SpecialistPrescriptionStatus {
  DRAFT = 'draft',
  PENDING_ACCEPTANCE = 'pending_acceptance',
  ACCEPTED = 'accepted',
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  PROCESSING = 'processing',
  DISPENSED = 'dispensed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum PrescriptionPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PrescriptionPaymentMethod {
  SPECIALIST_WALLET = 'specialist_wallet',
  PATIENT_ONLINE = 'patient_online',
  PATIENT_CASH = 'patient_cash',
  PATIENT_WALLET = 'patient_wallet',
  PATIENT_WALLET_PARTIAL = 'patient_wallet_partial',
  SEND_TO_PATIENT = 'send_to_patient',
}

export enum PatientResponse {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PARTIAL = 'partial',
  DECLINED = 'declined',
}

export interface PrescriptionItemDose {
  quantity: number;
  dosage_form: string;
}

export interface PrescriptionItemInterval {
  time: string;
  unit: string;
}

export interface PrescriptionItemPeriod {
  number: number;
  unit: string;
}

export interface LegacyPrescriptionItem {
  drug: string;
  dose: PrescriptionItemDose;
  interval: PrescriptionItemInterval;
  period: PrescriptionItemPeriod;
  require_refill: boolean;
  notes?: string;
  refill_info?: {
    dose: PrescriptionItemDose;
    interval: PrescriptionItemInterval;
  };
}

export interface Prescription {
  _id: string;
  prescribed_by: string | Record<string, any>;
  patient: string | Record<string, any>;
  progress_status: PrescriptionProgressStatus;
  items: LegacyPrescriptionItem[];
  is_sent_to_patient: boolean;
  is_sent_to_pharmacy: boolean;
  pharmacy?: string;
  created_at: string;
  updated_at: string;
}

export interface SpecialistPrescriptionItem {
  drug_id?: string;
  drug_name: string;
  generic_name?: string;
  drug_strength: string;
  manufacturer?: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  unit_price: number;
  total_price: number;
  stock_reserved: boolean;
  patient_accepted?: boolean;
  patient_declined_reason?: string;
  source?: 'inventory' | 'external' | 'ai_suggested';
  is_in_inventory?: boolean;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  phone: string;
  recipient_name?: string;
  additional_info?: string;
}

export interface StatusHistoryEntry {
  status: SpecialistPrescriptionStatus;
  changed_at: string;
  changed_by: string;
  notes?: string;
}

export interface SpecialistPrescription {
  _id: string;
  prescription_number: string;
  specialist_id: string | Record<string, any>;
  patient_id: string | Record<string, any>;
  items: SpecialistPrescriptionItem[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total_amount: number;
  currency: string;
  payment_method?: PrescriptionPaymentMethod;
  payment_status: PrescriptionPaymentStatus;
  payment_reference?: string;
  paid_at?: string;
  delivery_address?: DeliveryAddress;
  status: SpecialistPrescriptionStatus;
  status_history: StatusHistoryEntry[];
  patient_response: PatientResponse;
  patient_responded_at?: string;
  patient_decline_reason?: string;
  clinical_notes?: string;
  patient_notes?: string;
  pharmacy_notes?: string;
  is_refillable: boolean;
  refill_count: number;
  refills_used: number;
  days_supply?: number;
  next_refill_date?: string;
  is_refill: boolean;
  is_pickup_order: boolean;
  pickup_code?: string;
  shipped_at?: string;
  tracking_number?: string;
  courier_name?: string;
  estimated_delivery?: string;
  delivered_at?: string;
  pdf_url?: string;
  expires_at?: string;
  rating?: number;
  review?: string;
  appointment_id?: string;
  linked_pharmacy_order?: string;
  linked_pharmacy_order_number?: string;
  created_at: string;
  updated_at: string;
}
