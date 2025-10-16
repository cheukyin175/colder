/**
 * Chrome Built-in AI Service
 * Wrapper for Chrome's Prompt API (Gemini Nano)
 */

import { formatMessageGeneratorPrompt, formatPolishPrompt, type MessageGeneratorOptions, type UserProfile } from './prompts';

// Type definitions for Chrome AI API (Chrome 128+)
declare global {
  // New API (Chrome 128+)
  const LanguageModel: {
    availability: () => Promise<'available' | 'downloadable' | 'no'>;
    create: (options?: {
      temperature?: number;
      topK?: number;
      signal?: AbortSignal;
      systemPrompt?: string;
      outputLanguage?: string;
      initialPrompts?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
      monitor?: (monitor: any) => void;
    }) => Promise<AILanguageModel>;
  };

  // Legacy API (Chrome 127 and earlier) - kept for backward compatibility
  interface Window {
    ai?: {
      languageModel?: {
        capabilities: () => Promise<{
          available: 'readily' | 'after-download' | 'no';
          defaultTemperature?: number;
          defaultTopK?: number;
          maxTopK?: number;
        }>;
        create: (options?: {
          temperature?: number;
          topK?: number;
          signal?: AbortSignal;
          systemPrompt?: string;
          initialPrompts?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
          monitor?: (monitor: any) => void;
        }) => Promise<AILanguageModel>;
      };
    };
  }

  interface AILanguageModel {
    prompt: (input: string, options?: { signal?: AbortSignal }) => Promise<string>;
    promptStreaming: (input: string) => ReadableStream;
    countPromptTokens: (input: string) => Promise<number>;
    clone: () => Promise<AILanguageModel>;
    destroy: () => void;
  }
}

export interface TargetProfile {
  id: string;
  linkedinUrl: string;
  name: string;
  currentJobTitle?: string;
  currentCompany?: string;
  rawProfileText: string;
  extractedAt: Date;
}

export interface MessageDraft {
  id: string;
  body: string;
  wordCount: number;
  generatedAt: Date;
  tone: string;
  length: string;
}

export interface PolishedMessage {
  body: string;
  wordCount: number;
  changes: string;
}

class ChromeAIService {
  private session: AILanguageModel | null = null;
  private isInitializing = false;

  /**
   * Check if Chrome AI is available
   */
  async checkAvailability(): Promise<{
    available: boolean;
    status: 'readily' | 'after-download' | 'no';
    message: string;
  }> {
    try {
      // Try new API first (Chrome 128+)
      if (typeof LanguageModel !== 'undefined') {
        const availability = await LanguageModel.availability();

        if (availability === 'no') {
          return {
            available: false,
            status: 'no',
            message: 'Chrome AI is not available on this device.'
          };
        }

        if (availability === 'downloadable') {
          return {
            available: true,
            status: 'after-download',
            message: 'Chrome AI model needs to be downloaded. Click Generate to start download (~22GB, 10-30 min).'
          };
        }

        return {
          available: true,
          status: 'readily',
          message: 'Chrome AI is ready to use!'
        };
      }

      // Fallback to legacy API (Chrome 127 and earlier)
      if (window.ai?.languageModel) {
        const capabilities = await window.ai.languageModel.capabilities();

        if (capabilities.available === 'no') {
          return {
            available: false,
            status: 'no',
            message: 'Chrome AI is not available on this device.'
          };
        }

        if (capabilities.available === 'after-download') {
          return {
            available: true,
            status: 'after-download',
            message: 'Chrome AI model needs to be downloaded. This will happen automatically on first use.'
          };
        }

        return {
          available: true,
          status: 'readily',
          message: 'Chrome AI is ready to use!'
        };
      }

      // Neither API is available
      return {
        available: false,
        status: 'no',
        message: 'Chrome AI is not supported. Enable chrome://flags/#prompt-api-for-gemini-nano-multimodal-input and restart Chrome.'
      };
    } catch (error) {
      console.error('Error checking AI availability:', error);
      return {
        available: false,
        status: 'no',
        message: 'Error checking AI availability. Make sure Chrome AI is enabled in chrome://flags'
      };
    }
  }

  /**
   * Create or get AI session
   */
  private async getSession(): Promise<AILanguageModel> {
    if (this.session) {
      return this.session;
    }

    if (this.isInitializing) {
      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getSession();
    }

    this.isInitializing = true;

    try {
      // Try new API first (Chrome 128+)
      if (typeof LanguageModel !== 'undefined') {
        this.session = await LanguageModel.create({
          temperature: 0.8,
          topK: 40,
          outputLanguage: 'en', // Required in new API
          monitor: (m) => {
            m.addEventListener('downloadprogress', (e: any) => {
              console.log(`AI Model downloading: ${Math.round(e.loaded * 100)}%`);
            });
          }
        });

        return this.session;
      }

      // Fallback to legacy API
      if (window.ai?.languageModel) {
        this.session = await window.ai.languageModel.create({
          temperature: 0.8,
          topK: 40,
          monitor: (m) => {
            m.addEventListener('downloadprogress', (e: any) => {
              console.log(`AI Model downloading: ${Math.round(e.loaded * 100)}%`);
            });
          }
        });

        return this.session;
      }

      throw new Error('Chrome AI is not available');
    } catch (error) {
      console.error('Error creating AI session:', error);
      throw new Error('Failed to create AI session. Please check Chrome AI availability.');
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Generate a personalized LinkedIn message
   */
  async generateMessage(
    targetProfile: TargetProfile,
    userProfile: UserProfile,
    options: MessageGeneratorOptions
  ): Promise<MessageDraft> {
    try {
      const session = await this.getSession();

      const prompt = formatMessageGeneratorPrompt(
        targetProfile.rawProfileText,
        userProfile,
        options
      );

      const response = await session.prompt(prompt);

      // Parse the JSON response
      let parsedResponse;
      try {
        // Remove markdown code blocks if present
        const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsedResponse = JSON.parse(cleanedResponse);
      } catch (e) {
        console.error('Failed to parse AI response:', response);
        throw new Error('Failed to parse AI response. Please try again.');
      }

      const wordCount = parsedResponse.wordCount || parsedResponse.body.split(/\s+/).length;

      return {
        id: `draft_${Date.now()}`,
        body: parsedResponse.body,
        wordCount,
        generatedAt: new Date(),
        tone: options.tone,
        length: options.length
      };
    } catch (error: any) {
      console.error('Message generation failed:', error);
      throw new Error(error.message || 'Failed to generate message');
    }
  }

  /**
   * Polish an existing message based on user feedback
   */
  async polishMessage(
    originalMessage: string,
    userFeedback: string,
    options: Pick<MessageGeneratorOptions, 'tone' | 'length'>
  ): Promise<PolishedMessage> {
    try {
      const session = await this.getSession();

      const prompt = formatPolishPrompt(originalMessage, userFeedback, options);
      const response = await session.prompt(prompt);

      // Parse the JSON response
      let parsedResponse;
      try {
        const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsedResponse = JSON.parse(cleanedResponse);
      } catch (e) {
        console.error('Failed to parse AI response:', response);
        throw new Error('Failed to parse AI response. Please try again.');
      }

      const wordCount = parsedResponse.wordCount || parsedResponse.body.split(/\s+/).length;

      return {
        body: parsedResponse.body,
        wordCount,
        changes: parsedResponse.changes || 'Message refined based on your feedback'
      };
    } catch (error: any) {
      console.error('Message polishing failed:', error);
      throw new Error(error.message || 'Failed to polish message');
    }
  }

  /**
   * Regenerate a message with the same parameters
   */
  async regenerateMessage(
    targetProfile: TargetProfile,
    userProfile: UserProfile,
    options: MessageGeneratorOptions
  ): Promise<MessageDraft> {
    // For regeneration, we'll create a new session to get fresh results
    await this.destroySession();
    return this.generateMessage(targetProfile, userProfile, options);
  }

  /**
   * Destroy the current AI session
   */
  async destroySession(): Promise<void> {
    if (this.session) {
      try {
        this.session.destroy();
      } catch (e) {
        console.error('Error destroying session:', e);
      }
      this.session = null;
    }
  }

  /**
   * Get token count for a prompt
   */
  async countTokens(text: string): Promise<number> {
    try {
      const session = await this.getSession();
      return await session.countPromptTokens(text);
    } catch (error) {
      console.error('Error counting tokens:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const chromeAI = new ChromeAIService();
