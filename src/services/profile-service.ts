/**
 * Profile Service Implementation
 *
 * Handles LinkedIn profile extraction and analysis.
 * Used by content scripts and background worker.
 */

import type { UserProfile } from '../models/user-profile';
import type { TargetProfile } from '../models/target-profile';
import type { ProfileAnalysis } from '../models/profile-analysis';
import type { ExtractionQuality } from '../models/types';
import { extractProfileForAI, formatProfileForPrompt } from '../utils/linkedin-selectors';
import { storageService } from './storage-service';

// ============================================================================
// Error Classes
// ============================================================================

export class InvalidPageError extends Error {
  constructor(url: string) {
    super(`Not a LinkedIn profile page: ${url}`);
    this.name = 'InvalidPageError';
  }
}

export class ExtractionError extends Error {
  public code: ExtractionErrorCode;
  public details?: unknown;

  constructor(message: string, code: ExtractionErrorCode, details?: unknown) {
    super(message);
    this.name = 'ExtractionError';
    this.code = code;
    this.details = details;
  }
}

export class AnalysisError extends Error {
  public override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AnalysisError';
    this.cause = cause;
  }
}

export class InsufficientDataError extends Error {
  constructor(missingFields: string[]) {
    super(
      `Insufficient profile data. Missing: ${missingFields.join(', ')}`
    );
    this.name = 'InsufficientDataError';
  }
}

// ============================================================================
// Types
// ============================================================================

export enum ExtractionErrorCode {
  INVALID_PAGE = 'INVALID_PAGE',
  NO_PROFILE_DATA = 'NO_PROFILE_DATA',
  PARTIAL_EXTRACTION = 'PARTIAL_EXTRACTION',
  LINKEDIN_DOM_CHANGED = 'LINKEDIN_DOM_CHANGED',
  SCRAPING_BLOCKED = 'SCRAPING_BLOCKED',
}

export interface ExtractProfileResult {
  success: boolean;
  data?: TargetProfile;
  error?: {
    code: ExtractionErrorCode;
    message: string;
    details?: unknown;
  };
  quality: ExtractionQuality;
  missingFields: string[];
}

// ============================================================================
// Profile Service Implementation
// ============================================================================

export class ProfileService {
  /**
   * Check if current page is a valid LinkedIn profile page
   * FR-010: Gracefully handle non-profile pages
   */
  isLinkedInProfilePage(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // LinkedIn profile URLs follow pattern: linkedin.com/in/[username]
      return (
        urlObj.hostname.includes('linkedin.com') &&
        urlObj.pathname.startsWith('/in/')
      );
    } catch {
      return false;
    }
  }

  /**
   * Extract profile data from LinkedIn page DOM
   * FR-001, FR-010, FR-012, FR-013
   */
  async extractProfile(document: Document): Promise<ExtractProfileResult> {
    const url = document.location?.href || '';

    // Check if valid LinkedIn profile page
    if (!this.isLinkedInProfilePage(url)) {
      return {
        success: false,
        error: {
          code: ExtractionErrorCode.INVALID_PAGE,
          message: 'Not a LinkedIn profile page',
          details: { url }
        },
        quality: 'minimal',
        missingFields: ['all']
      };
    }

    try {
      // Use the simplified extraction approach - get raw text for AI
      const profileData = extractProfileForAI();

      // Determine extraction quality based on available data
      const missingFields: string[] = [];
      let quality: ExtractionQuality = 'complete';

      if (!profileData.name) {
        missingFields.push('name');
        quality = 'minimal';
      }

      if (!profileData.headline) {
        missingFields.push('headline');
        if (quality === 'complete') quality = 'partial';
      }

      if (!profileData.about || profileData.about.length < 50) {
        missingFields.push('about');
        if (quality === 'complete') quality = 'partial';
      }

      if (!profileData.experience || profileData.experience.length < 50) {
        missingFields.push('experience');
        if (quality === 'complete') quality = 'partial';
      }

      // Create a simplified TargetProfile object
      // Note: The AI will extract details from the raw text
      const targetProfile: TargetProfile = {
        id: this.generateProfileId(url),
        linkedinUrl: url,
        name: profileData.name || 'Unknown',
        currentJobTitle: profileData.headline?.split(' at ')[0] || null,
        currentCompany: profileData.headline?.split(' at ')[1] || null,
        companyLinkedinUrl: null,
        workExperience: [], // Will be extracted by AI from raw text
        education: [], // Will be extracted by AI from raw text
        recentPosts: [], // Already in raw text format
        skills: profileData.skills || [],
        mutualConnections: 0,
        extractedAt: new Date(),
        extractionQuality: quality,
        missingFields,
        // Store raw text for AI processing
        rawProfileText: formatProfileForPrompt()
      };

      return {
        success: true,
        data: targetProfile,
        quality,
        missingFields
      };

    } catch (error) {
      console.error('Profile extraction failed:', error);

      return {
        success: false,
        error: {
          code: ExtractionErrorCode.LINKEDIN_DOM_CHANGED,
          message: 'Failed to extract profile data',
          details: error
        },
        quality: 'minimal',
        missingFields: ['all']
      };
    }
  }

  /**
   * Analyze extracted profile for outreach opportunities
   * FR-003, SC-001
   */
  async analyzeProfile(
    targetProfile: TargetProfile,
    userProfile: UserProfile
  ): Promise<ProfileAnalysis> {
    // Import the agent dynamically to avoid circular dependencies
    const { profileAnalyzerAgent } = await import('../background/agent/profile-analyzer');

    // Use the LangChain agent to analyze the profile
    return await profileAnalyzerAgent.analyzeProfile(targetProfile, userProfile);
  }

  /**
   * Get cached profile analysis if available
   */
  async getCachedAnalysis(targetProfileId: string): Promise<ProfileAnalysis | null> {
    try {
      // Generate analysis ID (combination of target and user profile IDs)
      const userProfile = await storageService.getUserProfile();
      if (!userProfile) return null;

      const analysisId = this.generateAnalysisId(targetProfileId, userProfile.id);
      return await storageService.getProfileAnalysis(analysisId);
    } catch (error) {
      console.error('Failed to get cached analysis:', error);
      return null;
    }
  }

  /**
   * Generate unique ID for profile based on URL
   */
  private generateProfileId(url: string): string {
    // Use URL as the unique identifier
    // In a real implementation, might use crypto.subtle.digest
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  /**
   * Generate unique ID for analysis based on target and user profiles
   */
  private generateAnalysisId(targetProfileId: string, userProfileId: string): string {
    return `${targetProfileId}_${userProfileId}`;
  }
}

// Export singleton instance
export const profileService = new ProfileService();