import { z } from 'zod';
import type { UserProfile, TargetProfile, ProfileAnalysis, TalkingPoint } from '../models';
import {
  PROFILE_ANALYZER_SYSTEM_PROMPT,
  formatProfileAnalyzerPrompt,
} from './prompts/profile-analyzer';

// Zod schemas for validation (remain the same)
const TalkingPointSchema = z.object({
  topic: z.string(),
  relevance: z.enum(['high', 'medium', 'low']),
  context: z.string(),
  sourceField: z.string(),
});

const ProfileAnalysisOutputSchema = z.object({
  talkingPoints: z.array(TalkingPointSchema),
  mutualInterests: z.array(z.string()),
  connectionOpportunities: z.array(z.string()),
  suggestedApproach: z.string(),
  cautionFlags: z.array(z.string()),
});

export class ProfileAnalyzerAgent {
  /**
   * Analyzes a LinkedIn profile using a direct API call.
   * This agent is now stateless and relies on the calling service for configuration.
   */
  async analyzeProfile(
    targetProfile: TargetProfile,
    userProfile: UserProfile,
    apiKey: string,
    modelName: string,
  ): Promise<ProfileAnalysis> {
    const startTime = Date.now();
    try {
      const userPrompt = formatProfileAnalyzerPrompt(targetProfile.rawProfileText || '', userProfile as any);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: PROFILE_ANALYZER_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const responseData = await response.json();
      const analysisData = JSON.parse(responseData.choices[0].message.content);
      const validatedData = ProfileAnalysisOutputSchema.parse(analysisData);

      return {
        targetProfileId: targetProfile.id,
        userProfileId: userProfile.id,
        ...validatedData,
        analyzedAt: new Date(),
        modelUsed: modelName,
        tokensUsed: responseData.usage?.total_tokens || 0,
        analysisTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error("Profile analysis failed:", error);
      throw new Error("Failed to analyze profile.");
    }
  }
}

export const profileAnalyzerAgent = new ProfileAnalyzerAgent();
