// Form validation utilities
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!email) {
    errors.push({
      field: 'email',
      message: 'Email is required',
    });
    return { isValid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!password) {
    errors.push({
      field: 'password',
      message: 'Password is required',
    });
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters long',
    });
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one letter',
    });
  }

  if (!/\d/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one number',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate password confirmation
 */
export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!confirmPassword) {
    errors.push({
      field: 'confirmPassword',
      message: 'Please confirm your password',
    });
    return { isValid: false, errors };
  }

  if (password !== confirmPassword) {
    errors.push({
      field: 'confirmPassword',
      message: 'Passwords do not match',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get field-specific error message
 */
export function getFieldError(
  errors: ValidationError[],
  field: string
): string {
  const fieldError = errors.find(error => error.field === field);
  return fieldError?.message || '';
}

/**
 * Check if field has error
 */
export function hasFieldError(
  errors: ValidationError[],
  field: string
): boolean {
  return errors.some(error => error.field === field);
}
