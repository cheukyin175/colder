/**
 * Shared types used across the Colder extension
 */

// Tone presets for message generation
export type TonePreset = 'professional' | 'casual' | 'enthusiastic';

// Message length options with word count ranges
export type MessageLength = 'short' | 'medium' | 'long';

// Quality of LinkedIn profile extraction
export type ExtractionQuality = 'complete' | 'partial' | 'minimal';

// Relevance levels for talking points
export type Relevance = 'high' | 'medium' | 'low';

/**
 * User Profile Model
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  currentRole: string;
  currentCompany: string;
  professionalBackground: string;
  careerGoals?: string;
  outreachObjectives?: string;
  valueProposition: string;
}

/**
 * Target Profile Model
 */
export interface TargetProfile {
  id: string;
  linkedinUrl: string;
  name: string;
  currentJobTitle: string | null;
  currentCompany: string | null;
  rawProfileText?: string;
}

/**
 * Profile Analysis Model
 */
export interface ProfileAnalysis {
  targetProfileId: string;
  userProfileId: string;
  talkingPoints: TalkingPoint[];
  mutualInterests: string[];
  connectionOpportunities: string[];
  suggestedApproach: string;
  cautionFlags: string[];
  analyzedAt: Date;
  modelUsed: string;
  tokensUsed: number;
  analysisTime?: number;
}

export interface TalkingPoint {
  topic: string;
  relevance: Relevance;
  context: string;
  sourceField: string;
}

/**
 * Message Draft Model
 */
export interface MessageDraft {
  id: string;
  targetProfileId: string;
  analysisId: string;
  subject?: string | null;               // For email
  body: string;
  annotations: Annotation[];
  tone: TonePreset;
  length: MessageLength;
  generatedAt: Date;
  modelUsed: string;
  tokensUsed: number;
  generationTime: number;
  version: number;
}

export interface Annotation {
  text: string;
  source: 'target_profile' | 'user_profile' | 'generated';
  sourceField: string | null;
  highlight: boolean;
}
