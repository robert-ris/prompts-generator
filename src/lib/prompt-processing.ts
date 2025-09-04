/**
 * Utility functions for prompt template processing
 */

export interface PromptVariables {
  role: string;
  topic: string;
  tone: string;
  outputType: string;
}

/**
 * Process a template string by replacing variables with their values
 * @param template - The template string with variables like {{role}}, {{topic}}, etc.
 * @param variables - Object containing variable values
 * @returns Processed template with variables replaced
 */
export function processTemplate(
  template: string,
  variables: PromptVariables
): string {
  let result = template;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const regex = new RegExp(placeholder, 'g');

    if (value.trim()) {
      result = result.replace(regex, value);
    } else {
      result = result.replace(regex, `[${key}]`);
    }
  });

  return result;
}

/**
 * Extract variables from a template string
 * @param template - The template string
 * @returns Array of variable names found in the template
 */
export function extractVariables(template: string): string[] {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variableRegex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Validate template syntax
 * @param template - The template string to validate
 * @returns Object with validation results
 */
export function validateTemplate(template: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for unmatched braces
  const openBraces = (template.match(/\{\{/g) || []).length;
  const closeBraces = (template.match(/\}\}/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push('Unmatched braces detected in template');
  }

  // Check for empty variables
  const emptyVariables = template.match(/\{\{\s*\}\}/g);
  if (emptyVariables) {
    errors.push('Empty variable placeholders detected');
  }

  // Check for very long template
  if (template.length > 10000) {
    warnings.push('Template is very long and may impact performance');
  }

  // Check for special characters that might cause issues
  const specialChars = template.match(/[<>]/g);
  if (specialChars) {
    warnings.push(
      'Template contains special characters that may need escaping'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate a default template based on common patterns
 * @param category - The category of prompt
 * @returns A default template string
 */
export function generateDefaultTemplate(category: string = 'general'): string {
  const templates = {
    general:
      'You are a {{role}} expert. Please help me with {{topic}} in a {{tone}} manner. The output should be {{outputType}}.',
    writing:
      'As a {{role}} writer, help me create {{topic}} content with a {{tone}} tone. Please provide {{outputType}}.',
    programming:
      'You are a {{role}} developer. Help me with {{topic}} programming. Please explain in a {{tone}} manner and provide {{outputType}}.',
    business:
      'As a {{role}} business consultant, help me with {{topic}}. Please provide {{outputType}} in a {{tone}} manner.',
    education:
      'You are a {{role}} educator. Help me teach {{topic}} in a {{tone}} manner. Please provide {{outputType}}.',
  };

  return templates[category as keyof typeof templates] || templates.general;
}

/**
 * Count characters in processed template
 * @param template - The processed template string
 * @returns Character count information
 */
export function getCharacterCount(template: string): {
  total: number;
  words: number;
  lines: number;
} {
  return {
    total: template.length,
    words: template.trim().split(/\s+/).length,
    lines: template.split('\n').length,
  };
}
