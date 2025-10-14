/**
 * Shared types used across the Colder extension
 */

// Tone presets for message generation
export type TonePreset = 'professional' | 'casual' | 'enthusiastic';

// Message length options with word count ranges
export type MessageLength = 'short' | 'medium' | 'long';

// Quality of LinkedIn profile extraction
export type ExtractionQuality = 'complete' | 'partial' | 'minimal';

// Subscription plan tiers
export type PlanTier = 'free' | 'paid';

// Subscription plan status
export type PlanStatus = 'active' | 'expired' | 'trial' | 'cancelled';

// Message annotation source types
export type AnnotationSource = 'target_profile' | 'user_profile' | 'generated';

// Edit types for message history
export type EditType = 'manual' | 'tone_change' | 'length_change';

// Relevance levels for talking points
export type Relevance = 'high' | 'medium' | 'low';

// Theme options for UI
export type Theme = 'light' | 'dark' | 'auto';

// Word count ranges for message lengths
export const MESSAGE_LENGTH_RANGES: Record<MessageLength, { min: number; max: number }> = {
  short: { min: 50, max: 100 },
  medium: { min: 100, max: 200 },
  long: { min: 200, max: 300 }
};

// Default values
export const DEFAULTS = {
  tone: 'professional' as TonePreset,
  length: 'medium' as MessageLength,
  theme: 'auto' as Theme,
  model: 'openai/gpt-4o'
} as const;

// Storage keys
export const STORAGE_KEYS = {
  userProfile: 'userProfile',
  targetProfiles: 'targetProfiles',
  profileAnalyses: 'profileAnalyses',
  messageDrafts: 'messageDrafts',
  outreachHistory: 'outreachHistory',
  subscriptionPlan: 'subscriptionPlan',
  extensionSettings: 'extensionSettings'
} as const;

// Time constants
export const RETENTION_PERIODS = {
  targetProfile: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  profileAnalysis: 24 * 60 * 60 * 1000, // 24 hours
  messageDraft: 7 * 24 * 60 * 60 * 1000, // 7 days
  freeOutreachHistory: 5 * 24 * 60 * 60 * 1000 // 5 days
} as const;

// Plan limits
export const PLAN_LIMITS = {
  free: {
    historyRetentionDays: 5,
    monthlyMessageLimit: 50,
    yoloModeEnabled: false
  },
  paid: {
    historyRetentionDays: null, // Indefinite
    monthlyMessageLimit: null, // Unlimited
    yoloModeEnabled: true
  }
} as const;