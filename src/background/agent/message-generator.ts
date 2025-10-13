/**
 * Message Generator Agent
 *
 * Uses LangChain to generate personalized cold outreach messages
 * based on LinkedIn profile analysis.
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import type { UserProfile } from '../../models/user-profile';
import type { TargetProfile } from '../../models/target-profile';
import type { ProfileAnalysis } from '../../models/profile-analysis';
import type { MessageDraft, Annotation, MessageEdit } from '../../models/message-draft';
import type { TonePreset, MessageLength } from '../../models/types';
import {
  MESSAGE_GENERATOR_SYSTEM_PROMPT,
  formatMessageGeneratorPrompt
} from './prompts/message-generator';
import { storageService } from '../../services/storage-service';

// Zod schema for structured output
const AnnotationSchema = z.object({
  text: z.string(),
  source: z.enum(['target_profile', 'user_profile', 'generated']),
  sourceField: z.string().nullable()
});

const MessageOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
  annotations: z.array(AnnotationSchema),
  wordCount: z.number()
});

export interface MessageGenerationOptions {
  tone: TonePreset;
  length: MessageLength;
  preserveEdits?: MessageEdit[];
}

export class MessageGeneratorAgent {
  private model: ChatOpenAI | null = null;
  private apiKey: string | null = null;

  /**
   * Initialize the agent with OpenRouter API configuration
   */
  async initialize(): Promise<void> {
    try {
      // Get API key from extension settings
      const settings = await storageService.getSettings();

      if (!settings?.openrouterApiKey) {
        throw new Error('OpenRouter API key not configured');
      }

      this.apiKey = settings.openrouterApiKey;

      // Initialize ChatOpenAI with OpenRouter configuration
      this.model = new ChatOpenAI({
        modelName: settings.openrouterModel || 'openai/gpt-4o',
        temperature: 0.8, // Slightly higher for creative message generation
        maxTokens: 1500,
        openAIApiKey: this.apiKey,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': chrome.runtime.getURL(''),
            'X-Title': 'Colder - LinkedIn Outreach Assistant'
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize MessageGeneratorAgent:', error);
      throw error;
    }
  }

  /**
   * Generate a personalized message based on profile analysis
   * FR-004, FR-005, FR-006, FR-007
   */
  async generateMessage(
    targetProfile: TargetProfile,
    userProfile: UserProfile,
    _analysis: ProfileAnalysis,
    options: MessageGenerationOptions
  ): Promise<MessageDraft> {
    if (!this.model) {
      await this.initialize();
    }

    if (!this.model) {
      throw new Error('Failed to initialize LLM model');
    }

    const startTime = Date.now();

    try {
      // Format the prompt with profile data
      const userPrompt = formatMessageGeneratorPrompt(
        targetProfile.rawProfileText || '',
        {
          name: userProfile.name,
          currentRole: userProfile.currentRole,
          currentCompany: userProfile.currentCompany,
          professionalBackground: userProfile.professionalBackground,
          valueProposition: userProfile.valueProposition,
          outreachObjectives: userProfile.outreachObjectives || ''
        },
        {
          tone: options.tone,
          length: options.length
        }
      );

      // Call the model
      const messages = [
        new SystemMessage(MESSAGE_GENERATOR_SYSTEM_PROMPT),
        new HumanMessage(userPrompt)
      ];

      const response = await this.model.invoke(messages);

      // Parse the JSON response
      let messageData;
      try {
        const content = response.content.toString();
        // Extract JSON from the response (handle markdown code blocks if present)
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/({[\s\S]*})/);
        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        messageData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse LLM response:', parseError);
        // Fallback to plain text extraction
        messageData = this.extractPlainTextMessage(response.content.toString());
      }

      // Validate with Zod schema
      const validatedData = MessageOutputSchema.parse(messageData);

      // Generate unique ID
      const draftId = this.generateDraftId();

      // Create MessageDraft object
      const messageDraft: MessageDraft = {
        id: draftId,
        targetProfileId: targetProfile.id,
        analysisId: `${targetProfile.id}_${userProfile.id}`,
        subject: validatedData.subject,
        body: validatedData.body,
        annotations: validatedData.annotations.map(ann => ({
          ...ann,
          highlight: ann.source === 'target_profile' // Highlight target references
        })) as Annotation[],
        tone: options.tone,
        length: options.length,
        generatedAt: new Date(),
        modelUsed: this.model.model || 'openai/gpt-4o',
        tokensUsed: response.usage_metadata?.total_tokens || 0,
        generationTime: Date.now() - startTime,
        manualEdits: options.preserveEdits || [],
        version: 1
      };

      // Validate message quality (SC-002: at least 2 target references)
      const targetReferences = messageDraft.annotations.filter(
        a => a.source === 'target_profile'
      );

      if (targetReferences.length < 2) {
        console.warn('Generated message has fewer than 2 target references');
        // Add a caution annotation
        messageDraft.annotations.push({
          text: 'Note: Consider adding more specific references to the target profile',
          source: 'generated',
          sourceField: null,
          highlight: false
        });
      }

      // Save the draft
      await storageService.saveMessageDraft(messageDraft);

      return messageDraft;

    } catch (error) {
      console.error('Message generation failed:', error);
      throw new Error(`Failed to generate message: ${error}`);
    }
  }

  /**
   * Regenerate message with different tone
   * FR-006
   */
  async changeTone(
    currentDraft: MessageDraft,
    newTone: TonePreset,
    targetProfile: TargetProfile,
    userProfile: UserProfile,
    analysis: ProfileAnalysis
  ): Promise<MessageDraft> {
    const newDraft = await this.generateMessage(
      targetProfile,
      userProfile,
      analysis,
      {
        tone: newTone,
        length: currentDraft.length,
        preserveEdits: currentDraft.manualEdits
      }
    );

    // Increment version
    newDraft.version = currentDraft.version + 1;

    // Add edit history entry
    newDraft.manualEdits.push({
      timestamp: new Date(),
      oldText: currentDraft.body,
      newText: newDraft.body,
      editType: 'tone_change'
    });

    return newDraft;
  }

  /**
   * Regenerate message with different length
   * FR-007
   */
  async changeLength(
    currentDraft: MessageDraft,
    newLength: MessageLength,
    targetProfile: TargetProfile,
    userProfile: UserProfile,
    analysis: ProfileAnalysis
  ): Promise<MessageDraft> {
    const newDraft = await this.generateMessage(
      targetProfile,
      userProfile,
      analysis,
      {
        tone: currentDraft.tone,
        length: newLength,
        preserveEdits: currentDraft.manualEdits
      }
    );

    // Increment version
    newDraft.version = currentDraft.version + 1;

    // Add edit history entry
    newDraft.manualEdits.push({
      timestamp: new Date(),
      oldText: currentDraft.body,
      newText: newDraft.body,
      editType: 'length_change'
    });

    return newDraft;
  }

  /**
   * Extract plain text message as fallback
   */
  private extractPlainTextMessage(content: string): any {
    // Simple fallback parser for when JSON parsing fails
    const lines = content.split('\n').filter(l => l.trim());

    return {
      subject: lines[0] || 'Connection Request',
      body: lines.slice(1).join('\n') || content,
      annotations: [{
        text: content,
        source: 'generated',
        sourceField: null
      }],
      wordCount: content.split(/\s+/).length
    };
  }

  /**
   * Generate unique draft ID
   */
  private generateDraftId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

}

// Export singleton instance
export const messageGeneratorAgent = new MessageGeneratorAgent();