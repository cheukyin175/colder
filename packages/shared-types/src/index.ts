// User related types
export interface User {
  id: string;
  email: string;
  name?: string;
  userName?: string;
  userRole?: string;
  userCompany?: string;
  userBackground?: string;
  userValueProposition?: string;
  credits: number;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  createdAt: Date;
  updatedAt: Date;
}

// Profile related types
export interface TargetProfile {
  id: string;
  linkedinUrl: string;
  name: string;
  currentJobTitle?: string;
  currentCompany?: string;
  rawProfileText: string;
}

// Message generation types
export type TonePreset = 'professional' | 'casual' | 'enthusiastic' | 'formal' | 'friendly';
export type MessageLength = 'short' | 'medium' | 'long';
export type MessagePurpose =
  | 'connection'
  | 'coffee_chat'
  | 'informational_interview'
  | 'collaboration'
  | 'job_inquiry'
  | 'sales'
  | 'custom';

export interface GenerateMessageDto {
  targetProfile: TargetProfile;
  tone?: TonePreset;
  purpose?: MessagePurpose;
  customPurpose?: string;
  length?: MessageLength;
}

export interface PolishMessageDto {
  originalMessage: string;
  userFeedback: string;
  tone?: TonePreset;
  length?: MessageLength;
}

export interface MessageDraft {
  body: string;
  wordCount?: number;
  annotations?: string[];
}

export interface PolishedMessage {
  body: string;
  wordCount?: number;
  changes?: string[];
}

// Settings types
export interface UserSettings {
  userName?: string;
  userRole?: string;
  userCompany?: string;
  userBackground?: string;
  userValueProposition?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreditResponse {
  credits: number;
  creditsUsed: number;
  creditsRemaining: number;
}

// Analysis types
export interface ProfileAnalysis {
  keySkills: string[];
  experience: string[];
  interests: string[];
  commonalities: string[];
  outreachAngle: string;
}