import {loginSchema, signupSchema, resetPasswordSchema} from '../validation';

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find(i => i.path[0] === 'email');
      expect(emailError?.message).toBe('Email is required');
    }
  });

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find(i => i.path[0] === 'email');
      expect(emailError?.message).toBe('Invalid email address');
    }
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.issues.find(
        i => i.path[0] === 'password',
      );
      expect(passwordError?.message).toBe('Password is required');
    }
  });
});

describe('signupSchema', () => {
  const validData = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '+2348012345678',
    date_of_birth: '1990-01-01',
    password: 'Password1',
  };

  it('accepts valid signup data', () => {
    const result = signupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: 'Pass1',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const pwError = result.error.issues.find(
        i => i.path[0] === 'password',
      );
      expect(pwError?.message).toContain('at least 8 characters');
    }
  });

  it('rejects password without uppercase letter', () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: 'password1',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const pwError = result.error.issues.find(
        i =>
          i.path[0] === 'password' &&
          i.message.includes('uppercase'),
      );
      expect(pwError).toBeDefined();
    }
  });

  it('rejects password without a number', () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: 'Passwordx',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const pwError = result.error.issues.find(
        i =>
          i.path[0] === 'password' &&
          i.message.includes('number'),
      );
      expect(pwError).toBeDefined();
    }
  });

  it('rejects empty first name', () => {
    const result = signupSchema.safeParse({
      ...validData,
      first_name: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty last name', () => {
    const result = signupSchema.safeParse({
      ...validData,
      last_name: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid date_of_birth format', () => {
    const result = signupSchema.safeParse({
      ...validData,
      date_of_birth: '01/01/1990',
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty phone', () => {
    const result = signupSchema.safeParse({
      ...validData,
      phone: '',
    });

    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Password1',
      confirmPassword: 'Password1',
    });

    expect(result.success).toBe(true);
  });

  it('rejects mismatched password confirmation', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Password1',
      confirmPassword: 'Password2',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        i => i.path[0] === 'confirmPassword',
      );
      expect(confirmError?.message).toBe('Passwords do not match');
    }
  });

  it('enforces password strength on reset', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'weak',
      confirmPassword: 'weak',
    });

    expect(result.success).toBe(false);
  });
});
