/**
 * Storage Service Implementation
 * Handles data persistence using Chrome Storage API.
 */

import { STORAGE_KEYS as MODEL_STORAGE_KEYS, RETENTION_PERIODS } from '../models/types';
import { UserProfile, createUserProfile } from '../models/user-profile';
import { ExtensionSettings, createDefaultSettings } from '../models/extension-settings';
import { SubscriptionPlan, createSubscriptionPlan } from '../models/subscription-plan';
import { TargetProfile, isProfileExpired } from '../models/target-profile';
import { ProfileAnalysis, isAnalysisExpired } from '../models/profile-analysis';
import { MessageDraft, isDraftExpired } from '../models/message-draft';
import { OutreachHistory, isHistoryExpired } from '../models/outreach-history';
import { StorageError, handleStorageError } from '../utils/error-handlers';

// Re-export types for convenience
export type {
  UserProfile,
  ExtensionSettings,
  SubscriptionPlan,
  TargetProfile,
  ProfileAnalysis,
  MessageDraft,
  OutreachHistory
};

/**
 * Storage usage information
 */
export interface StorageUsage {
  sync: {
    used: number;
    quota: number;
    percentage: number;
  };
  local: {
    used: number;
    quota: number;
    percentage: number;
  };
}

/**
 * Storage Service - Core methods for Phase 2
 * Additional methods will be added in user story phases
 */
class StorageServiceImpl {
  // Storage quota limits
  private readonly SYNC_QUOTA = 102400; // 100KB
  private readonly LOCAL_QUOTA = 10485760; // 10MB

  // --------------------------------------------------------------------------
  // User Profile
  // --------------------------------------------------------------------------

  /**
   * Get current user's profile
   */
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const result = await chrome.storage.sync.get(MODEL_STORAGE_KEYS.userProfile);
      const profile = result[MODEL_STORAGE_KEYS.userProfile];

      if (!profile) {
        return null;
      }

      // Convert date strings back to Date objects
      return {
        ...profile,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt)
      };
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Save or update user profile
   */
  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      // Update timestamp
      const updatedProfile = {
        ...profile,
        updatedAt: new Date()
      };

      await chrome.storage.sync.set({
        [MODEL_STORAGE_KEYS.userProfile]: updatedProfile
      });
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Delete user profile
   */
  async deleteUserProfile(): Promise<void> {
    try {
      await chrome.storage.sync.remove(MODEL_STORAGE_KEYS.userProfile);
    } catch (error) {
      handleStorageError(error);
    }
  }

  // --------------------------------------------------------------------------
  // Extension Settings
  // --------------------------------------------------------------------------

  /**
   * Get extension settings
   */
  async getSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.sync.get(MODEL_STORAGE_KEYS.extensionSettings);
      const settings = result[MODEL_STORAGE_KEYS.extensionSettings];

      if (!settings) {
        // Return default settings if not set
        return createDefaultSettings();
      }

      return settings;
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Update extension settings
   */
  async saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    try {
      // Get current settings
      const currentSettings = await this.getSettings();

      // Merge with new settings
      const updatedSettings = {
        ...currentSettings,
        ...settings
      };

      // Save to sync storage (except OAuth token)
      const { gmailOAuthToken, ...syncSettings } = updatedSettings;
      await chrome.storage.sync.set({
        [MODEL_STORAGE_KEYS.extensionSettings]: syncSettings
      });

      // Save OAuth token to local storage for security
      if (gmailOAuthToken !== undefined) {
        await chrome.storage.local.set({
          gmailOAuthToken
        });
      }
    } catch (error) {
      handleStorageError(error);
    }
  }

  // --------------------------------------------------------------------------
  // Subscription Plan
  // --------------------------------------------------------------------------

  /**
   * Get current subscription plan
   */
  async getSubscriptionPlan(): Promise<SubscriptionPlan> {
    try {
      const result = await chrome.storage.sync.get(MODEL_STORAGE_KEYS.subscriptionPlan);
      const plan = result[MODEL_STORAGE_KEYS.subscriptionPlan];

      if (!plan) {
        // Create default free plan if not set
        const userProfile = await this.getUserProfile();
        const defaultPlan = createSubscriptionPlan(userProfile?.id || 'default');
        await this.saveSubscriptionPlan(defaultPlan);
        return defaultPlan;
      }

      // Convert date strings back to Date objects
      return {
        ...plan,
        purchasedAt: plan.purchasedAt ? new Date(plan.purchasedAt) : null,
        expiresAt: plan.expiresAt ? new Date(plan.expiresAt) : null,
        monthlyUsage: {
          ...plan.monthlyUsage,
          resetDate: new Date(plan.monthlyUsage.resetDate)
        }
      };
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Update subscription plan
   */
  async saveSubscriptionPlan(plan: SubscriptionPlan): Promise<void> {
    try {
      await chrome.storage.sync.set({
        [MODEL_STORAGE_KEYS.subscriptionPlan]: plan
      });
    } catch (error) {
      handleStorageError(error);
    }
  }

  // --------------------------------------------------------------------------
  // Target Profiles (Cached)
  // --------------------------------------------------------------------------

  /**
   * Get cached target profile
   */
  async getTargetProfile(profileId: string): Promise<TargetProfile | null> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.targetProfiles);
      const profiles = result[MODEL_STORAGE_KEYS.targetProfiles] || {};

      const profile = profiles[profileId];
      if (!profile) return null;

      // Check if expired (24 hours)
      const profileWithDate = {
        ...profile,
        extractedAt: new Date(profile.extractedAt)
      };

      if (isProfileExpired(profileWithDate)) {
        // Remove expired profile
        await this.removeTargetProfile(profileId);
        return null;
      }

      return profileWithDate;
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Cache target profile with 24-hour TTL
   */
  async cacheTargetProfile(profile: TargetProfile): Promise<void> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.targetProfiles);
      const profiles = result[MODEL_STORAGE_KEYS.targetProfiles] || {};

      profiles[profile.id] = profile;

      await chrome.storage.local.set({
        [MODEL_STORAGE_KEYS.targetProfiles]: profiles
      });
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Clear expired target profiles
   */
  async clearExpiredTargetProfiles(): Promise<number> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.targetProfiles);
      const profiles = result[MODEL_STORAGE_KEYS.targetProfiles] || {};

      let clearedCount = 0;
      const activeProfiles: Record<string, TargetProfile> = {};

      for (const [id, profile] of Object.entries(profiles)) {
        const profileWithDate = {
          ...profile,
          extractedAt: new Date(profile.extractedAt)
        } as TargetProfile;

        if (!isProfileExpired(profileWithDate)) {
          activeProfiles[id] = profile as TargetProfile;
        } else {
          clearedCount++;
        }
      }

      await chrome.storage.local.set({
        [MODEL_STORAGE_KEYS.targetProfiles]: activeProfiles
      });

      return clearedCount;
    } catch (error) {
      handleStorageError(error);
    }
  }

  private async removeTargetProfile(profileId: string): Promise<void> {
    const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.targetProfiles);
    const profiles = result[MODEL_STORAGE_KEYS.targetProfiles] || {};
    delete profiles[profileId];
    await chrome.storage.local.set({
      [MODEL_STORAGE_KEYS.targetProfiles]: profiles
    });
  }

  // --------------------------------------------------------------------------
  // Profile Analyses (Cached)
  // --------------------------------------------------------------------------

  /**
   * Get cached profile analysis
   */
  async getProfileAnalysis(analysisId: string): Promise<ProfileAnalysis | null> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.profileAnalyses);
      const analyses = result[MODEL_STORAGE_KEYS.profileAnalyses] || {};

      const analysis = analyses[analysisId];
      if (!analysis) return null;

      // Check if expired (24 hours)
      const analysisWithDate = {
        ...analysis,
        analyzedAt: new Date(analysis.analyzedAt)
      };

      if (isAnalysisExpired(analysisWithDate)) {
        // Remove expired analysis
        await this.removeProfileAnalysis(analysisId);
        return null;
      }

      return analysisWithDate;
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Cache profile analysis with 24-hour TTL
   */
  async cacheProfileAnalysis(analysis: ProfileAnalysis): Promise<void> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.profileAnalyses);
      const analyses = result[MODEL_STORAGE_KEYS.profileAnalyses] || {};

      // Generate ID from target and user profile IDs
      const analysisId = `${analysis.targetProfileId}_${analysis.userProfileId}`;
      analyses[analysisId] = analysis;

      await chrome.storage.local.set({
        [MODEL_STORAGE_KEYS.profileAnalyses]: analyses
      });
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Clear expired profile analyses
   */
  async clearExpiredProfileAnalyses(): Promise<number> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.profileAnalyses);
      const analyses = result[MODEL_STORAGE_KEYS.profileAnalyses] || {};

      let clearedCount = 0;
      const activeAnalyses: Record<string, ProfileAnalysis> = {};

      for (const [id, analysis] of Object.entries(analyses)) {
        const analysisWithDate = {
          ...analysis,
          analyzedAt: new Date(analysis.analyzedAt)
        } as ProfileAnalysis;

        if (!isAnalysisExpired(analysisWithDate)) {
          activeAnalyses[id] = analysis as ProfileAnalysis;
        } else {
          clearedCount++;
        }
      }

      await chrome.storage.local.set({
        [MODEL_STORAGE_KEYS.profileAnalyses]: activeAnalyses
      });

      return clearedCount;
    } catch (error) {
      handleStorageError(error);
    }
  }

  private async removeProfileAnalysis(analysisId: string): Promise<void> {
    const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.profileAnalyses);
    const analyses = result[MODEL_STORAGE_KEYS.profileAnalyses] || {};
    delete analyses[analysisId];
    await chrome.storage.local.set({
      [MODEL_STORAGE_KEYS.profileAnalyses]: analyses
    });
  }

  // --------------------------------------------------------------------------
  // Message Drafts
  // --------------------------------------------------------------------------

  /**
   * Get message draft by ID
   */
  async getMessageDraft(draftId: string): Promise<MessageDraft | null> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.messageDrafts);
      const drafts = result[MODEL_STORAGE_KEYS.messageDrafts] || {};

      const draft = drafts[draftId];
      if (!draft) return null;

      // Convert date strings back to Date objects
      const draftWithDates = {
        ...draft,
        generatedAt: new Date(draft.generatedAt),
        manualEdits: draft.manualEdits?.map((edit: any) => ({
          ...edit,
          timestamp: new Date(edit.timestamp)
        })) || []
      };

      // Check if expired (7 days)
      if (isDraftExpired(draftWithDates)) {
        await this.deleteMessageDraft(draftId);
        return null;
      }

      return draftWithDates;
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Save message draft
   */
  async saveMessageDraft(draft: MessageDraft): Promise<void> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.messageDrafts);
      const drafts = result[MODEL_STORAGE_KEYS.messageDrafts] || {};

      drafts[draft.id] = draft;

      await chrome.storage.local.set({
        [MODEL_STORAGE_KEYS.messageDrafts]: drafts
      });
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Delete message draft
   */
  async deleteMessageDraft(draftId: string): Promise<void> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.messageDrafts);
      const drafts = result[MODEL_STORAGE_KEYS.messageDrafts] || {};

      delete drafts[draftId];

      await chrome.storage.local.set({
        [MODEL_STORAGE_KEYS.messageDrafts]: drafts
      });
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Get all message drafts
   */
  async getAllMessageDrafts(): Promise<MessageDraft[]> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.messageDrafts);
      const drafts = result[MODEL_STORAGE_KEYS.messageDrafts] || {};

      const draftList: MessageDraft[] = [];

      for (const [id, draft] of Object.entries(drafts)) {
        const draftWithDates = {
          ...draft,
          generatedAt: new Date(draft.generatedAt),
          manualEdits: draft.manualEdits?.map((edit: any) => ({
            ...edit,
            timestamp: new Date(edit.timestamp)
          })) || []
        } as MessageDraft;

        // Skip expired drafts
        if (!isDraftExpired(draftWithDates)) {
          draftList.push(draftWithDates);
        }
      }

      // Sort by generation date, newest first
      return draftList.sort((a, b) =>
        b.generatedAt.getTime() - a.generatedAt.getTime()
      );
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Clear expired message drafts
   */
  async clearExpiredMessageDrafts(): Promise<number> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.messageDrafts);
      const drafts = result[MODEL_STORAGE_KEYS.messageDrafts] || {};

      let clearedCount = 0;
      const activeDrafts: Record<string, MessageDraft> = {};

      for (const [id, draft] of Object.entries(drafts)) {
        const draftWithDates = {
          ...draft,
          generatedAt: new Date(draft.generatedAt),
          manualEdits: draft.manualEdits?.map((edit: any) => ({
            ...edit,
            timestamp: new Date(edit.timestamp)
          })) || []
        } as MessageDraft;

        if (!isDraftExpired(draftWithDates)) {
          activeDrafts[id] = draft as MessageDraft;
        } else {
          clearedCount++;
        }
      }

      await chrome.storage.local.set({
        [MODEL_STORAGE_KEYS.messageDrafts]: activeDrafts
      });

      return clearedCount;
    } catch (error) {
      handleStorageError(error);
    }
  }

  // --------------------------------------------------------------------------
  // Outreach History (US4 - Added for completeness)
  // --------------------------------------------------------------------------

  /**
   * Save outreach history entry
   */
  async saveOutreachHistory(history: OutreachHistory): Promise<void> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.outreachHistory);
      const histories = result[MODEL_STORAGE_KEYS.outreachHistory] || {};

      histories[history.id] = history;

      await chrome.storage.local.set({
        [MODEL_STORAGE_KEYS.outreachHistory]: histories
      });
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Get outreach history by LinkedIn URL
   */
  async getOutreachHistoryByUrl(linkedinUrl: string): Promise<OutreachHistory | null> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.outreachHistory);
      const histories = result[MODEL_STORAGE_KEYS.outreachHistory] || {};

      // Normalize URL for comparison
      const normalizedUrl = this.normalizeLinkedInUrl(linkedinUrl);

      for (const history of Object.values(histories)) {
        const h = history as OutreachHistory;
        if (this.normalizeLinkedInUrl(h.targetLinkedinUrl) === normalizedUrl) {
          // Check if expired for free plan
          const historyWithDate = {
            ...h,
            contactedAt: new Date(h.contactedAt),
            expiresAt: h.expiresAt ? new Date(h.expiresAt) : null
          };

          if (!isHistoryExpired(historyWithDate)) {
            return historyWithDate;
          }
        }
      }

      return null;
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Get all outreach history
   */
  async getAllOutreachHistory(): Promise<OutreachHistory[]> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.outreachHistory);
      const histories = result[MODEL_STORAGE_KEYS.outreachHistory] || {};

      const historyList: OutreachHistory[] = [];

      for (const history of Object.values(histories)) {
        const h = history as OutreachHistory;
        const historyWithDate = {
          ...h,
          contactedAt: new Date(h.contactedAt),
          expiresAt: h.expiresAt ? new Date(h.expiresAt) : null
        };

        // Skip expired entries for free plan
        if (!isHistoryExpired(historyWithDate)) {
          historyList.push(historyWithDate);
        }
      }

      // Sort by contact date, newest first
      return historyList.sort((a, b) =>
        b.contactedAt.getTime() - a.contactedAt.getTime()
      );
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Clear expired outreach history (free plan only)
   */
  async clearExpiredOutreachHistory(): Promise<number> {
    try {
      const result = await chrome.storage.local.get(MODEL_STORAGE_KEYS.outreachHistory);
      const histories = result[MODEL_STORAGE_KEYS.outreachHistory] || {};

      let clearedCount = 0;
      const activeHistories: Record<string, OutreachHistory> = {};

      for (const [id, history] of Object.entries(histories)) {
        const h = history as OutreachHistory;
        const historyWithDate = {
          ...h,
          contactedAt: new Date(h.contactedAt),
          expiresAt: h.expiresAt ? new Date(h.expiresAt) : null
        };

        if (!isHistoryExpired(historyWithDate)) {
          activeHistories[id] = history as OutreachHistory;
        } else {
          clearedCount++;
        }
      }

      await chrome.storage.local.set({
        [MODEL_STORAGE_KEYS.outreachHistory]: activeHistories
      });

      return clearedCount;
    } catch (error) {
      handleStorageError(error);
    }
  }

  // --------------------------------------------------------------------------
  // Storage Monitoring
  // --------------------------------------------------------------------------

  /**
   * Get storage usage statistics
   */
  async getStorageUsage(): Promise<StorageUsage> {
    try {
      // Get sync storage usage
      const syncUsage = await chrome.storage.sync.getBytesInUse();

      // Get local storage usage
      const localUsage = await chrome.storage.local.getBytesInUse();

      return {
        sync: {
          used: syncUsage,
          quota: this.SYNC_QUOTA,
          percentage: Math.round((syncUsage / this.SYNC_QUOTA) * 100)
        },
        local: {
          used: localUsage,
          quota: this.LOCAL_QUOTA,
          percentage: Math.round((localUsage / this.LOCAL_QUOTA) * 100)
        }
      };
    } catch (error) {
      handleStorageError(error);
    }
  }

  /**
   * Clear all extension data
   */
  async clearAllData(confirmation: string): Promise<void> {
    if (confirmation !== 'CONFIRM_DELETE_ALL') {
      throw new Error('Invalid confirmation string');
    }

    try {
      // Clear sync storage
      await chrome.storage.sync.clear();

      // Clear local storage
      await chrome.storage.local.clear();
    } catch (error) {
      handleStorageError(error);
    }
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  /**
   * Check if storage quota would be exceeded
   */
  private async checkStorageQuota(
    storageType: 'sync' | 'local',
    dataSize: number
  ): Promise<void> {
    const usage = await this.getStorageUsage();
    const storage = usage[storageType];

    if (storage.used + dataSize > storage.quota) {
      throw new StorageError(
        `Storage quota would be exceeded`,
        true,
        storageType
      );
    }
  }

  /**
   * Estimate object size in bytes
   */
  private estimateSize(obj: any): number {
    const str = JSON.stringify(obj);
    // Rough estimate: each character is 1 byte
    return new Blob([str]).size;
  }

  /**
   * Normalize LinkedIn URL for comparison
   */
  private normalizeLinkedInUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove query params and trailing slashes
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/$/, '');
    } catch {
      // If URL parsing fails, just normalize the string
      return url.toLowerCase().trim().replace(/\/$/, '');
    }
  }
}

// Create and export singleton instance
export const storageService = new StorageServiceImpl();

// Export for use in background message handler
export default storageService;