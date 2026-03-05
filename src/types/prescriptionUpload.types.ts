// ── Verification Status ──

export type VerificationStatus =
  | 'PENDING'
  | 'TIER1_PROCESSING'
  | 'TIER1_PASSED'
  | 'TIER1_FAILED'
  | 'TIER2_PROCESSING'
  | 'TIER2_PASSED'
  | 'TIER2_FAILED'
  | 'PHARMACIST_REVIEW'
  | 'CLARIFICATION_NEEDED'
  | 'CLARIFICATION_RECEIVED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  PENDING: 'Pending',
  TIER1_PROCESSING: 'Processing (Tier 1)',
  TIER1_PASSED: 'Tier 1 Passed',
  TIER1_FAILED: 'Tier 1 Failed',
  TIER2_PROCESSING: 'Processing (Tier 2)',
  TIER2_PASSED: 'Tier 2 Passed',
  TIER2_FAILED: 'Tier 2 Failed',
  PHARMACIST_REVIEW: 'Pharmacist Review',
  CLARIFICATION_NEEDED: 'Clarification Needed',
  CLARIFICATION_RECEIVED: 'Clarification Received',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
};

const TERMINAL_STATUSES: Set<VerificationStatus> = new Set([
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'PHARMACIST_REVIEW',
  'TIER1_FAILED',
  'TIER2_FAILED',
  'CLARIFICATION_NEEDED',
]);

export function isTerminalStatus(status: VerificationStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

// ── OCR Data ──

export interface OcrMedication {
  name?: string;
  dosage?: string;
  frequency?: string;
  quantity?: number;
  duration?: string;
  instructions?: string;
}

export interface OcrData {
  doctor_name?: string;
  clinic_name?: string;
  clinic_address?: string;
  patient_name?: string;
  date?: string;
  medications?: OcrMedication[];
  raw_text?: string;
}

// ── Verification Result ──

export interface VerificationResult {
  tier1_result?: {
    status: string;
    ocr_confidence?: number;
    extracted_data?: OcrData;
    issues?: string[];
  };
  tier2_result?: {
    status: string;
    ai_confidence?: number;
    fraud_detection?: {
      is_suspicious: boolean;
      reasons?: string[];
    };
    clinical_validation?: {
      is_valid: boolean;
      issues?: string[];
    };
  };
  final_status?: VerificationStatus;
  reviewed_by?: string;
  review_notes?: string;
}

// ── Prescription Upload ──

export interface PrescriptionUpload {
  _id: string;
  patient: string | Record<string, any>;
  prescription_image?: string;
  presigned_url?: string;
  doctor_name?: string;
  verification_status: VerificationStatus;
  ocr_data?: OcrData;
  verification_result?: VerificationResult;
  valid_from?: string;
  valid_until?: string;
  used_in_orders?: string[];
  clarification_request?: {
    message: string;
    requested_at: string;
  };
  clarification_response?: {
    message: string;
    image_url?: string;
    responded_at: string;
  };
  created_at: string;
  updated_at: string;
}
