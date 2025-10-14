/**
 * Profile Analyzer Agent (No LangChain)
 *
 * Analyzes LinkedIn profiles using a direct OpenRouter API call.
 */

import { z } from "zod";
import type { UserProfile } from "../../models/user-profile";
import type { TargetProfile } from "../../models/target-profile";
import type {
	ProfileAnalysis,
	TalkingPoint,
} from "../../models/profile-analysis";
import {
	PROFILE_ANALYZER_SYSTEM_PROMPT,
	formatProfileAnalyzerPrompt,
} from "./prompts/profile-analyzer";
import { storageService } from "../../services/storage-service";

// Zod schema for structured output
const TalkingPointSchema = z.object({
	topic: z.string(),
	relevance: z.enum(["high", "medium", "low"]),
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

	async analyzeProfile(
		targetProfile: TargetProfile,
		userProfile: UserProfile
	): Promise<ProfileAnalysis> {
		const startTime = Date.now();
		try {
			await this.initialize();
			if (!this.apiKey) throw new Error("API key is not initialized.");

			const userPrompt = formatProfileAnalyzerPrompt(
				targetProfile.rawProfileText || "",
				{
					name: userProfile.name,
					currentRole: userProfile.currentRole,
					currentCompany: userProfile.currentCompany,
					professionalBackground: userProfile.professionalBackground,
					careerGoals: userProfile.careerGoals || "",
					valueProposition: userProfile.valueProposition,
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
							{ role: "system", content: PROFILE_ANALYZER_SYSTEM_PROMPT },
							{ role: "user", content: userPrompt },
						],
						temperature: 0.7,
						max_tokens: 1000,
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

			const analysisData = JSON.parse(content);
			const validatedData = ProfileAnalysisOutputSchema.parse(analysisData);

			const analysis: ProfileAnalysis = {
				targetProfileId: targetProfile.id,
				userProfileId: userProfile.id,
				talkingPoints: validatedData.talkingPoints as TalkingPoint[],
				mutualInterests: validatedData.mutualInterests,
				connectionOpportunities: validatedData.connectionOpportunities,
				suggestedApproach: validatedData.suggestedApproach,
				cautionFlags: validatedData.cautionFlags,
				analyzedAt: new Date(),
				modelUsed: this.modelName,
				tokensUsed: responseData.usage?.total_tokens || 0,
				analysisTime: Date.now() - startTime,
			};

			await storageService.cacheProfileAnalysis(analysis);
			return analysis;
		} catch (error) {
			// Create a fallback analysis object on error
			return {
				targetProfileId: targetProfile.id,
				userProfileId: userProfile.id,
				talkingPoints: [],
				mutualInterests: [],
				connectionOpportunities: [],
				suggestedApproach: "Unable to analyze profile. Please try again.",
				cautionFlags: ["Analysis failed - limited profile insights available"],
				analyzedAt: new Date(),
				modelUsed: "error",
				tokensUsed: 0,
				analysisTime: Date.now() - startTime,
			};
		}
	}
}

export const profileAnalyzerAgent = new ProfileAnalyzerAgent();
