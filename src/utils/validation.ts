import {z} from 'zod';

// ─── Auth schemas ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
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
  .refine(data => data.password === data.confirmPassword, {
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
});
export type EmergencyContactFormData = z.infer<typeof emergencyContactSchema>;

// ─── Vitals schema ──────────────────────────────────────────────────────────

export const vitalLogSchema = z.object({
  type: z.string().min(1, 'Vital type is required'),
  value: z
    .number({message: 'Value is required'})
    .positive('Must be a positive number'),
  systolic: z.number().positive().optional(),
  diastolic: z.number().positive().optional(),
  notes: z.string().optional(),
});
export type VitalLogFormData = z.infer<typeof vitalLogSchema>;
