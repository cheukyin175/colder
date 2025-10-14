/**
 * Message Service
 *
 * Orchestrates message generation, customization, and management.
 */

import type { UserProfile } from '../models/user-profile';
import type { ProfileAnalysis } from '../models/profile-analysis';
import type { MessageDraft, MessageEdit } from '../models/message-draft';
import type { TonePreset, MessageLength } from '../models/types';
import { storageService } from './storage-service';

export interface GenerateMessageOptions {
  tone?: TonePreset;
  length?: MessageLength;
}

export class MessageService {
  /**
   * Generate a new message based on profile analysis
   * FR-004, FR-005, SC-002
   */
  async generateMessage(
    analysis: ProfileAnalysis,
    userProfile: UserProfile,
    options: GenerateMessageOptions = {}
  ): Promise<MessageDraft> {
    try {
      // Import agents dynamically to avoid circular dependencies
      const { messageGeneratorAgent } = await import('../background/agent/message-generator');

      // Get target profile
      const targetProfile = await storageService.getTargetProfile(analysis.targetProfileId);
      if (!targetProfile) {
        throw new Error('Target profile not found');
      }

      // Use defaults from user profile if not specified
      const tone = options.tone || userProfile.defaultTone || 'professional';
      const length = options.length || userProfile.defaultLength || 'medium';

      // Generate the message
      const messageDraft = await messageGeneratorAgent.generateMessage(
        targetProfile,
        userProfile,
        analysis,
        { tone, length }
      );

      // Validate the message meets requirements
      if (!this.validateMessage(messageDraft)) {
        console.warn('Generated message does not meet validation requirements');
      }

      return messageDraft;

    } catch (error) {
      console.error('Failed to generate message:', error);
      throw new Error(`Message generation failed: ${error}`);
    }
  }

  /**
   * Validate that message meets requirements
   * SC-002: At least 2 target profile references
   */
  validateMessage(draft: MessageDraft): boolean {
    if (!draft.annotations) return false;

    const targetReferences = draft.annotations.filter(
      ann => ann.source === 'target_profile'
    );

    return targetReferences.length >= 2;
  }

  /**
   * Change the tone of an existing message
   * FR-006
   */
  async changeTone(
    draftId: string,
    newTone: TonePreset
  ): Promise<MessageDraft> {
    try {
      // Get the current draft
      const currentDraft = await storageService.getMessageDraft(draftId);
      if (!currentDraft) {
        throw new Error('Message draft not found');
      }

      // Get related data
      const userProfile = await storageService.getUserProfile();
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const analysis = await storageService.getProfileAnalysis(currentDraft.analysisId);
      if (!analysis) {
        throw new Error('Profile analysis not found');
      }

      const targetProfile = await storageService.getTargetProfile(currentDraft.targetProfileId);
      if (!targetProfile) {
        throw new Error('Target profile not found');
      }

      // Import agent and regenerate with new tone
      const { messageGeneratorAgent } = await import('../background/agent/message-generator');

      const newDraft = await messageGeneratorAgent.changeTone(
        currentDraft,
        newTone,
        targetProfile,
        userProfile,
        analysis
      );

      // Save the updated draft
      await storageService.saveMessageDraft(newDraft);

      return newDraft;

    } catch (error) {
      console.error('Failed to change message tone:', error);
      throw new Error(`Tone change failed: ${error}`);
    }
  }

  /**
   * Change the length of an existing message
   * FR-007
   */
  async changeLength(
    draftId: string,
    newLength: MessageLength
  ): Promise<MessageDraft> {
    try {
      // Get the current draft
      const currentDraft = await storageService.getMessageDraft(draftId);
      if (!currentDraft) {
        throw new Error('Message draft not found');
      }

      // Get related data
      const userProfile = await storageService.getUserProfile();
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const analysis = await storageService.getProfileAnalysis(currentDraft.analysisId);
      if (!analysis) {
        throw new Error('Profile analysis not found');
      }

      const targetProfile = await storageService.getTargetProfile(currentDraft.targetProfileId);
      if (!targetProfile) {
        throw new Error('Target profile not found');
      }

      // Import agent and regenerate with new length
      const { messageGeneratorAgent } = await import('../background/agent/message-generator');

      const newDraft = await messageGeneratorAgent.changeLength(
        currentDraft,
        newLength,
        targetProfile,
        userProfile,
        analysis
      );

      // Save the updated draft
      await storageService.saveMessageDraft(newDraft);

      return newDraft;

    } catch (error) {
      console.error('Failed to change message length:', error);
      throw new Error(`Length change failed: ${error}`);
    }
  }

  /**
   * Save manual edits to a message
   * FR-008
   */
  async saveManualEdit(
    draftId: string,
    newBody: string
  ): Promise<MessageDraft> {
    try {
      const draft = await storageService.getMessageDraft(draftId);
      if (!draft) {
        throw new Error('Message draft not found');
      }

      // Create edit entry
      const edit: MessageEdit = {
        timestamp: new Date(),
        oldText: draft.body,
        newText: newBody,
        editType: 'manual'
      };

      // Update draft
      draft.body = newBody;
      draft.manualEdits.push(edit);
      draft.version += 1;

      // Save updated draft
      await storageService.saveMessageDraft(draft);

      return draft;

    } catch (error) {
      console.error('Failed to save manual edit:', error);
      throw new Error(`Save edit failed: ${error}`);
    }
  }

  /**
   * Copy message to clipboard
   * FR-009
   */
  async copyToClipboard(draft: MessageDraft): Promise<boolean> {
    try {
      // Format message for LinkedIn
      const formattedMessage = this.formatForLinkedIn(draft);

      // Copy to clipboard
      await navigator.clipboard.writeText(formattedMessage);

      // Record outreach history (minimal for MVP)
      const targetProfile = await storageService.getTargetProfile(draft.targetProfileId);
      if (targetProfile) {
        await storageService.saveOutreachHistory({
          id: this.generateHistoryId(),
          targetName: targetProfile.name,
          targetLinkedinUrl: targetProfile.linkedinUrl,
          contactedAt: new Date(),
          expiresAt: this.calculateExpirationDate()
        });
      }

      return true;

    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Format message for LinkedIn messaging
   */
  private formatForLinkedIn(draft: MessageDraft): string {
    // LinkedIn doesn't use subject lines in messages
    // Just return the body text
    return draft.body;
  }

  /**
   * Generate unique history ID
   */
  private generateHistoryId(): string {
    return `history_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Calculate expiration date based on subscription plan
   */
  private async calculateExpirationDate(): Promise<Date | null> {
    const subscription = await storageService.getSubscriptionPlan();

    if (subscription?.plan === 'paid') {
      return null; // No expiration for paid plan
    }

    // Free plan: 5 days retention
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 5);
    return expirationDate;
  }

  /**
   * Test OpenRouter API connection
   */
  async testApiConnection(): Promise<boolean> {
    try {
      const { profileAnalyzerAgent } = await import('../background/agent/profile-analyzer');
      return await profileAnalyzerAgent.testConnection();
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const messageService = new MessageService();