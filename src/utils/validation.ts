import { z } from 'zod';

// ─── Auth schemas ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});
export type SignupFormData = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Onboarding schemas ─────────────────────────────────────────────────────

export const personalDetailsSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  gender: z.string().optional(),
  phone_number: z.string().optional(),
  marital_status: z.string().optional(),
  occupation: z.string().optional(),
});
export type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;

export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  postal_code: z.string().optional(),
});
export type AddressFormData = z.infer<typeof addressSchema>;

export const emergencyContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  relationship: z.string().optional(),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().optional(),
  same_as_patient: z.boolean().optional(),
  address1: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  zip_code: z.string().optional(),
});
export type EmergencyContactFormData = z.infer<typeof emergencyContactSchema>;

// ─── Vitals schema ──────────────────────────────────────────────────────────

export const vitalLogSchema = z.object({
  type: z.string().min(1, 'Vital type is required'),
  value: z.number({ message: 'Value is required' }).positive('Must be a positive number'),
  systolic: z.number().positive().optional(),
  diastolic: z.number().positive().optional(),
  notes: z.string().optional(),
});
export type VitalLogFormData = z.infer<typeof vitalLogSchema>;

/** Schema for the multi-vital log form (all fields optional, validated when present) */
const optionalPositiveNumber = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined))
  .pipe(
    z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'Must be a positive number')
      .optional()
  );

export const multiVitalLogSchema = z
  .object({
    bp_systolic: optionalPositiveNumber,
    bp_diastolic: optionalPositiveNumber,
    pulse_rate: optionalPositiveNumber,
    temperature: optionalPositiveNumber,
    respiratory_rate: optionalPositiveNumber,
    oxygen_saturation: optionalPositiveNumber,
    weight: optionalPositiveNumber,
    height: optionalPositiveNumber,
    steps: optionalPositiveNumber,
    sleep_hours: optionalPositiveNumber,
    calories: optionalPositiveNumber,
    stress_level: optionalPositiveNumber,
    water_intake: optionalPositiveNumber,
    blood_glucose: optionalPositiveNumber,
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const { bp_systolic, bp_diastolic, notes, ...rest } = data;
      void notes; // excluded from rest so notes alone does not satisfy
      const hasBP = bp_systolic && bp_diastolic;
      const hasOther = Object.values(rest).some((v) => v !== undefined);
      return hasBP || hasOther;
    },
    { message: 'Please enter at least one vital reading', path: ['_form'] }
  )
  .refine(
    (data) => {
      // If one BP field is set, both must be
      const hasSys = !!data.bp_systolic;
      const hasDia = !!data.bp_diastolic;
      return hasSys === hasDia;
    },
    {
      message: 'Both systolic and diastolic are required for blood pressure',
      path: ['bp_systolic'],
    }
  );
export type MultiVitalLogFormData = z.infer<typeof multiVitalLogSchema>;

// ─── Rating schema ──────────────────────────────────────────────────────────

export const ratingSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  feedback: z.string().optional(),
});
export type RatingFormData = z.infer<typeof ratingSchema>;

// ─── Booking confirm schema ─────────────────────────────────────────────────

export const bookingConfirmSchema = z.object({
  notes: z.string().optional(),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms' }),
  }),
  paymentMethod: z.enum(['wallet', 'card']),
});
export type BookingConfirmFormData = z.infer<typeof bookingConfirmSchema>;

// ─── Dependants schema ──────────────────────────────────────────────────────

export const dependantItemSchema = z
  .object({
    firstName: z.string(),
    lastName: z.string().optional(),
    dateOfBirth: z
      .string()
      .optional()
      .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use YYYY-MM-DD format'),
    relationship: z.string().optional(),
    gender: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasAny =
        data.firstName?.trim() ||
        data.lastName?.trim() ||
        data.dateOfBirth ||
        data.relationship ||
        data.gender;
      return !hasAny || (data.firstName?.trim()?.length ?? 0) > 0;
    },
    { message: 'First name is required when adding a dependant', path: ['firstName'] }
  );
export type DependantItemFormData = z.infer<typeof dependantItemSchema>;

export const dependantsSchema = z.object({
  dependants: z.array(dependantItemSchema).max(10, 'Maximum 10 dependants'),
});
export type DependantsFormData = z.infer<typeof dependantsSchema>;

// ─── Allergy item schema ───────────────────────────────────────────────────

export const allergyItemSchema = z.object({
  name: z.string().min(1, 'Allergen name is required'),
  reaction: z.string().optional(),
  severity: z.string().optional(),
});
export type AllergyItemFormData = z.infer<typeof allergyItemSchema>;

// ─── Checkout address schema ────────────────────────────────────────────────

export const checkoutAddressSchema = z.object({
  recipient_name: z.string().min(1, 'Recipient name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  label: z.string().optional(),
});
export type CheckoutAddressFormData = z.infer<typeof checkoutAddressSchema>;
