/**
 * Profile Analyzer Agent
 *
 * Uses LangChain to analyze LinkedIn profiles and identify talking points
 * for personalized outreach.
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import type { UserProfile } from '../../models/user-profile';
import type { TargetProfile } from '../../models/target-profile';
import type { ProfileAnalysis, TalkingPoint } from '../../models/profile-analysis';
import {
  PROFILE_ANALYZER_SYSTEM_PROMPT,
  formatProfileAnalyzerPrompt
} from './prompts/profile-analyzer';
import { storageService } from '../../services/storage-service';

// Zod schema for structured output
const TalkingPointSchema = z.object({
  topic: z.string(),
  relevance: z.enum(['high', 'medium', 'low']),
  context: z.string(),
  sourceField: z.string()
});

const ProfileAnalysisOutputSchema = z.object({
  talkingPoints: z.array(TalkingPointSchema),
  mutualInterests: z.array(z.string()),
  connectionOpportunities: z.array(z.string()),
  suggestedApproach: z.string(),
  cautionFlags: z.array(z.string())
});

export class ProfileAnalyzerAgent {
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
        temperature: 0.7,
        maxTokens: 1000,
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
      console.error('Failed to initialize ProfileAnalyzerAgent:', error);
      throw error;
    }
  }

  /**
   * Analyze a LinkedIn profile for outreach opportunities
   * FR-003: Analyze target profile and identify talking points
   */
  async analyzeProfile(
    targetProfile: TargetProfile,
    userProfile: UserProfile
  ): Promise<ProfileAnalysis> {
    if (!this.model) {
      await this.initialize();
    }

    if (!this.model) {
      throw new Error('Failed to initialize LLM model');
    }

    const startTime = Date.now();

    try {
      // Format the prompt with profile data
      const userPrompt = formatProfileAnalyzerPrompt(
        targetProfile.rawProfileText || '',
        {
          name: userProfile.name,
          currentRole: userProfile.currentRole,
          currentCompany: userProfile.currentCompany,
          professionalBackground: userProfile.professionalBackground,
          careerGoals: userProfile.careerGoals || '',
          valueProposition: userProfile.valueProposition
        }
      );

      // Call the model with structured output
      const messages = [
        new SystemMessage(PROFILE_ANALYZER_SYSTEM_PROMPT),
        new HumanMessage(userPrompt)
      ];

      const response = await this.model.invoke(messages);

      // Parse the JSON response
      let analysisData;
      try {
        const content = response.content.toString();
        // Extract JSON from the response (handle markdown code blocks if present)
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/({[\s\S]*})/);
        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        analysisData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse LLM response:', parseError);
        throw new Error('Invalid response format from LLM');
      }

      // Validate with Zod schema
      const validatedData = ProfileAnalysisOutputSchema.parse(analysisData);

      // Create ProfileAnalysis object
      const analysis: ProfileAnalysis = {
        targetProfileId: targetProfile.id,
        userProfileId: userProfile.id,
        talkingPoints: validatedData.talkingPoints as TalkingPoint[],
        mutualInterests: validatedData.mutualInterests,
        connectionOpportunities: validatedData.connectionOpportunities,
        suggestedApproach: validatedData.suggestedApproach,
        cautionFlags: validatedData.cautionFlags,
        analyzedAt: new Date(),
        modelUsed: this.model.model || 'openai/gpt-4o',
        tokensUsed: response.usage_metadata?.total_tokens || 0,
        analysisTime: Date.now() - startTime
      };

      // Cache the analysis
      await storageService.cacheProfileAnalysis(analysis);

      return analysis;

    } catch (error) {
      console.error('Profile analysis failed:', error);

      // Return a minimal analysis on error
      const fallbackAnalysis: ProfileAnalysis = {
        targetProfileId: targetProfile.id,
        userProfileId: userProfile.id,
        talkingPoints: [],
        mutualInterests: [],
        connectionOpportunities: [],
        suggestedApproach: 'Unable to analyze profile. Please try again.',
        cautionFlags: ['Analysis failed - limited profile insights available'],
        analyzedAt: new Date(),
        modelUsed: 'error',
        tokensUsed: 0,
        analysisTime: Date.now() - startTime
      };

      return fallbackAnalysis;
    }
  }

  /**
   * Test the connection to OpenRouter API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.initialize();

      if (!this.model) {
        return false;
      }

      // Simple test prompt
      const response = await this.model.invoke([
        new HumanMessage('Say "connection successful" if you can read this.')
      ]);

      return response.content.toString().toLowerCase().includes('connection successful');
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const profileAnalyzerAgent = new ProfileAnalyzerAgent();