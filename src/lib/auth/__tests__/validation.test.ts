import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  getFieldError,
  hasFieldError,
  type ValidationResult,
  type ValidationError,
} from '@/lib/auth/validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should return valid for correct email format', () => {
      const result = validateEmail('test@example.com');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for empty email', () => {
      const result = validateEmail('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'email',
        message: 'Email is required',
      });
    });

    it('should return error for invalid email format', () => {
      const result = validateEmail('invalid-email');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'email',
        message: 'Please enter a valid email address',
      });
    });

    it('should return error for email without domain', () => {
      const result = validateEmail('test@');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe(
        'Please enter a valid email address'
      );
    });

    it('should return error for email without @ symbol', () => {
      const result = validateEmail('testexample.com');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe(
        'Please enter a valid email address'
      );
    });

    it('should accept various valid email formats', () => {
      const validEmails = [
        'user@domain.com',
        'user.name@domain.com',
        'user+tag@domain.com',
        'user@subdomain.domain.com',
        'user@domain.co.uk',
        'user@domain-name.com',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('validatePassword', () => {
    it('should return valid for strong password', () => {
      const result = validatePassword('StrongPass123');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for empty password', () => {
      const result = validatePassword('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'password',
        message: 'Password is required',
      });
    });

    it('should return error for password shorter than 8 characters', () => {
      const result = validatePassword('short');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'password',
        message: 'Password must be at least 8 characters long',
      });
    });

    it('should return error for password without letters', () => {
      const result = validatePassword('123456789');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'password',
        message: 'Password must contain at least one letter',
      });
    });

    it('should return error for password without numbers', () => {
      const result = validatePassword('PasswordOnly');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'password',
        message: 'Password must contain at least one number',
      });
    });

    it('should return multiple errors for password with multiple issues', () => {
      const result = validatePassword('weak');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          {
            field: 'password',
            message: 'Password must be at least 8 characters long',
          },
          {
            field: 'password',
            message: 'Password must contain at least one number',
          },
        ])
      );
    });

    it('should accept various valid password formats', () => {
      const validPasswords = [
        'Password123',
        'MySecurePass456',
        'ComplexP@ss789',
        'LongPasswordWithNumbers123',
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('validatePasswordConfirmation', () => {
    it('should return valid when passwords match', () => {
      const result = validatePasswordConfirmation('Password123', 'Password123');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for empty confirmation password', () => {
      const result = validatePasswordConfirmation('Password123', '');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'confirmPassword',
        message: 'Please confirm your password',
      });
    });

    it('should return error when passwords do not match', () => {
      const result = validatePasswordConfirmation(
        'Password123',
        'DifferentPass456'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'confirmPassword',
        message: 'Passwords do not match',
      });
    });

    it('should be case sensitive', () => {
      const result = validatePasswordConfirmation('Password123', 'password123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Passwords do not match');
    });
  });

  describe('getFieldError', () => {
    it('should return error message for specific field', () => {
      const errors: ValidationError[] = [
        { field: 'email', message: 'Email is invalid' },
        { field: 'password', message: 'Password is too short' },
      ];

      const result = getFieldError(errors, 'email');

      expect(result).toBe('Email is invalid');
    });

    it('should return empty string when field has no errors', () => {
      const errors: ValidationError[] = [
        { field: 'email', message: 'Email is invalid' },
      ];

      const result = getFieldError(errors, 'password');

      expect(result).toBe('');
    });

    it('should return empty string for empty errors array', () => {
      const errors: ValidationError[] = [];

      const result = getFieldError(errors, 'email');

      expect(result).toBe('');
    });

    it('should return first error message when field has multiple errors', () => {
      const errors: ValidationError[] = [
        { field: 'password', message: 'Password is too short' },
        { field: 'password', message: 'Password must contain numbers' },
      ];

      const result = getFieldError(errors, 'password');

      expect(result).toBe('Password is too short');
    });
  });

  describe('hasFieldError', () => {
    it('should return true when field has errors', () => {
      const errors: ValidationError[] = [
        { field: 'email', message: 'Email is invalid' },
        { field: 'password', message: 'Password is too short' },
      ];

      const result = hasFieldError(errors, 'email');

      expect(result).toBe(true);
    });

    it('should return false when field has no errors', () => {
      const errors: ValidationError[] = [
        { field: 'email', message: 'Email is invalid' },
      ];

      const result = hasFieldError(errors, 'password');

      expect(result).toBe(false);
    });

    it('should return false for empty errors array', () => {
      const errors: ValidationError[] = [];

      const result = hasFieldError(errors, 'email');

      expect(result).toBe(false);
    });

    it('should return true when field has multiple errors', () => {
      const errors: ValidationError[] = [
        { field: 'password', message: 'Password is too short' },
        { field: 'password', message: 'Password must contain numbers' },
      ];

      const result = hasFieldError(errors, 'password');

      expect(result).toBe(true);
    });
  });
});
