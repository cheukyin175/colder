import { z } from 'zod';
import type { UserProfile, TargetProfile, ProfileAnalysis, MessageDraft, Annotation, TonePreset, MessageLength } from '../models';
import {
  MESSAGE_GENERATOR_SYSTEM_PROMPT,
  formatMessageGeneratorPrompt,
} from './prompts/message-generator';

// Zod schemas for validation
const AnnotationSchema = z.object({
  text: z.string(),
  source: z.enum(['target_profile', 'user_profile', 'generated']),
  sourceField: z.string().nullable(),
});

const MessageOutputSchema = z.object({
  subject: z.string().optional().nullable(),
  body: z.string(),
  annotations: z.array(AnnotationSchema),
  wordCount: z.number(),
});

export interface MessageGenerationOptions {
  tone: TonePreset;
  length: MessageLength;
}

export class MessageGeneratorAgent {
  /**
   * Generates a personalized message using a direct API call.
   * This agent is stateless.
   */
  async generateMessage(
    targetProfile: TargetProfile,
    userProfile: UserProfile,
    analysis: ProfileAnalysis,
    options: MessageGenerationOptions,
    apiKey: string,
    modelName: string,
  ): Promise<MessageDraft> {
    const startTime = Date.now();
    try {
      const userPrompt = formatMessageGeneratorPrompt(targetProfile.rawProfileText || '', userProfile as any, options);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: MESSAGE_GENERATOR_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const responseData = await response.json();
      const messageData = JSON.parse(responseData.choices[0].message.content);
      const validatedData = MessageOutputSchema.parse(messageData);

      return {
        id: `draft_${Date.now()}`,
        targetProfileId: targetProfile.id,
        analysisId: `${targetProfile.id}_${userProfile.id}`,
        ...validatedData,
        annotations: validatedData.annotations.map(ann => ({ ...ann, highlight: ann.source === 'target_profile' })) as Annotation[],
        tone: options.tone,
        length: options.length,
        generatedAt: new Date(),
        modelUsed: modelName,
        tokensUsed: responseData.usage?.total_tokens || 0,
        generationTime: Date.now() - startTime,
        version: 1,
      };

    } catch (error: any) {
      console.error("Message generation failed:", error);
      throw new Error(`Failed to generate message: ${error.message}`);
    }
  }
}

export const messageGeneratorAgent = new MessageGeneratorAgent();
