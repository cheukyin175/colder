/**
 * User Profile Model
 * Represents the extension user's professional information used to personalize all generated messages.
 */

import { TonePreset, MessageLength } from './types';

export interface UserProfile {
  // Identity
  id: string;                    // UUID v4
  email: string;                 // User's email address
  name: string;                  // Full name

  // Professional info
  currentRole: string;           // e.g., "Senior Product Manager"
  currentCompany: string;        // e.g., "Acme Corp"

  // Background & value proposition
  professionalBackground: string; // 2-3 sentence summary (max 500 chars)
  careerGoals?: string;          // What they're looking for (optional)
  outreachObjectives?: string;   // Why they're reaching out (optional)
  valueProposition: string;      // What they offer (max 300 chars) - Note: Fixed typo from spec

  // Configuration
  defaultTone: TonePreset;       // 'professional' | 'casual' | 'enthusiastic'
  defaultLength: MessageLength;  // 'short' | 'medium' | 'long'

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completeness: number;          // 0-100% profile completeness score
}

/**
 * Calculate profile completeness percentage
 * Required fields: 70% weight
 * Optional fields: 30% weight
 */
export function calculateProfileCompleteness(profile: Partial<UserProfile>): number {
  const requiredFields = [
    'email',
    'name',
    'currentRole',
    'currentCompany',
    'professionalBackground',
    'valueProposition'
  ];

  const optionalFields = [
    'careerGoals',
    'outreachObjectives'
  ];

  let score = 0;
  const requiredWeight = 70 / requiredFields.length;
  const optionalWeight = 30 / optionalFields.length;

  // Check required fields
  requiredFields.forEach(field => {
    if (profile[field as keyof UserProfile]) {
      score += requiredWeight;
    }
  });

  // Check optional fields
  optionalFields.forEach(field => {
    if (profile[field as keyof UserProfile]) {
      score += optionalWeight;
    }
  });

  return Math.round(score);
}

/**
 * Validate user profile data
 */
export function validateUserProfile(profile: Partial<UserProfile>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!profile.email) errors.push('Email is required');
  if (!profile.name) errors.push('Name is required');
  if (!profile.currentRole) errors.push('Current role is required');
  if (!profile.currentCompany) errors.push('Current company is required');
  if (!profile.professionalBackground) errors.push('Professional background is required');
  if (!profile.valueProposition) errors.push('Value proposition is required');

  // Validate email format
  if (profile.email && !isValidEmail(profile.email)) {
    errors.push('Invalid email format');
  }

  // Check character limits
  if (profile.professionalBackground && profile.professionalBackground.length > 500) {
    errors.push('Professional background must be 500 characters or less');
  }

  if (profile.valueProposition && profile.valueProposition.length > 300) {
    errors.push('Value proposition must be 300 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Create a new user profile with defaults
 */
export function createUserProfile(data: Partial<UserProfile>): UserProfile {
  const now = new Date();
  const profile: UserProfile = {
    id: crypto.randomUUID(),
    email: '',
    name: '',
    currentRole: '',
    currentCompany: '',
    professionalBackground: '',
    valueProposition: '',
    defaultTone: 'professional',
    defaultLength: 'medium',
    createdAt: now,
    updatedAt: now,
    completeness: 0,
    ...data
  };

  // Calculate completeness
  profile.completeness = calculateProfileCompleteness(profile);

  return profile;
}