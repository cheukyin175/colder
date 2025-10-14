/**
 * Message Generator Agent (No LangChain)
 *
 * Generates personalized cold outreach messages based on LinkedIn profile analysis
 * using a direct OpenRouter API call.
 */

import { z } from "zod";
import type { UserProfile } from "../../models/user-profile";
import type { TargetProfile } from "../../models/target-profile";
import type { ProfileAnalysis } from "../../models/profile-analysis";
import type {
	MessageDraft,
	Annotation,
	MessageEdit,
} from "../../models/message-draft";
import type { TonePreset, MessageLength } from "../../models/types";
import {
	MESSAGE_GENERATOR_SYSTEM_PROMPT,
	formatMessageGeneratorPrompt,
} from "./prompts/message-generator";
import { storageService } from "../../services/storage-service";

// Zod schema for structured output
const AnnotationSchema = z.object({
	text: z.string(),
	source: z.enum(["target_profile", "user_profile", "generated"]),
	sourceField: z.string().nullable(),
});

const MessageOutputSchema = z.object({
	subject: z.string(),
	body: z.string(),
	annotations: z.array(AnnotationSchema),
	wordCount: z.number(),
});

export interface MessageGenerationOptions {
	tone: TonePreset;
	length: MessageLength;
	preserveEdits?: MessageEdit[];
}

export class MessageGeneratorAgent {
	private apiKey: string | null = null;
	private modelName: string = "google/gemini-2.5-flash";

	private async initialize(): Promise<void> {
		if (this.apiKey) return;
		try {
			const settings = await storageService.getSettings();
			if (!settings?.openrouterApiKey) {
				throw new Error("OpenRouter API key not configured");
			}
			this.apiKey = settings.openrouterApiKey;
			this.modelName = settings.openrouterModel || this.modelName;
		} catch (error) {
			throw error; // Re-throw to be caught by the caller
		}
	}

	async generateMessage(
		targetProfile: TargetProfile,
		userProfile: UserProfile,
		_analysis: ProfileAnalysis,
		options: MessageGenerationOptions
	): Promise<MessageDraft> {
		const startTime = Date.now();
		try {
			await this.initialize();
			if (!this.apiKey) throw new Error("API key is not initialized.");

			const userPrompt = formatMessageGeneratorPrompt(
				targetProfile.rawProfileText || "",
				{
					name: userProfile.name,
					currentRole: userProfile.currentRole,
					currentCompany: userProfile.currentCompany,
					professionalBackground: userProfile.professionalBackground,
					valueProposition: userProfile.valueProposition,
					outreachObjectives: userProfile.outreachObjectives || "",
				},
				{
					tone: options.tone,
					length: options.length,
				}
			);

			const response = await fetch(
				"https://openrouter.ai/api/v1/chat/completions",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
						"Content-Type": "application/json",
						"HTTP-Referer": chrome.runtime.getURL(""),
						"X-Title": "Colder - LinkedIn Outreach Assistant",
					},
					body: JSON.stringify({
						model: this.modelName,
						messages: [
							{ role: "system", content: MESSAGE_GENERATOR_SYSTEM_PROMPT },
							{ role: "user", content: userPrompt },
						],
						temperature: 0.8,
						max_tokens: 1500,
						response_format: { type: "json_object" },
					}),
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`API request failed with status ${response.status}: ${
						errorData.error?.message || "Unknown error"
					}`
				);
			}

			const responseData = await response.json();
			const content = responseData.choices[0].message.content;

			let messageData;
			try {
				messageData = JSON.parse(content);
			} catch (parseError) {
				messageData = this.extractPlainTextMessage(content);
			}

			const validatedData = MessageOutputSchema.parse(messageData);
			const draftId = this.generateDraftId();

			const messageDraft: MessageDraft = {
				id: draftId,
				targetProfileId: targetProfile.id,
				analysisId: `${targetProfile.id}_${userProfile.id}`,
				subject: validatedData.subject,
				body: validatedData.body,
				annotations: validatedData.annotations.map((ann) => ({
					...ann,
					highlight: ann.source === "target_profile",
				})) as Annotation[],
				tone: options.tone,
				length: options.length,
				generatedAt: new Date(),
				modelUsed: this.modelName,
				tokensUsed: responseData.usage?.total_tokens || 0,
				generationTime: Date.now() - startTime,
				manualEdits: options.preserveEdits || [],
				version: 1,
			};

			await storageService.saveMessageDraft(messageDraft);
			return messageDraft;
		} catch (error: any) {
			throw new Error(`Failed to generate message: ${error.message}`);
		}
	}

	private extractPlainTextMessage(content: string): any {
		const lines = content.split("\n").filter((l) => l.trim());
		return {
			subject: lines[0] || "Connection Request",
			body: lines.slice(1).join("\n") || content,
			annotations: [{ text: content, source: "generated", sourceField: null }],
			wordCount: content.split(/\s+/).length,
		};
	}

	private generateDraftId(): string {
		return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}
}

export const messageGeneratorAgent = new MessageGeneratorAgent();
