/**
 * Accessibility utilities for authentication components
 * Provides consistent ARIA attributes and screen reader support
 */

/**
 * Generate ARIA description for form validation states
 */
export function getAriaDescription(
  fieldName: string,
  hasError: boolean,
  isValid: boolean
): string | undefined {
  if (hasError) {
    return `${fieldName}-error`;
  }
  if (isValid) {
    return `${fieldName}-success`;
  }
  return undefined;
}

/**
 * Generate ARIA live region attributes for dynamic content
 */
export function getAriaLiveAttributes(
  priority: 'polite' | 'assertive' = 'polite'
) {
  return {
    'aria-live': priority,
    role: 'status' as const,
  };
}

/**
 * Generate ARIA alert attributes for error messages
 */
export function getAriaAlertAttributes() {
  return {
    role: 'alert' as const,
    'aria-live': 'assertive' as const,
  };
}

/**
 * Generate ARIA attributes for form inputs
 */
export function getInputAriaAttributes(
  fieldName: string,
  hasError: boolean,
  isValid: boolean,
  isRequired: boolean = true
) {
  return {
    'aria-describedby': getAriaDescription(fieldName, hasError, isValid),
    'aria-invalid': hasError,
    'aria-required': isRequired,
  };
}

/**
 * Generate ARIA attributes for toggle buttons
 */
export function getToggleAriaAttributes(
  isPressed: boolean,
  label: string,
  descriptionId: string
) {
  return {
    'aria-label': label,
    'aria-pressed': isPressed,
    'aria-describedby': descriptionId,
  };
}

/**
 * Generate ARIA attributes for loading states
 */
export function getLoadingAriaAttributes(loadingText: string) {
  return {
    'aria-live': 'polite' as const,
    'aria-label': loadingText,
  };
}

/**
 * Generate ARIA attributes for success states
 */
export function getSuccessAriaAttributes(successText: string) {
  return {
    'aria-live': 'polite' as const,
    'aria-label': successText,
  };
}

/**
 * Screen reader only text utility
 */
export function srOnly(text: string): string {
  return text;
}

/**
 * Generate focus management attributes for form navigation
 */
export function getFocusManagementAttributes(
  isDisabled: boolean,
  tabIndex: number = 0
) {
  return {
    tabIndex: isDisabled ? -1 : tabIndex,
    'aria-disabled': isDisabled,
  };
}

/**
 * Generate ARIA attributes for form sections
 */
export function getFormSectionAriaAttributes(
  sectionName: string,
  isExpanded: boolean = true
) {
  return {
    role: 'region' as const,
    'aria-label': sectionName,
    'aria-expanded': isExpanded,
  };
}

/**
 * Generate ARIA attributes for navigation landmarks
 */
export function getNavigationAriaAttributes(landmarkName: string) {
  return {
    role: 'navigation' as const,
    'aria-label': landmarkName,
  };
}

/**
 * Generate ARIA attributes for main content areas
 */
export function getMainAriaAttributes(pageName: string) {
  return {
    role: 'main' as const,
    'aria-label': pageName,
  };
}

/**
 * Generate ARIA attributes for status updates
 */
export function getStatusAriaAttributes(
  statusText: string,
  isLive: boolean = true
) {
  return {
    role: 'status' as const,
    'aria-live': isLive ? 'polite' : 'off',
    'aria-label': statusText,
  };
}
