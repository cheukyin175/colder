/**
 * Storage Service Contract
 *
 * Handles data persistence using Chrome Storage API.
 * Used by: All services, Background worker, UI components
 */

import type {
  UserProfile,
  TargetProfile,
  ProfileAnalysis,
  MessageDraft,
  OutreachHistory,
  SubscriptionPlan,
  ExtensionSettings,
} from '../data-model';

// ============================================================================
// Storage Service API
// ============================================================================

export interface StorageService {
  // --------------------------------------------------------------------------
  // User Profile
  // --------------------------------------------------------------------------

  /**
   * Get current user's profile
   *
   * FR-002: Store user profile information
   * FR-011: Persist data securely across sessions
   *
   * @returns User profile or null if not set up
   */
  getUserProfile(): Promise<UserProfile | null>;

  /**
   * Save or update user profile
   *
   * FR-002: Allow users to create and update profile
   *
   * @param profile - User profile to save
   */
  saveUserProfile(profile: UserProfile): Promise<void>;

  /**
   * Delete user profile
   *
   * Privacy: Allow users to delete their data
   */
  deleteUserProfile(): Promise<void>;

  // --------------------------------------------------------------------------
  // Target Profiles (Cached)
  // --------------------------------------------------------------------------

  /**
   * Get cached target profile
   *
   * Performance: Avoid re-extracting same profile
   *
   * @param profileId - Target profile ID
   * @returns Cached profile or null if not found/expired
   */
  getTargetProfile(profileId: string): Promise<TargetProfile | null>;

  /**
   * Cache target profile
   *
   * TTL: 24 hours (privacy consideration)
   *
   * @param profile - Target profile to cache
   */
  cacheTargetProfile(profile: TargetProfile): Promise<void>;

  /**
   * Clear expired target profiles
   *
   * Privacy: Auto-cleanup after 24 hours
   */
  clearExpiredTargetProfiles(): Promise<void>;

  // --------------------------------------------------------------------------
  // Profile Analyses (Cached)
  // --------------------------------------------------------------------------

  /**
   * Get cached profile analysis
   *
   * Performance: Avoid re-analyzing same profile
   *
   * @param analysisId - Analysis ID
   * @returns Cached analysis or null if not found/expired
   */
  getProfileAnalysis(analysisId: string): Promise<ProfileAnalysis | null>;

  /**
   * Cache profile analysis
   *
   * TTL: 24 hours
   *
   * @param analysis - Profile analysis to cache
   */
  cacheProfileAnalysis(analysis: ProfileAnalysis): Promise<void>;

  // --------------------------------------------------------------------------
  // Message Drafts
  // --------------------------------------------------------------------------

  /**
   * Get message draft by ID
   *
   * @param draftId - Draft ID
   * @returns Message draft or null if not found
   */
  getMessageDraft(draftId: string): Promise<MessageDraft | null>;

  /**
   * Save message draft
   *
   * FR-008: Persist draft with manual edits
   *
   * @param draft - Message draft to save
   */
  saveMessageDraft(draft: MessageDraft): Promise<void>;

  /**
   * Delete message draft
   *
   * Cleanup: Remove draft after sending or expiration
   *
   * @param draftId - Draft ID to delete
   */
  deleteMessageDraft(draftId: string): Promise<void>;

  /**
   * Get all message drafts
   *
   * UI: Display list of unsent drafts
   *
   * @returns All saved message drafts
   */
  getAllMessageDrafts(): Promise<MessageDraft[]>;

  // --------------------------------------------------------------------------
  // Outreach History
  // --------------------------------------------------------------------------

  /**
   * Record outreach contact
   *
   * FR-014: Maintain history of analyzed profiles and messages
   * FR-015: Notify on revisit, respect retention period
   *
   * @param history - Outreach history entry
   */
  saveOutreachHistory(history: OutreachHistory): Promise<void>;

  /**
   * Get outreach history for specific target
   *
   * FR-015: Check if target previously contacted
   *
   * @param linkedinUrl - Target's LinkedIn URL
   * @returns History entry or null if never contacted
   */
  getOutreachHistoryByUrl(
    linkedinUrl: string,
  ): Promise<OutreachHistory | null>;

  /**
   * Get all outreach history entries
   *
   * SC-006: Support 100+ entries without degradation
   *
   * @param options - Pagination and filtering options
   * @returns Paginated history entries
   */
  getOutreachHistory(
    options?: HistoryQueryOptions,
  ): Promise<OutreachHistoryPage>;

  /**
   * Delete outreach history entry
   *
   * Privacy: User-controlled deletion
   *
   * @param historyId - History entry ID
   */
  deleteOutreachHistory(historyId: string): Promise<void>;

  /**
   * Clear expired history entries
   *
   * FR-015: Free plan 5-day retention, paid plan indefinite
   *
   * Runs automatically in background worker
   */
  clearExpiredOutreachHistory(): Promise<void>;

  /**
   * Search outreach history
   *
   * SC-006: Fast search across 100+ entries
   *
   * @param query - Search query
   * @returns Matching history entries
   */
  searchOutreachHistory(query: string): Promise<OutreachHistory[]>;

  // --------------------------------------------------------------------------
  // Subscription Plan
  // --------------------------------------------------------------------------

  /**
   * Get current subscription plan
   *
   * FR-017: Support free and paid plans
   *
   * @returns Current subscription plan
   */
  getSubscriptionPlan(): Promise<SubscriptionPlan>;

  /**
   * Update subscription plan
   *
   * FR-017: Allow plan upgrades/changes
   *
   * @param plan - Updated subscription plan
   */
  saveSubscriptionPlan(plan: SubscriptionPlan): Promise<void>;

  /**
   * Check if feature is available for current plan
   *
   * FR-018: Gate features by plan
   *
   * @param feature - Feature to check
   * @returns True if feature available
   */
  hasFeatureAccess(feature: PlanFeature): Promise<boolean>;

  // --------------------------------------------------------------------------
  // Extension Settings
  // --------------------------------------------------------------------------

  /**
   * Get extension settings
   *
   * Configuration: User preferences and API keys
   *
   * @returns Current settings
   */
  getSettings(): Promise<ExtensionSettings>;

  /**
   * Update extension settings
   *
   * @param settings - Updated settings
   */
  saveSettings(settings: Partial<ExtensionSettings>): Promise<void>;

  /**
   * Clear all extension data
   *
   * Privacy: Complete data wipe
   *
   * @param confirmation - Must be "CONFIRM_DELETE_ALL"
   */
  clearAllData(confirmation: string): Promise<void>;

  // --------------------------------------------------------------------------
  // Storage Monitoring
  // --------------------------------------------------------------------------

  /**
   * Get storage usage statistics
   *
   * Monitoring: Track storage consumption
   *
   * @returns Storage usage in bytes
   */
  getStorageUsage(): Promise<StorageUsage>;

  /**
   * Run storage cleanup
   *
   * Maintenance: Remove expired data, compact storage
   */
  runCleanup(): Promise<CleanupResult>;
}

// ============================================================================
// Query Types
// ============================================================================

export interface HistoryQueryOptions {
  limit?: number; // Default: 50
  offset?: number; // Default: 0
  sortBy?: 'contactedAt' | 'targetName' | 'targetCompany';
  sortOrder?: 'asc' | 'desc';
  status?: OutreachStatus; // Filter by status
  dateFrom?: Date; // Filter by date range
  dateTo?: Date;
}

export interface OutreachHistoryPage {
  entries: OutreachHistory[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
}

export type PlanFeature =
  | 'unlimited_history'
  | 'yolo_mode'
  | 'priority_support'
  | 'custom_tone';

export interface StorageUsage {
  sync: {
    used: number; // Bytes
    quota: number; // 102,400 bytes (100KB)
    percentage: number;
  };
  local: {
    used: number; // Bytes
    quota: number; // 10,485,760 bytes (10MB)
    percentage: number;
  };
}

export interface CleanupResult {
  expiredTargetProfiles: number;
  expiredAnalyses: number;
  expiredDrafts: number;
  expiredHistory: number;
  bytesFreed: number;
}

// ============================================================================
// Storage Keys (Internal)
// ============================================================================

/**
 * Standardized storage keys for consistency
 */

export const STORAGE_KEYS = {
  // Sync storage (max 100KB)
  USER_PROFILE: 'user_profile',
  SUBSCRIPTION_PLAN: 'subscription_plan',
  SETTINGS: 'settings',

  // Local storage (max 10MB)
  TARGET_PROFILES: 'target_profiles', // Map<id, TargetProfile>
  PROFILE_ANALYSES: 'profile_analyses', // Map<id, ProfileAnalysis>
  MESSAGE_DRAFTS: 'message_drafts', // Map<id, MessageDraft>
  OUTREACH_HISTORY: 'outreach_history', // Map<id, OutreachHistory>
  OUTREACH_HISTORY_INDEX: 'outreach_history_index', // Map<linkedinUrl, historyId>

  // OAuth tokens (local storage for security)
  GMAIL_OAUTH_TOKEN: 'gmail_oauth_token',
} as const;

// ============================================================================
// Chrome Runtime Message API
// ============================================================================

/**
 * Message-based API for storage operations across contexts
 */

export type StorageServiceMessage =
  | GetUserProfileMessage
  | SaveUserProfileMessage
  | GetOutreachHistoryMessage
  | SaveOutreachHistoryMessage
  | GetSettingsMessage
  | SaveSettingsMessage;

export interface GetUserProfileMessage {
  type: 'STORAGE_GET_USER_PROFILE';
}

export interface SaveUserProfileMessage {
  type: 'STORAGE_SAVE_USER_PROFILE';
  payload: { profile: UserProfile };
}

export interface GetOutreachHistoryMessage {
  type: 'STORAGE_GET_OUTREACH_HISTORY';
  payload: { options?: HistoryQueryOptions };
}

export interface SaveOutreachHistoryMessage {
  type: 'STORAGE_SAVE_OUTREACH_HISTORY';
  payload: { history: OutreachHistory };
}

export interface GetSettingsMessage {
  type: 'STORAGE_GET_SETTINGS';
}

export interface SaveSettingsMessage {
  type: 'STORAGE_SAVE_SETTINGS';
  payload: { settings: Partial<ExtensionSettings> };
}

// ============================================================================
// Error Types
// ============================================================================

export class StorageQuotaExceededError extends Error {
  constructor(
    storageType: 'sync' | 'local',
    public used: number,
    public quota: number,
  ) {
    super(
      `${storageType} storage quota exceeded: ${used}/${quota} bytes`,
    );
    this.name = 'StorageQuotaExceededError';
  }
}

export class StorageAccessError extends Error {
  constructor(
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = 'StorageAccessError';
  }
}

// ============================================================================
// Implementation Notes
// ============================================================================

/**
 * Storage Architecture:
 *
 * Sync Storage (100KB limit):
 * - UserProfile (~5KB)
 * - SubscriptionPlan (~1KB)
 * - ExtensionSettings (~2KB)
 * Total: ~8KB (safe margin)
 *
 * Local Storage (10MB limit):
 * - Target profiles (cached, 24h TTL, ~2KB each, max 50 = 100KB)
 * - Profile analyses (cached, 24h TTL, ~5KB each, max 50 = 250KB)
 * - Message drafts (~3KB each, max 100 = 300KB)
 * - Outreach history (5-day/indefinite retention, ~3KB each)
 * - OAuth tokens (~1KB)
 * Total: ~800KB estimated (well under limit)
 *
 * Indexing Strategy:
 * - Outreach history indexed by LinkedIn URL for fast duplicate checks (FR-015)
 * - Search implemented with in-memory filtering (acceptable for 100+ entries)
 * - Consider IndexedDB for larger datasets in future
 *
 * Cleanup Schedule:
 * - Run cleanup daily at midnight (background worker alarm)
 * - Remove expired target profiles (> 24h)
 * - Remove expired analyses (> 24h)
 * - Remove expired drafts (> 7 days unsent)
 * - Remove expired history (free plan only, > 5 days)
 *
 * Security:
 * - Chrome Storage API handles encryption automatically
 * - OAuth tokens stored in local storage (not sync for security)
 * - API keys stored in sync storage (encrypted by Chrome)
 * - No additional encryption needed for MVP
 *
 * Performance:
 * - Batch reads/writes where possible
 * - Use chrome.storage.local.get(keys) with specific keys
 * - Avoid reading entire storage on every operation
 * - Cache frequently accessed data in memory (service worker)
 */
