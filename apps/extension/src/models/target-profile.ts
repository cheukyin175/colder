/**
 * Target Profile Model
 * Represents a LinkedIn profile being analyzed for outreach.
 */

import { ExtractionQuality } from './types';

export interface TargetProfile {
  // Identity
  id: string;                    // Hash of LinkedIn profile URL
  linkedinUrl: string;           // Full LinkedIn profile URL
  name: string;                  // Full name

  // Current position
  currentJobTitle: string | null;
  currentCompany: string | null;
  companyLinkedinUrl: string | null;

  // Work history
  workExperience: WorkExperience[];

  // Education
  education: Education[];

  // Activity & engagement
  recentPosts: LinkedInPost[];   // Last 5 posts
  skills: string[];              // Listed skills

  // Connection context
  mutualConnections: number;     // Count of mutual connections

  // Extraction metadata
  extractedAt: Date;
  extractionQuality: ExtractionQuality; // 'complete' | 'partial' | 'minimal'
  missingFields: string[];       // List of fields that couldn't be extracted

  // Raw profile text for AI processing (optional)
  rawProfileText?: string;       // Formatted text version of the profile for AI prompts
}

export interface WorkExperience {
  title: string;
  company: string;
  startDate: string;             // ISO date or "Present"
  endDate: string | null;
  duration: string;              // e.g., "2 yrs 3 mos"
  description: string | null;
}

export interface Education {
  institution: string;
  degree: string;
  field: string | null;
  graduationYear: number | null;
}

export interface LinkedInPost {
  content: string;               // Post text (first 500 chars)
  postedAt: Date;
  engagement: {
    likes: number;
    comments: number;
  };
}

/**
 * Calculate extraction quality based on available fields
 */
export function calculateExtractionQuality(profile: Partial<TargetProfile>): {
  quality: ExtractionQuality;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  // Check critical fields
  if (!profile.name) missingFields.push('name');
  if (!profile.linkedinUrl) missingFields.push('linkedinUrl');
  if (!profile.currentJobTitle) missingFields.push('currentJobTitle');
  if (!profile.currentCompany) missingFields.push('currentCompany');

  // Check optional but important fields
  if (!profile.workExperience || profile.workExperience.length === 0) {
    missingFields.push('workExperience');
  }
  if (!profile.education || profile.education.length === 0) {
    missingFields.push('education');
  }
  if (!profile.recentPosts || profile.recentPosts.length === 0) {
    missingFields.push('recentPosts');
  }

  // Determine quality
  let quality: ExtractionQuality;
  if (missingFields.length === 0) {
    quality = 'complete';
  } else if (!profile.currentJobTitle || !profile.currentCompany) {
    quality = 'minimal';
  } else {
    quality = 'partial';
  }

  return { quality, missingFields };
}

/**
 * Create a new target profile from extracted data
 */
export function createTargetProfile(data: Partial<TargetProfile>): TargetProfile {
  const profile: TargetProfile = {
    id: '',
    linkedinUrl: '',
    name: '',
    currentJobTitle: null,
    currentCompany: null,
    companyLinkedinUrl: null,
    workExperience: [],
    education: [],
    recentPosts: [],
    skills: [],
    mutualConnections: 0,
    extractedAt: new Date(),
    extractionQuality: 'minimal',
    missingFields: [],
    ...data
  };

  // Generate ID from LinkedIn URL if not provided
  if (!profile.id && profile.linkedinUrl) {
    profile.id = generateProfileId(profile.linkedinUrl);
  }

  // Calculate extraction quality
  const { quality, missingFields } = calculateExtractionQuality(profile);
  profile.extractionQuality = quality;
  profile.missingFields = missingFields;

  return profile;
}

/**
 * Generate a unique ID from LinkedIn URL
 */
export function generateProfileId(linkedinUrl: string): string {
  // Simple hash function for demo - in production, use a proper hash library
  let hash = 0;
  for (let i = 0; i < linkedinUrl.length; i++) {
    const char = linkedinUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check if a target profile has expired (24 hours)
 */
export function isProfileExpired(profile: TargetProfile): boolean {
  const now = Date.now();
  const extractedAt = profile.extractedAt.getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  return (now - extractedAt) > twentyFourHours;
}

/**
 * Sanitize LinkedIn post content (truncate to 500 chars)
 */
export function sanitizePostContent(content: string): string {
  return content.length > 500 ? content.substring(0, 497) + '...' : content;
}