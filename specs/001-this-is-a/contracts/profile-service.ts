/**
 * Profile Service Contract
 *
 * Handles LinkedIn profile extraction and analysis.
 * Used by: Content scripts, Background worker
 */

import type {
  TargetProfile,
  ProfileAnalysis,
  ExtractionQuality,
} from '../data-model';

// ============================================================================
// Profile Extraction API
// ============================================================================

export interface ProfileService {
  /**
   * Extract profile data from LinkedIn page DOM
   *
   * FR-001: Extract profile information from LinkedIn profile pages
   * FR-010: Work on LinkedIn profile pages and handle non-profile pages
   * FR-012: Provide clear error messages when extraction fails
   * FR-013: Handle profiles with minimal information
   *
   * @param document - LinkedIn page DOM document
   * @returns Extracted profile data or error
   *
   * @throws {InvalidPageError} When not on a LinkedIn profile page
   * @throws {ExtractionError} When profile data cannot be extracted
   */
  extractProfile(document: Document): Promise<ExtractProfileResult>;

  /**
   * Analyze extracted profile for outreach opportunities
   *
   * FR-003: Analyze target profile and identify talking points
   * SC-001: Complete analysis within 10 seconds
   *
   * @param targetProfile - Extracted LinkedIn profile
   * @param userProfile - Current user's profile for context
   * @returns Analysis with talking points and recommendations
   *
   * @throws {AnalysisError} When LLM analysis fails
   * @throws {InsufficientDataError} When profile data too minimal
   */
  analyzeProfile(
    targetProfile: TargetProfile,
    userProfile: UserProfile,
  ): Promise<ProfileAnalysis>;

  /**
   * Check if current page is a valid LinkedIn profile page
   *
   * FR-010: Gracefully handle non-profile pages
   *
   * @param url - Current page URL
   * @returns True if URL matches LinkedIn profile pattern
   */
  isLinkedInProfilePage(url: string): boolean;

  /**
   * Get cached profile analysis if available
   *
   * Performance optimization: Avoid re-analyzing same profile
   *
   * @param targetProfileId - Profile ID
   * @returns Cached analysis or null if not found/expired
   */
  getCachedAnalysis(targetProfileId: string): Promise<ProfileAnalysis | null>;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface ExtractProfileResult {
  success: boolean;
  data?: TargetProfile;
  error?: ExtractionError;
  quality: ExtractionQuality;
  missingFields: string[];
}

export interface ExtractionError {
  code: ExtractionErrorCode;
  message: string;
  details?: unknown;
}

export enum ExtractionErrorCode {
  INVALID_PAGE = 'INVALID_PAGE',
  NO_PROFILE_DATA = 'NO_PROFILE_DATA',
  PARTIAL_EXTRACTION = 'PARTIAL_EXTRACTION',
  LINKEDIN_DOM_CHANGED = 'LINKEDIN_DOM_CHANGED',
  SCRAPING_BLOCKED = 'SCRAPING_BLOCKED',
}

// ============================================================================
// Chrome Runtime Message API
// ============================================================================

/**
 * Message-based API for content script ↔ background worker communication
 */

export type ProfileServiceMessage =
  | ExtractProfileMessage
  | AnalyzeProfileMessage
  | GetCachedAnalysisMessage;

export interface ExtractProfileMessage {
  type: 'EXTRACT_PROFILE';
  payload: {
    url: string;
    documentHtml: string; // Serialized DOM
  };
}

export interface AnalyzeProfileMessage {
  type: 'ANALYZE_PROFILE';
  payload: {
    targetProfileId: string;
    userProfileId: string;
  };
}

export interface GetCachedAnalysisMessage {
  type: 'GET_CACHED_ANALYSIS';
  payload: {
    targetProfileId: string;
  };
}

export type ProfileServiceResponse =
  | ExtractProfileResponse
  | AnalyzeProfileResponse
  | GetCachedAnalysisResponse;

export interface ExtractProfileResponse {
  type: 'EXTRACT_PROFILE_RESPONSE';
  success: boolean;
  data?: TargetProfile;
  error?: ExtractionError;
}

export interface AnalyzeProfileResponse {
  type: 'ANALYZE_PROFILE_RESPONSE';
  success: boolean;
  data?: ProfileAnalysis;
  error?: { code: string; message: string };
}

export interface GetCachedAnalysisResponse {
  type: 'GET_CACHED_ANALYSIS_RESPONSE';
  data: ProfileAnalysis | null;
}

// ============================================================================
// Error Types
// ============================================================================

export class InvalidPageError extends Error {
  constructor(url: string) {
    super(`Not a LinkedIn profile page: ${url}`);
    this.name = 'InvalidPageError';
  }
}

export class AnalysisError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'AnalysisError';
  }
}

export class InsufficientDataError extends Error {
  constructor(missingFields: string[]) {
    super(
      `Insufficient profile data. Missing: ${missingFields.join(', ')}`,
    );
    this.name = 'InsufficientDataError';
  }
}

// ============================================================================
// Implementation Notes
// ============================================================================

/**
 * LinkedIn Selector Strategy:
 * - Use multi-fallback selectors for each field (see research.md #3)
 * - Log selector success/failure for monitoring
 * - Gracefully degrade when fields missing
 *
 * Performance:
 * - Cache extracted profiles for 24 hours
 * - Cache analyses for 24 hours
 * - Batch DOM queries where possible
 *
 * Security:
 * - Never transmit full DOM to external APIs
 * - Only send extracted structured data to LLM
 * - Respect LinkedIn's robots.txt (though browser-based scraping is user-initiated)
 */
