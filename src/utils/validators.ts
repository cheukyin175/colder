/**
 * Validators Utility
 * Data validation functions for the Colder extension
 */

import { MESSAGE_LENGTH_RANGES, MessageLength } from '../models/types';
import { MessageDraft } from '../models/message-draft';
import { UserProfile } from '../models/user-profile';
import { ValidationError } from './error-handlers';

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email regex pattern
  // Matches: user@domain.com, user.name@domain.co.uk, user+tag@domain.com
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Additional checks
  const hasValidLength = email.length >= 3 && email.length <= 254;
  const hasNoConsecutiveDots = !email.includes('..');
  const doesntStartWithDot = !email.startsWith('.');
  const doesntEndWithDot = !email.endsWith('.');

  return (
    emailRegex.test(email) &&
    hasValidLength &&
    hasNoConsecutiveDots &&
    doesntStartWithDot &&
    doesntEndWithDot
  );
}

/**
 * Validate email with detailed error message
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  if (typeof email !== 'string') {
    return { isValid: false, error: 'Email must be a string' };
  }

  const trimmed = email.trim();

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Email is too short' };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email is too long (max 254 characters)' };
  }

  if (!trimmed.includes('@')) {
    return { isValid: false, error: 'Email must contain @ symbol' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Email must have exactly one @ symbol' };
  }

  const [localPart, domain] = parts;

  if (!localPart) {
    return { isValid: false, error: 'Email local part (before @) is missing' };
  }

  if (!domain) {
    return { isValid: false, error: 'Email domain (after @) is missing' };
  }

  if (!domain.includes('.')) {
    return { isValid: false, error: 'Email domain must contain a dot' };
  }

  if (domain.startsWith('.') || domain.endsWith('.')) {
    return { isValid: false, error: 'Email domain cannot start or end with a dot' };
  }

  if (!isValidEmail(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
}

/**
 * OpenRouter API key validation
 */
export function isValidOpenRouterKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  const trimmed = key.trim();

  // OpenRouter keys typically start with 'sk-or-v1-' or 'sk-or-'
  // But we'll be lenient and accept keys starting with 'sk-'
  const hasValidPrefix = trimmed.startsWith('sk-or-') || trimmed.startsWith('sk-');
  const hasValidLength = trimmed.length >= 20 && trimmed.length <= 200;

  return hasValidPrefix && hasValidLength;
}

/**
 * Validate OpenRouter API key with detailed error
 */
export function validateOpenRouterKey(key: string): { isValid: boolean; error?: string } {
  if (!key) {
    return { isValid: false, error: 'API key is required' };
  }

  if (typeof key !== 'string') {
    return { isValid: false, error: 'API key must be a string' };
  }

  const trimmed = key.trim();

  if (trimmed.length < 20) {
    return { isValid: false, error: 'API key is too short' };
  }

  if (trimmed.length > 200) {
    return { isValid: false, error: 'API key is too long' };
  }

  if (!trimmed.startsWith('sk-')) {
    return { isValid: false, error: 'API key should start with "sk-"' };
  }

  if (!isValidOpenRouterKey(trimmed)) {
    return { isValid: false, error: 'Invalid OpenRouter API key format' };
  }

  return { isValid: true };
}

/**
 * Calculate profile completeness percentage
 * Required fields have 70% weight, optional fields have 30% weight
 */
export function calculateProfileCompleteness(profile: Partial<UserProfile>): number {
  const requiredFields: (keyof UserProfile)[] = [
    'email',
    'name',
    'currentRole',
    'currentCompany',
    'professionalBackground',
    'valueProposition'
  ];

  const optionalFields: (keyof UserProfile)[] = [
    'careerGoals',
    'outreachObjectives'
  ];

  let score = 0;
  const requiredWeight = 70 / requiredFields.length;
  const optionalWeight = 30 / optionalFields.length;

  // Check required fields
  requiredFields.forEach(field => {
    const value = profile[field];
    if (value && String(value).trim().length > 0) {
      score += requiredWeight;
    }
  });

  // Check optional fields
  optionalFields.forEach(field => {
    const value = profile[field];
    if (value && String(value).trim().length > 0) {
      score += optionalWeight;
    }
  });

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Validate message draft meets requirements
 * SC-002: Messages must include at least 2 target profile references
 */
export function validateMessageDraft(draft: MessageDraft): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for required fields
  if (!draft.body || draft.body.trim().length === 0) {
    errors.push('Message body is empty');
  }

  // Check for minimum target profile references (SC-002)
  const targetAnnotations = draft.annotations.filter(
    annotation => annotation.source === 'target_profile'
  );

  if (targetAnnotations.length < 2) {
    errors.push('Message must include at least 2 references to the target profile');
  }

  // Check word count is within range for selected length
  const wordCount = countWords(draft.body);
  const range = MESSAGE_LENGTH_RANGES[draft.length];

  if (wordCount < range.min) {
    errors.push(`Message is too short (${wordCount} words, minimum ${range.min})`);
  }

  if (wordCount > range.max) {
    errors.push(`Message is too long (${wordCount} words, maximum ${range.max})`);
  }

  // Check for subject if it's for email
  if (draft.subject !== undefined && draft.subject.trim().length === 0) {
    errors.push('Email subject is empty');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  // Remove extra whitespace and split by whitespace
  const words = text.trim().split(/\s+/);

  // Filter out empty strings
  return words.filter(word => word.length > 0).length;
}

/**
 * Validate word count for message length
 */
export function validateWordCount(
  text: string,
  length: MessageLength
): { isValid: boolean; error?: string } {
  const count = countWords(text);
  const range = MESSAGE_LENGTH_RANGES[length];

  if (count < range.min) {
    return {
      isValid: false,
      error: `Message is too short (${count} words, needs ${range.min}-${range.max})`
    };
  }

  if (count > range.max) {
    return {
      isValid: false,
      error: `Message is too long (${count} words, needs ${range.min}-${range.max})`
    };
  }

  return { isValid: true };
}

/**
 * Validate LinkedIn URL
 */
export function isValidLinkedInUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);

    // Check if it's a LinkedIn domain
    const validHosts = ['linkedin.com', 'www.linkedin.com'];
    if (!validHosts.includes(parsed.hostname)) {
      return false;
    }

    // Check if it's a profile URL
    const profilePathRegex = /^\/in\/[\w-]+\/?$/;
    return profilePathRegex.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * Validate text length with min/max constraints
 */
export function validateTextLength(
  text: string,
  fieldName: string,
  minLength: number = 0,
  maxLength?: number
): { isValid: boolean; error?: string } {
  if (!text || typeof text !== 'string') {
    if (minLength > 0) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
  }

  const trimmed = text.trim();

  if (trimmed.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`
    };
  }

  if (maxLength && trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be no more than ${maxLength} characters`
    };
  }

  return { isValid: true };
}

/**
 * Validate user profile
 */
export function validateUserProfile(profile: Partial<UserProfile>): {
  isValid: boolean;
  errors: string[];
  completeness: number;
} {
  const errors: string[] = [];

  // Validate email
  if (!profile.email) {
    errors.push('Email is required');
  } else {
    const emailValidation = validateEmail(profile.email);
    if (!emailValidation.isValid && emailValidation.error) {
      errors.push(emailValidation.error);
    }
  }

  // Validate required text fields
  const requiredFields = [
    { field: 'name', min: 1, max: 100 },
    { field: 'currentRole', min: 1, max: 100 },
    { field: 'currentCompany', min: 1, max: 100 },
    { field: 'professionalBackground', min: 10, max: 500 },
    { field: 'valueProposition', min: 10, max: 300 }
  ];

  requiredFields.forEach(({ field, min, max }) => {
    const value = profile[field as keyof UserProfile] as string | undefined;
    const validation = validateTextLength(value || '', field, min, max);
    if (!validation.isValid && validation.error) {
      errors.push(validation.error);
    }
  });

  // Validate optional fields if provided
  if (profile.careerGoals) {
    const validation = validateTextLength(profile.careerGoals, 'careerGoals', 0, 500);
    if (!validation.isValid && validation.error) {
      errors.push(validation.error);
    }
  }

  if (profile.outreachObjectives) {
    const validation = validateTextLength(profile.outreachObjectives, 'outreachObjectives', 0, 500);
    if (!validation.isValid && validation.error) {
      errors.push(validation.error);
    }
  }

  const completeness = calculateProfileCompleteness(profile);

  return {
    isValid: errors.length === 0,
    errors,
    completeness
  };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Escape special HTML characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized.trim();
}

/**
 * Validate Chrome storage key
 */
export function isValidStorageKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // Chrome storage keys should be non-empty strings
  // and not contain certain special characters
  const validKeyRegex = /^[a-zA-Z0-9_-]+$/;
  return validKeyRegex.test(key) && key.length <= 100;
}

/**
 * Validate date is within range
 */
export function isDateWithinRange(
  date: Date,
  minDate?: Date,
  maxDate?: Date
): boolean {
  const timestamp = date.getTime();

  if (minDate && timestamp < minDate.getTime()) {
    return false;
  }

  if (maxDate && timestamp > maxDate.getTime()) {
    return false;
  }

  return true;
}

/**
 * Validate license key format
 * Format: XXXX-XXXX-XXXX-XXXX where X is alphanumeric
 */
export function isValidLicenseKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  const licenseKeyRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return licenseKeyRegex.test(key.toUpperCase());
}